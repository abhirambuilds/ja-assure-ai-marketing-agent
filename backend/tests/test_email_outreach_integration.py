from __future__ import annotations

import os
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.config import Settings, settings as global_settings
from app.database.session import engine
from app.models.entities import (
    Campaign,
    FollowUp,
    Lead,
    OutreachMessage,
    SuppressionEntry,
    utc_now,
)
from app.services.cadence.generator import CadenceGenerator, FORBIDDEN_PHRASES
from app.services.campaign_service import campaign_service
from app.services.email import (
    EmailMessage,
    EmailProvider,
    MockEmailProvider,
    SMTPEmailProvider,
    GmailEmailProvider,
    get_email_provider,
    get_mock_provider,
)
from app.services.outreach_service import OutreachService, normalize_email
from app.services.replies.classifier import ReplyClassifier, ReplyIntent

client = TestClient(app)


@pytest.fixture
def db_session():
    with Session(engine) as session:
        yield session


@pytest.fixture
def mock_provider():
    provider = get_mock_provider()
    provider.clear()
    return provider


@pytest.fixture
def test_lead(db_session: Session) -> Lead:
    lead = db_session.query(Lead).filter(Lead.company == "Test Diamond Vault Ltd").first()
    if not lead:
        lead = Lead(
            name="Alexander Vance",
            company="Test Diamond Vault Ltd",
            industry="jewellery",
            email="alexander.vance@diamondvault.sg",
            country="Singapore",
            city="Singapore",
            fit_score=85.0,
            recommended_brand="jade",
            status="new",
            why_now="Opening luxury vault showroom in Marina Bay Sands.",
        )
        db_session.add(lead)
        db_session.commit()
        db_session.refresh(lead)
    else:
        lead.email = "alexander.vance@diamondvault.sg"
        lead.status = "new"
        db_session.commit()
    return lead


# ==============================================================================
# 1. MOCK PROVIDER TESTS
# ==============================================================================

def test_mock_provider_send_and_retrieval(mock_provider: MockEmailProvider):
    msg = EmailMessage(
        to="client@example.com",
        subject="Underwriting Intro",
        body="Sample body content",
        sender="advisory@jaassure.com",
    )
    result = mock_provider.send_message(msg)
    assert result.sent is True
    assert result.provider_message_id is not None
    assert result.provider_message_id.startswith("mock-")

    messages = mock_provider.get_messages()
    assert len(messages) == 1
    assert messages[0]["to"] == "client@example.com"
    assert messages[0]["subject"] == "Underwriting Intro"


def test_mock_provider_health(mock_provider: MockEmailProvider):
    health = mock_provider.health_check()
    assert health.provider == "mock"
    assert health.healthy is True
    assert health.mode == "mock"


# ==============================================================================
# 2. SMTP PROVIDER TESTS (TLS/SSL, MIME, RFC 8058, Credential Protection)
# ==============================================================================

def test_smtp_provider_unconfigured_safety():
    """Verify SMTP provider safely refuses send when unconfigured without raising."""
    unconfigured_settings = Settings(
        REAL_EMAIL_ENABLED=False,
        REAL_PROVIDER_SEND=False,
        SMTP_USER="",
        SMTP_PASSWORD="",
    )
    provider = SMTPEmailProvider(unconfigured_settings)
    assert provider.health_check().healthy is False
    assert provider.health_check().mode == "unconfigured"

    result = provider.send_message(EmailMessage(to="target@example.com", subject="Test", body="Body"))
    assert result.sent is False
    assert "disabled" in result.error.lower() or "missing" in result.error.lower()


def test_smtp_mime_multipart_and_rfc8058_headers():
    """Test MIME construction, HTML layout, and RFC 8058 List-Unsubscribe headers."""
    mock_smtp_server = MagicMock()
    configured_settings = Settings(
        REAL_EMAIL_ENABLED=True,
        REAL_PROVIDER_SEND=True,
        SMTP_HOST="smtp.testserver.com",
        SMTP_PORT=587,
        SMTP_USER="underwriter@jaassure.com",
        SMTP_PASSWORD="secret_password_123",
        SMTP_FROM_EMAIL="underwriter@jaassure.com",
    )
    provider = SMTPEmailProvider(configured_settings)

    with patch("smtplib.SMTP", return_value=mock_smtp_server):
        res = provider.send_message(
            EmailMessage(
                to="prospect@luxuryjewellers.com",
                subject="JA Assure Coverholder Agility",
                body="Digital quote-to-bind under Lloyd's of London terms.",
            )
        )
        assert res.sent is True
        assert res.provider_message_id.startswith("smtp-")

        # Verify SMTP server lifecycle
        mock_smtp_server.starttls.assert_called_once()
        mock_smtp_server.login.assert_called_once_with("underwriter@jaassure.com", "secret_password_123")
        mock_smtp_server.sendmail.assert_called_once()
        mock_smtp_server.quit.assert_called_once()

        # Verify outbound MIME headers and decoded payloads
        import email
        sent_raw = mock_smtp_server.sendmail.call_args[0][2]
        parsed_msg = email.message_from_string(sent_raw)
        assert parsed_msg["List-Unsubscribe"] == "<mailto:underwriter@jaassure.com?subject=unsubscribe>"
        assert parsed_msg["List-Unsubscribe-Post"] == "List-Unsubscribe=One-Click"
        assert parsed_msg["To"] == "prospect@luxuryjewellers.com"
        assert parsed_msg["Subject"] == "JA Assure Coverholder Agility"

        payload_texts = [part.get_payload(decode=True).decode("utf-8") for part in parsed_msg.get_payload()]
        assert any("Digital quote-to-bind" in t for t in payload_texts)
        assert any("Lloyd's of London Coverholder" in t for t in payload_texts)


