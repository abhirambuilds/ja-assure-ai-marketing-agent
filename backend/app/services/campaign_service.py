from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.models.entities import Campaign, Lead, OutreachMessage, utc_now

logger = logging.getLogger("app.services.campaign")


class CampaignService:
    """Manages marketing campaigns, target criteria, lead linkage, and progress metrics."""

    def create_campaign(
        self,
        db: Session,
        name: str,
        brand: str,
        target_industry: str,
        market: str = "Singapore",
        target_count: int = 20,
        minimum_score: int = 60,
        is_demo: bool = False,
    ) -> Campaign:
        campaign = Campaign(
            name=name,
            brand=brand.lower().strip(),
            target_industry=target_industry,
            market=market,
            target_count=target_count,
            minimum_score=minimum_score,
            status="active",
            is_demo=is_demo,
        )
        db.add(campaign)
        db.flush()
        logger.info("Created campaign #%d: %s (%s)", campaign.id, campaign.name, campaign.brand)
        return campaign

    def list_campaigns(self, db: Session) -> List[Campaign]:
        return list(
            db.execute(select(Campaign).order_by(desc(Campaign.created_at))).scalars().all()
        )

    def get_campaign(self, db: Session, campaign_id: int) -> Optional[Campaign]:
        return db.get(Campaign, campaign_id)

    def pause_campaign(self, db: Session, campaign_id: int) -> Campaign:
        campaign = db.get(Campaign, campaign_id)
        if not campaign:
            raise ValueError(f"Campaign {campaign_id} not found")
        campaign.status = "paused"
        campaign.updated_at = utc_now()
        db.flush()
        logger.info("Paused campaign #%d", campaign_id)
        return campaign

    def resume_campaign(self, db: Session, campaign_id: int) -> Campaign:
        campaign = db.get(Campaign, campaign_id)
        if not campaign:
            raise ValueError(f"Campaign {campaign_id} not found")
        campaign.status = "active"
        campaign.updated_at = utc_now()
        db.flush()
        logger.info("Resumed campaign #%d", campaign_id)
        return campaign

    def get_campaign_metrics(self, db: Session, campaign_id: int) -> Dict[str, Any]:
        campaign = db.get(Campaign, campaign_id)
        if not campaign:
            raise ValueError(f"Campaign {campaign_id} not found")

        # Query associated leads
        lead_count = db.scalar(
            select(func.count(Lead.id)).where(
                (Lead.campaign_id == str(campaign.id)) | (Lead.recommended_brand == campaign.brand)
            )
        ) or 0

        # Query messages
        messages = list(
            db.execute(
                select(OutreachMessage).where(OutreachMessage.campaign_id == campaign.id)
            ).scalars().all()
        )

        sent_count = sum(1 for m in messages if m.status == "sent")
        approved_count = sum(1 for m in messages if m.status == "approved")
        replied_count = sum(1 for m in messages if m.status == "replied" or m.direction == "inbound")

        return {
            "campaign_id": campaign.id,
            "name": campaign.name,
            "brand": campaign.brand,
            "status": campaign.status,
            "target_count": campaign.target_count,
            "leads_discovered": lead_count,
            "messages_drafted": len(messages),
            "messages_approved": approved_count,
            "messages_sent": sent_count,
            "replies_received": replied_count,
        }


# Singleton instance
campaign_service = CampaignService()
