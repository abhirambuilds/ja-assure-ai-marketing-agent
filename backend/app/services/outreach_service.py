from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import select, desc
from sqlalchemy.orm import Session

from app.config import Settings, settings as global_settings
from app.models.entities import (
    FollowUp,
    Lead,
    OutreachMessage,
    ReviewDecision,
    SuppressionEntry,
    utc_now,
)
from app.services.cadence.generator import CadenceGenerator
from app.services.email import (
    EmailMessage,
    EmailProvider,
    get_email_provider,
)
from app.services.replies.classifier import (
    ReplyClassification,
    ReplyClassifier,
    ReplyIntent,
)

logger = logging.getLogger("app.services.outreach")


def normalize_email(email: Optional[str]) -> Optional[str]:
    """Normalize email address to lowercase stripped format."""
    if not email:
        return None
    cleaned = email.strip().lower()
    return cleaned if "@" in cleaned else None


class OutreachService:
    """Orchestrates B2B email cadence generation, compliance validation,

    human review governance, suppression checks, and provider dispatch.
    """

    def __init__(
        self,
        settings: Optional[Settings] = None,
        email_provider: Optional[EmailProvider] = None,
    ):
        self.settings = settings or global_settings
        self._provider = email_provider
        self.classifier = ReplyClassifier()

    @property
    def email_provider(self) -> EmailProvider:
        if self._provider is None:
            self._provider = get_email_provider(self.settings)
        return self._provider

    # -------------------------------------------------------------------------
    # 1. Outreach Generation (3-Touch Cadence)
    # -------------------------------------------------------------------------
    def generate_outreach(
        self,
        db: Session,
        lead_id: int,
        actor: str = "ai_agent",
    ) -> OutreachMessage:
        """Generate a compliant 3-touch outreach sequence for a lead, setting status

        to pending_approval for mandatory human review.
        """
        lead = db.get(Lead, lead_id)
        if not lead:
            raise ValueError(f"Lead with id {lead_id} not found")

        # Extract contact name and role
        contact_name = lead.name or "Decision Maker"
        contact_role = None
        contact_email = normalize_email(lead.email)

        if lead.contacts_json:
            try:
                parsed_contacts = json.loads(lead.contacts_json)
                if isinstance(parsed_contacts, list) and parsed_contacts:
                    c = parsed_contacts[0]
                    if isinstance(c, dict):
                        contact_name = c.get("name") or contact_name
                        contact_role = c.get("role")
                        if not contact_email and c.get("email"):
                            contact_email = normalize_email(c.get("email"))
            except Exception:
                pass

        # Extract signals
        signal_descriptions: List[str] = []
        if lead.signals_json:
            try:
                parsed_signals = json.loads(lead.signals_json)
                if isinstance(parsed_signals, list):
                    for s in parsed_signals:
                        if isinstance(s, dict) and s.get("description"):
                            signal_descriptions.append(s["description"])
                        elif isinstance(s, str):
                            signal_descriptions.append(s)
            except Exception:
                pass

        brand = lead.recommended_brand or "jade"
        market = lead.country or lead.location or "Singapore"

        # Generate 3-Touch Sequence with forbidden phrase safety validation
        generator = CadenceGenerator(brand=brand)
        cadence = generator.generate(
            company_name=lead.company,
            contact_name=contact_name,
            contact_role=contact_role,
            market=market,
            signals=signal_descriptions,
            why_now=lead.why_now,
            fit_score=lead.fit_score or 75.0,
        )

        touches_payload = [
            {
                "step": t.step,
                "day": t.day,
                "label": t.label,
                "subject": t.subject,
                "body": t.body,
            }
            for t in cadence.touches
        ]

        outreach_msg = OutreachMessage(
            lead_id=lead.id,
            campaign_id=int(lead.campaign_id) if (lead.campaign_id and lead.campaign_id.isdigit()) else None,
            channel="email",
            direction="outbound",
            provider=self.settings.EMAIL_PROVIDER or "mock",
            sender=self.settings.SMTP_FROM_EMAIL or "no-reply@jaassure.com",
            recipient=contact_email,
            subject=cadence.subject,
            body=cadence.body,
            status="pending_approval",
            sequence_step=1,
            sequence_touches_json=json.dumps(touches_payload),
        )

        db.add(outreach_msg)
        lead.outreach_draft = cadence.body
        lead.status = "pending_approval"
        db.flush()

        logger.info("Generated 3-touch outreach draft for lead %d (%s) - status: pending_approval", lead.id, lead.company)
        return outreach_msg

    # -------------------------------------------------------------------------
    # 2. Human Approval Gate (HITL Governance)
    # -------------------------------------------------------------------------
    def approve_outreach(
        self,
        db: Session,
        message_id: int,
        actor: str = "human_reviewer",
        notes: Optional[str] = None,
    ) -> OutreachMessage:
        """Mandatory human review step. Advances outreach status to approved."""
        outreach = db.get(OutreachMessage, message_id)
        if not outreach:
            raise ValueError(f"Outreach message with id {message_id} not found")

        outreach.status = "approved"
        outreach.approved_by = actor
        outreach.approved_at = utc_now()

        lead = db.get(Lead, outreach.lead_id)
        if lead:
            lead.status = "approved"

        # Record in review_decisions for auditability
        review = ReviewDecision(
            asset_type="lead_outreach",
            asset_id=outreach.id,
            reviewer=actor,
            decision="approve",
            notes=notes or f"Outreach sequence step {outreach.sequence_step} approved for dispatch.",
            previous_status="pending_approval",
            new_status="approved",
        )
        db.add(review)
        db.flush()

        logger.info("Outreach %d approved by %s", outreach.id, actor)
        return outreach

    # -------------------------------------------------------------------------
    # 3. Outreach Send Execution (Strict Safety Pre-flight)
    # -------------------------------------------------------------------------
    def send_outreach(
        self,
        db: Session,
        message_id: int,
        *,
        dry_run: bool = False,
        provider: Optional[EmailProvider] = None,
    ) -> Dict[str, Any]:
        """Send an approved outreach message subject to strict safety invariants."""
        outreach = db.get(OutreachMessage, message_id)
        if not outreach:
            return {"sent": False, "reason": "outreach draft not found"}

        lead = db.get(Lead, outreach.lead_id)
        if not lead:
            return {"sent": False, "reason": "associated lead not found"}

        # Safety Gate 1: Human Approval Required
        if outreach.status != "approved":
            return {"sent": False, "reason": "human approval required"}

        # Safety Gate 2: Recipient Email Validation
        recipient = normalize_email(outreach.recipient or lead.email)
        if not recipient:
            return {"sent": False, "reason": "recipient email missing"}

        # Safety Gate 3: Suppression / Unsubscribe Check
        if self.is_suppressed(db, recipient):
            lead.status = "suppressed"
            outreach.status = "failed"
            outreach.error = "recipient email is suppressed / opted out"
            db.flush()
            return {"sent": False, "reason": "recipient is suppressed"}

        # Safety Gate 4: Dry-run Execution
        if dry_run:
            logger.info("Dry-run execution for outreach %d to %s", outreach.id, recipient)
            return {"sent": False, "reason": "dry-run"}

        # Safety Gate 5: Email Provider Selection & Safety Arming Check
        active_provider = provider or self.email_provider

        if active_provider.name != "mock":
            if not (self.settings.REAL_EMAIL_ENABLED and self.settings.REAL_PROVIDER_SEND):
                return {
                    "sent": False,
                    "reason": "Real email provider is not configured. Use mock mode or configure a provider.",
                }

        # Build message payload
        email_msg = EmailMessage(
            to=recipient,
            subject=outreach.subject,
            body=outreach.body,
            sender=outreach.sender or "no-reply@jaassure.com",
        )

        send_result = active_provider.send_message(email_msg)

        if not send_result.sent:
            outreach.status = "failed"
            outreach.error = send_result.error or "provider dispatch failed"
            db.flush()
            logger.error("Outreach %d send failed: %s", outreach.id, outreach.error)
            return {"sent": False, "reason": outreach.error}

        # Success: Update state and timestamps
        outreach.status = "sent"
        outreach.sent_at = utc_now()
        outreach.provider = active_provider.name
        outreach.provider_message_id = send_result.provider_message_id

        lead.status = "contacted"
        lead.last_contacted_at = outreach.sent_at

        # Schedule Touch 2 follow-up 4 days from now if part of a cadence
        if outreach.sequence_step == 1:
            scheduled_date = utc_now() + timedelta(days=4)
            touches = outreach.sequence_touches
            draft_2 = touches[1]["body"] if len(touches) > 1 else None
            self.schedule_followup(
                db=db,
                lead_id=lead.id,
                sequence_step=2,
                scheduled_at=scheduled_date,
                reason="Touch 2: Competitive Advantage & Warranty Comparison",
                draft_message=draft_2,
                campaign_id=outreach.campaign_id,
            )

        db.flush()
        logger.info("Outreach %d successfully sent via %s (Message-ID: %s)", outreach.id, active_provider.name, send_result.provider_message_id)
        return {"sent": True, "provider_message_id": send_result.provider_message_id}

    # -------------------------------------------------------------------------
    # 4. Inbound Reply Simulation & Classification
    # -------------------------------------------------------------------------
    def simulate_inbound_reply(
        self,
        db: Session,
        lead_id: int,
        message: str,
        sender: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Simulate an inbound reply from a prospect, running intent classification

        and executing automatic compliance actions (e.g. suppression upon opt-out).
        """
        lead = db.get(Lead, lead_id)
        if not lead:
            raise ValueError(f"Lead with id {lead_id} not found")

        reply_sender = normalize_email(sender) or normalize_email(lead.email) or "prospect@example.com"
        classification: ReplyClassification = self.classifier.classify(message)

        # Record inbound OutreachMessage
        inbound_msg = OutreachMessage(
            lead_id=lead.id,
            campaign_id=int(lead.campaign_id) if (lead.campaign_id and lead.campaign_id.isdigit()) else None,
            channel="email",
            direction="inbound",
            provider="mock",
            provider_message_id=f"inbound-reply-{lead.id}-{int(datetime.now(timezone.utc).timestamp())}",
            sender=reply_sender,
            recipient=self.settings.SMTP_FROM_EMAIL or "no-reply@jaassure.com",
            subject=f"Re: JA Assure - {lead.company}",
            body=message[:5000],
            status="replied",
            intent=classification.intent.value,
            intent_confidence=classification.confidence,
            sent_at=utc_now(),
        )
        db.add(inbound_msg)

        # Enforce compliance actions based on intent
        if classification.intent == ReplyIntent.UNSUBSCRIBE:
            self.add_suppression(
                db=db,
                email=reply_sender,
                reason="opted_out",
                source="inbound_reply",
            )
            lead.status = "suppressed"
            logger.info("Lead %d (%s) opted out. Added %s to suppression list.", lead.id, lead.company, reply_sender)
        elif classification.intent == ReplyIntent.BOUNCE:
            self.add_suppression(
                db=db,
                email=reply_sender,
                reason="bounced",
                source="inbound_bounce",
            )
            lead.status = "bounced"
        elif classification.intent == ReplyIntent.MEETING_REQUEST:
            lead.status = "meeting_requested"
        elif classification.intent == ReplyIntent.NEGATIVE:
            lead.status = "not_interested"
        else:
            lead.status = "replied"

        db.flush()
        return {
            "intent": classification.intent.value,
            "confidence": classification.confidence,
            "suggested_action": classification.suggested_action,
            "lead_status": lead.status,
            "message_id": inbound_msg.id,
        }

    # -------------------------------------------------------------------------
    # 5. Follow-up Cadence Scheduling
    # -------------------------------------------------------------------------
    def schedule_followup(
        self,
        db: Session,
        lead_id: int,
        sequence_step: int,
        scheduled_at: datetime,
        reason: str,
        draft_message: Optional[str] = None,
        campaign_id: Optional[int] = None,
    ) -> FollowUp:
        """Schedule a follow-up touchpoint in the cadence sequence."""
        follow_up = FollowUp(
            lead_id=lead_id,
            campaign_id=campaign_id,
            sequence_step=sequence_step,
            scheduled_at=scheduled_at,
            reason=reason,
            draft_message=draft_message,
            status="scheduled",
        )
        db.add(follow_up)
        db.flush()
        return follow_up

    # -------------------------------------------------------------------------
    # 6. Suppression / Unsubscribe Management
    # -------------------------------------------------------------------------
    def add_suppression(
        self,
        db: Session,
        email: str,
        reason: str = "opted_out",
        source: str = "manual",
    ) -> SuppressionEntry:
        """Add an email address to the suppression list to prevent future outbound sends."""
        normalized = normalize_email(email)
        if not normalized:
            raise ValueError("Valid email address is required for suppression")

        existing = db.execute(
            select(SuppressionEntry).where(SuppressionEntry.normalized_email == normalized)
        ).scalars().first()

        if existing:
            return existing

        entry = SuppressionEntry(
            email=email.strip(),
            normalized_email=normalized,
            reason=reason,
            source=source,
        )
        db.add(entry)
        db.flush()
        logger.info("Added %s to suppression list (reason: %s, source: %s)", normalized, reason, source)
        return entry

    def is_suppressed(self, db: Session, email: Optional[str]) -> bool:
        """Check if an email address is present on the suppression list."""
        normalized = normalize_email(email)
        if not normalized:
            return False
        entry = db.execute(
            select(SuppressionEntry).where(SuppressionEntry.normalized_email == normalized)
        ).scalars().first()
        return entry is not None

    def list_suppressed(self, db: Session) -> List[SuppressionEntry]:
        """Return all entries on the suppression list."""
        return list(
            db.execute(select(SuppressionEntry).order_by(desc(SuppressionEntry.created_at))).scalars().all()
        )

    def remove_suppression(self, db: Session, email: str) -> bool:
        """Remove an email address from the suppression list (admin opt-in override)."""
        normalized = normalize_email(email)
        if not normalized:
            return False
        entry = db.execute(
            select(SuppressionEntry).where(SuppressionEntry.normalized_email == normalized)
        ).scalars().first()
        if entry:
            db.delete(entry)
            db.flush()
            return True
        return False

    # -------------------------------------------------------------------------
    # 7. Messages & Provider Status Helpers
    # -------------------------------------------------------------------------
    def get_lead_messages(self, db: Session, lead_id: int) -> List[OutreachMessage]:
        """Retrieve all outreach and reply messages for a lead."""
        return list(
            db.execute(
                select(OutreachMessage)
                .where(OutreachMessage.lead_id == lead_id)
                .order_by(desc(OutreachMessage.created_at))
            ).scalars().all()
        )

    def get_provider_status(self) -> Dict[str, Any]:
        """Inspect the current email provider configuration and safety status."""
        health = self.email_provider.health_check()
        return {
            "provider": health.provider,
            "mode": health.mode,
            "healthy": health.healthy,
            "detail": health.detail,
            "real_email_enabled": bool(self.settings.REAL_EMAIL_ENABLED),
            "real_provider_send": bool(self.settings.REAL_PROVIDER_SEND),
            "smtp_configured": bool(
                self.settings.SMTP_USER and self.settings.SMTP_PASSWORD
            ),
            "gmail_oauth_boundary": True,
        }


# Singleton instance
outreach_service = OutreachService()