def test_smtp_password_never_exposed_on_error():
    """Ensure sensitive credentials like passwords are never leaked in error text."""
    secret_pass = "super_classified_secret_key"
    failing_settings = Settings(
        REAL_EMAIL_ENABLED=True,
        REAL_PROVIDER_SEND=True,
        SMTP_HOST="bad.host.invalid",
        SMTP_PORT=587,
        SMTP_USER="user@example.com",
        SMTP_PASSWORD=secret_pass,
    )
    provider = SMTPEmailProvider(failing_settings)

    with patch("smtplib.SMTP", side_effect=Exception(f"Connection refused with password {secret_pass}")):
        result = provider.send_message(EmailMessage(to="test@example.com", subject="Subj", body="Body"))
        assert result.sent is False
        assert secret_pass not in result.error
        assert "********" in result.error


# ==============================================================================
# 3. GMAIL ADAPTER BOUNDARY TESTS
# ==============================================================================

def test_gmail_adapter_boundary_honest_status():
    """Verify Gmail adapter boundary honestly reports unconfigured state."""
    settings = Settings(
        EMAIL_PROVIDER="gmail",
        REAL_EMAIL_ENABLED=False,
        REAL_PROVIDER_SEND=False,
    )
    provider = GmailEmailProvider(settings)
    health = provider.health_check()
    assert health.provider == "gmail"
    assert health.healthy is False
    assert health.mode == "boundary_stub"

    result = provider.send_message(EmailMessage(to="client@example.com", subject="Hi", body="Hello"))
    assert result.sent is False
    assert "disabled" in result.error.lower() or "not configured" in result.error.lower()


# ==============================================================================
# 4. CADENCE GENERATOR & FORBIDDEN PHRASES TESTS
# ==============================================================================

def test_cadence_generator_three_touches():
    generator = CadenceGenerator(brand="jade")
    cadence = generator.generate(
        company_name="Solitaire Gems Pte Ltd",
        contact_name="Derrick Wu",
        contact_role="Managing Director",
        market="Singapore",
        why_now="Opening new boutique in Orchard.",
        fit_score=90.0,
    )

    assert len(cadence.touches) == 3
    assert cadence.touches[0].day == "Day 0"
    assert cadence.touches[0].step == 1
    assert "JADE" in cadence.touches[0].subject
    assert "Derrick Wu" in cadence.touches[0].body

    assert cadence.touches[1].day == "Day 4"
    assert cadence.touches[1].step == 2
    assert "Lloyd's" in cadence.touches[1].body

    assert cadence.touches[2].day == "Day 9"
    assert cadence.touches[2].step == 3
    assert "Final note" in cadence.touches[2].subject


def test_cadence_generator_forbidden_phrases_rejected():
    generator = CadenceGenerator(brand="jade")
    for phrase in FORBIDDEN_PHRASES:
        with pytest.raises(ValueError, match="Unsafe outreach phrase detected"):
            generator.validate_safety(f"This enterprise {phrase} for our insurance.")


# ==============================================================================
# 5. OUTREACH SERVICE & HITL GOVERNANCE TESTS
# ==============================================================================

def test_generate_outreach_sets_pending_approval(db_session: Session, test_lead: Lead):
    svc = OutreachService(global_settings, get_mock_provider())
    outreach = svc.generate_outreach(db_session, test_lead.id)
    db_session.commit()

    assert outreach.status == "pending_approval"
    assert outreach.sequence_step == 1
    assert len(outreach.sequence_touches) == 3
    assert test_lead.status == "pending_approval"


def test_send_blocked_without_human_approval(db_session: Session, test_lead: Lead):
    svc = OutreachService(global_settings, get_mock_provider())
    outreach = svc.generate_outreach(db_session, test_lead.id)
    db_session.commit()

    # Attempt to send before approval
    result = svc.send_outreach(db_session, outreach.id)
    assert result["sent"] is False
    assert result["reason"] == "human approval required"


def test_human_approval_advances_status(db_session: Session, test_lead: Lead):
    svc = OutreachService(global_settings, get_mock_provider())
    outreach = svc.generate_outreach(db_session, test_lead.id)
    db_session.commit()

    approved = svc.approve_outreach(db_session, outreach.id, actor="Compliance Director")
    db_session.commit()

    assert approved.status == "approved"
    assert approved.approved_by == "Compliance Director"
    assert approved.approved_at is not None
    assert test_lead.status == "approved"


def test_dry_run_never_dispatches(db_session: Session, test_lead: Lead, mock_provider: MockEmailProvider):
    svc = OutreachService(global_settings, mock_provider)
    outreach = svc.generate_outreach(db_session, test_lead.id)
    svc.approve_outreach(db_session, outreach.id)
    db_session.commit()

    res = svc.send_outreach(db_session, outreach.id, dry_run=True)
    assert res["sent"] is False
    assert res["reason"] == "dry-run"
    assert len(mock_provider.get_messages()) == 0


def test_approved_send_dispatches_and_schedules_followup(db_session: Session, test_lead: Lead, mock_provider: MockEmailProvider):
    svc = OutreachService(global_settings, mock_provider)
    outreach = svc.generate_outreach(db_session, test_lead.id)
    svc.approve_outreach(db_session, outreach.id)
    db_session.commit()

    res = svc.send_outreach(db_session, outreach.id, dry_run=False)
    assert res["sent"] is True
    assert res["provider_message_id"].startswith("mock-")
    assert outreach.status == "sent"
    assert test_lead.status == "contacted"
    assert test_lead.last_contacted_at is not None

    # Verify Touch 2 was automatically scheduled
    follow_ups = db_session.query(FollowUp).filter(FollowUp.lead_id == test_lead.id).all()
    assert len(follow_ups) >= 1
    latest_fu = follow_ups[-1]
    assert latest_fu.sequence_step == 2
    assert latest_fu.status == "scheduled"
    assert "Touch 2" in latest_fu.reason


# ==============================================================================
# 6. SUPPRESSION & UNSUBSCRIBE ENFORCEMENT TESTS
# ==============================================================================

def test_suppression_blocks_send(db_session: Session, test_lead: Lead, mock_provider: MockEmailProvider):
    svc = OutreachService(global_settings, mock_provider)
    # Add lead email to suppression
    svc.add_suppression(db_session, test_lead.email, reason="opted_out", source="test")
    db_session.commit()

    outreach = svc.generate_outreach(db_session, test_lead.id)
    svc.approve_outreach(db_session, outreach.id)
    db_session.commit()

    result = svc.send_outreach(db_session, outreach.id)
    assert result["sent"] is False
    assert result["reason"] == "recipient is suppressed"
    assert test_lead.status == "suppressed"

    # Cleanup suppression for subsequent tests
    svc.remove_suppression(db_session, test_lead.email)
    db_session.commit()


def test_inbound_unsubscribe_auto_suppresses(db_session: Session, test_lead: Lead):
    svc = OutreachService(global_settings, get_mock_provider())
    res = svc.simulate_inbound_reply(
        db=db_session,
        lead_id=test_lead.id,
        message="Please unsubscribe me immediately.",
        sender=test_lead.email,
    )
    db_session.commit()

    assert res["intent"] == "unsubscribe"
    assert res["lead_status"] == "suppressed"
    assert svc.is_suppressed(db_session, test_lead.email) is True

    # Cleanup
    svc.remove_suppression(db_session, test_lead.email)
    db_session.commit()


# ==============================================================================
# 7. REPLY INTENT CLASSIFICATION TESTS (8 Intents)
# ==============================================================================

def test_reply_classification_all_intents():
    classifier = ReplyClassifier()

    # 1. Unsubscribe
    assert classifier.classify("Unsubscribe please").intent == ReplyIntent.UNSUBSCRIBE
    assert classifier.classify("Stop emailing me and take me off your list").intent == ReplyIntent.UNSUBSCRIBE

    # 2. Bounce
    assert classifier.classify("Mail delivery failed: user unknown").intent == ReplyIntent.BOUNCE

    # 3. Negative (evaluated BEFORE positive words)
    assert classifier.classify("We are not interested in this service").intent == ReplyIntent.NEGATIVE
    assert classifier.classify("No thanks, pass on this").intent == ReplyIntent.NEGATIVE

    # 4. Out of Office
    assert classifier.classify("I am currently out of office on annual leave.").intent == ReplyIntent.OUT_OF_OFFICE

    # 5. Meeting Request
    assert classifier.classify("Can we schedule a call next Tuesday?").intent == ReplyIntent.MEETING_REQUEST

    # 6. Request for Information
    assert classifier.classify("Please send more information and pricing details.").intent == ReplyIntent.REQUEST_FOR_INFORMATION

    # 7. Positive
    assert classifier.classify("Yes, interested. Let's talk.").intent == ReplyIntent.POSITIVE

    # 8. Unknown / Empty
    assert classifier.classify("").intent == ReplyIntent.UNKNOWN
    assert classifier.classify(None).intent == ReplyIntent.UNKNOWN


def test_reply_classification_word_boundary_edge_cases():
    classifier = ReplyClassifier()
    # "yesterday" should not trigger POSITIVE ("yes")
    assert classifier.classify("We discussed this yesterday.").intent != ReplyIntent.POSITIVE
    # "takeaway" should not trigger OUT_OF_OFFICE ("away")
    assert classifier.classify("The key takeaway was clear.").intent != ReplyIntent.OUT_OF_OFFICE


# ==============================================================================
# 8. CAMPAIGNS SERVICE & LIFECYCLE TESTS
# ==============================================================================

def test_campaign_lifecycle_and_metrics(db_session: Session):
    camp = campaign_service.create_campaign(
        db=db_session,
        name="Q3 Luxury Jewellers Expansion",
        brand="jade",
        target_industry="jewellery",
        market="Singapore",
        target_count=25,
        minimum_score=70,
    )
    db_session.commit()

    assert camp.id is not None
    assert camp.status == "active"

    # Pause
    paused = campaign_service.pause_campaign(db_session, camp.id)
    assert paused.status == "paused"

    # Resume
    resumed = campaign_service.resume_campaign(db_session, camp.id)
    assert resumed.status == "active"

    # Metrics
    metrics = campaign_service.get_campaign_metrics(db_session, camp.id)
    assert metrics["campaign_id"] == camp.id
    assert metrics["status"] == "active"
    assert "leads_discovered" in metrics


# ==============================================================================
# 9. FASTAPI ENDPOINT INTEGRATION TESTS
# ==============================================================================

def test_api_outreach_endpoints_workflow(test_lead: Lead):
    # 1. Check provider status
    status_resp = client.get("/api/v1/outreach/provider-status")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert "provider" in status_data

    # 2. Generate outreach via API
    gen_resp = client.post(f"/api/v1/outreach/{test_lead.id}/generate")
    assert gen_resp.status_code == 200
    msg_data = gen_resp.json()
    assert msg_data["status"] == "pending_approval"
    msg_id = msg_data["id"]

    # 3. Approve via API
    appr_resp = client.post(f"/api/v1/outreach/{msg_id}/approve", json={"actor": "Chief Underwriter"})
    assert appr_resp.status_code == 200
    assert appr_resp.json()["status"] == "approved"

    # 4. Dry-run send via API
    dry_resp = client.post(f"/api/v1/outreach/{msg_id}/send", json={"dry_run": True})
    assert dry_resp.status_code == 200
    assert dry_resp.json()["sent"] is False
    assert dry_resp.json()["reason"] == "dry-run"

    # 5. Live/Mock send via API
    send_resp = client.post(f"/api/v1/outreach/{msg_id}/send", json={"dry_run": False})
    assert send_resp.status_code == 200
    assert send_resp.json()["sent"] is True

    # 6. View lead messages via API
    msgs_resp = client.get(f"/api/v1/outreach/{test_lead.id}/messages")
    assert msgs_resp.status_code == 200
    assert len(msgs_resp.json()) >= 1

    # 7. Simulate inbound reply via API
    sim_resp = client.post(
        "/api/v1/outreach/replies/simulate",
        json={"lead_id": test_lead.id, "message": "Can we schedule a call?"},
    )
    assert sim_resp.status_code == 200
    assert sim_resp.json()["intent"] == "meeting_request"


def test_api_campaigns_crud():
    payload = {
        "name": "DoctorShield Aesthetics Clinic Campaign",
        "brand": "doctorshield",
        "target_industry": "clinic",
        "market": "Singapore",
        "target_count": 15,
        "minimum_score": 65,
    }
    resp = client.post("/api/v1/campaigns", json=payload)
    assert resp.status_code == 200
    camp_data = resp.json()
    camp_id = camp_data["id"]
    assert camp_data["name"] == payload["name"]

    list_resp = client.get("/api/v1/campaigns")
    assert list_resp.status_code == 200
    assert any(c["id"] == camp_id for c in list_resp.json())

    pause_resp = client.post(f"/api/v1/campaigns/{camp_id}/pause")
    assert pause_resp.status_code == 200
    assert pause_resp.json()["status"] == "paused"
