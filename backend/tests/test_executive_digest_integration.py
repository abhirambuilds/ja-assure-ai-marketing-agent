import json
import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database.session import engine, get_db
from app.models.entities import (
    Competitor,
    CompetitorChange,
    Lead,
    ExecutiveDigest,
    utc_now,
)
from app.services.digest_service import digest_service, DigestLLMPayload

client = TestClient(app)


@pytest.fixture
def db_session():
    with Session(engine) as session:
        yield session


def seed_test_intel_data(session: Session):
    """Seed test competitors, changes, and leads for testing."""
    # Competitor
    comp = session.query(Competitor).filter(Competitor.name == "Chubb Fine Art & Specie").first()
    if not comp:
        comp = Competitor(
            name="Chubb Fine Art & Specie",
            url="https://chubb.com/sg",
            domain="chubb.com",
            category="jewellery",
            brand="jade",
            market="Singapore",
            title="Chubb High-Value Jewellers Insurance",
            summary="Incumbent jewellery underwriter with strict physical safe requirements.",
            pricing_summary="High baseline minimum SGD 4,500/year",
            coverage_strengths="Strong brand prestige",
            coverage_weaknesses="Inflexible safe and security warranties",
            threat_level="high",
            is_active=True,
        )
        session.add(comp)
        session.flush()

    # Competitor Change
    change = session.query(CompetitorChange).filter(CompetitorChange.title == "Safe Warranty Mandate Upgraded").first()
    if not change:
        change = CompetitorChange(
            competitor_id=comp.id,
            change_type="coverage_update",
            severity="critical",
            title="Safe Warranty Mandate Upgraded",
            description="Chubb now mandates Grade V safes for stock exceeding SGD 500k, rejecting Grade III setups.",
            old_value="Grade III or higher acceptable with dual lock",
            new_value="Grade V mandatory across all central retail premises",
            source_url="https://chubb.com/sg/jewellery-terms",
            detected_at=utc_now(),
        )
        session.add(change)

    # Lead with fit score >= 70
    lead = session.query(Lead).filter(Lead.company == "Orchard Gem Vault Pte Ltd").first()
    if not lead:
        lead = Lead(
            name="Grace Tan (Managing Director)",
            company="Orchard Gem Vault Pte Ltd",
            industry="jewellery",
            country="Singapore",
            city="Singapore",
            location="Singapore",
            fit_score=92.0,
            recommended_brand="jade",
            why_now="Opening second flagship boutique in Marina Bay; seeking flexible safe endorsements.",
            signals_json=json.dumps([{"type": "store_opening", "confidence": 0.95}]),
            status="qualified",
        )
        session.add(lead)

    session.commit()
    return comp, change, lead


# 1. Digest input collection
def test_digest_input_collection(db_session: Session):
    seed_test_intel_data(db_session)
    intel = digest_service.collect_intelligence(db_session, brand="jade", market="Singapore", period_days=30)
    assert "competitors" in intel
    assert "changes" in intel
    assert "lead_signals" in intel
    assert intel["source_count"] >= 1
    assert any(c["category"] == "jewellery" for c in intel["competitors"])


# 2. Brand filtering
def test_digest_brand_filtering(db_session: Session):
    seed_test_intel_data(db_session)
    jade_intel = digest_service.collect_intelligence(db_session, brand="jade", market="Singapore", period_days=30)
    transit_intel = digest_service.collect_intelligence(db_session, brand="jaguartransit", market="Singapore", period_days=30)

    assert jade_intel["brand"] == "jade"
    assert transit_intel["brand"] == "jaguartransit"
    # Jade competitors should be present in jade_intel
    assert any("Chubb" in c["name"] for c in jade_intel["competitors"])


# 3. Market filtering
def test_digest_market_filtering(db_session: Session):
    sg_intel = digest_service.collect_intelligence(db_session, brand="all", market="Singapore", period_days=30)
    assert sg_intel["market"] == "Singapore"


# 4. Time-period filtering
def test_digest_time_period_filtering(db_session: Session):
    seed_test_intel_data(db_session)
    # A period of 0 days should only include changes happening right now/future
    intel_short = digest_service.collect_intelligence(db_session, brand="all", market="Singapore", period_days=1)
    assert intel_short["period_days"] == 1
    assert intel_short["period_start"] < intel_short["period_end"]


# 5. Empty intelligence dataset
def test_empty_intelligence_dataset(db_session: Session):
    # Test on a brand/market with zero changes
    intel = digest_service.collect_intelligence(db_session, brand="unknown_brand", market="Antarctica", period_days=7)
    assert len(intel["changes"]) == 0
    fallback = digest_service._generate_fallback_digest(
        brand="unknown_brand",
        market="Antarctica",
        period_days=7,
        changes_count=0,
        lead_count=0,
    )
    assert fallback.title
    assert "### 1. 🎯 Tactical Pricing & Margin Strategy" in fallback.what_ja_should_do
    assert "### 2. 🛡️ Product & Policy Coverage Counter-Actions" in fallback.what_ja_should_do
    assert "### 3. ⚔️ Sales Team Battlecard & Lead Outreach Strategy" in fallback.what_ja_should_do
    assert "### 4. 📢 Marketing & Campaign Positioning" in fallback.what_ja_should_do


# 6. Competitor-change integration
def test_competitor_change_integration(db_session: Session):
    comp, change, _ = seed_test_intel_data(db_session)
    intel = digest_service.collect_intelligence(db_session, brand="jade", market="Singapore", period_days=30)
    change_titles = [c["title"] for c in intel["changes"]]
    assert "Safe Warranty Mandate Upgraded" in change_titles


# 7. Lead-signal integration
def test_lead_signal_integration(db_session: Session):
    _, _, lead = seed_test_intel_data(db_session)
    intel = digest_service.collect_intelligence(db_session, brand="jade", market="Singapore", period_days=30)
    companies = [ls["company"] for ls in intel["lead_signals"]]
    assert "Orchard Gem Vault Pte Ltd" in companies


# 8. Structured LLM response
def test_structured_llm_response(db_session: Session):
    from unittest.mock import PropertyMock

    mock_payload = DigestLLMPayload(
        title="Custom Q2 Tactical Digest: Southeast Asia High Net Worth",
        executive_summary="Incumbents raising rates 15% across fine art and jewelry lines.",
        what_ja_should_do=(
            "### 1. 🎯 Tactical Pricing & Margin Strategy\n- Undercut Chubb minimums by 20%.\n\n"
            "### 2. 🛡️ Product & Policy Coverage Counter-Actions\n- Offer telematics safe endorsements.\n\n"
            "### 3. ⚔️ Sales Team Battlecard & Lead Outreach Strategy\n- Pitch contract certainty.\n\n"
            "### 4. 📢 Marketing & Campaign Positioning\n- Digital campaign on Lloyd's A+ security."
        ),
        pricing_strategy_points=["Undercut Chubb minimums by 20%."],
        underwriting_tweaks=["Offer telematics safe endorsements."],
        battlecard_updates=["Pitch contract certainty."],
        marketing_campaign_ideas=["Digital campaign on Lloyd's A+ security."],
    )

    with patch("app.services.llm_provider.LLMProvider.is_live", new_callable=PropertyMock, return_value=True):
        with patch.object(digest_service, "collect_intelligence", wraps=digest_service.collect_intelligence):
            with patch("app.services.llm_provider.llm_provider.generate_structured", return_value=mock_payload):
                digest = digest_service.generate_digest(db_session, brand="jade", market="Singapore", period_days=30)
                assert digest.title == "Custom Q2 Tactical Digest: Southeast Asia High Net Worth"
                assert any("Undercut Chubb minimums" in p for p in digest.pricing_strategy_points)


# 9. Malformed LLM response & 10. LLM failure fallback
def test_llm_failure_graceful_fallback(db_session: Session):
    from unittest.mock import PropertyMock

    with patch("app.services.llm_provider.LLMProvider.is_live", new_callable=PropertyMock, return_value=True):
        with patch("app.services.llm_provider.llm_provider.generate_structured", side_effect=RuntimeError("Groq API Timeout")):
            digest = digest_service.generate_digest(db_session, brand="doctorshield", market="Singapore", period_days=30)
            assert digest.id is not None
            assert digest.brand == "doctorshield"
            assert "### 1. 🎯 Tactical Pricing & Margin Strategy" in digest.what_ja_should_do
            assert len(digest.pricing_strategy_points) > 0
            assert len(digest.underwriting_tweaks) > 0
            assert len(digest.battlecard_updates) > 0
            assert len(digest.marketing_campaign_ideas) > 0


# 11. Digest persistence & 12. Digest retrieval
def test_digest_persistence_and_retrieval(db_session: Session):
    digest = digest_service.generate_digest(db_session, brand="jaguartransit", market="Singapore", period_days=14)
    assert digest.id is not None

    retrieved = digest_service.get_digest(db_session, digest.id)
    assert retrieved is not None
    assert retrieved.id == digest.id
    assert retrieved.brand == "jaguartransit"

    latest = digest_service.get_latest_digest(db_session, brand="jaguartransit")
    assert latest is not None
    assert latest.brand == "jaguartransit"

    all_digests = digest_service.list_digests(db_session, brand="jaguartransit", limit=10)
    assert len(all_digests) >= 1
    assert all_digests[0].id == digest.id


# 13. API generation
def test_api_generate_digest():
    response = client.post(
        "/api/v1/digests/generate",
        json={
            "brand": "jade",
            "market": "Singapore",
            "niche": "jewellery",
            "period_days": 30,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["brand"] == "jade"
    assert data["market"] == "Singapore"
    assert "what_ja_should_do" in data
    assert "pricing_strategy_points" in data
    assert "underwriting_tweaks" in data
    assert "battlecard_updates" in data
    assert "marketing_campaign_ideas" in data


# 14. API retrieval
def test_api_retrieval():
    # List digests
    list_res = client.get("/api/v1/digests?brand=jade&limit=5")
    assert list_res.status_code == 200
    digests = list_res.json()
    assert isinstance(digests, list)
    assert len(digests) >= 1

    first_id = digests[0]["id"]

    # Get by ID
    get_res = client.get(f"/api/v1/digests/{first_id}")
    assert get_res.status_code == 200
    single = get_res.json()
    assert single["id"] == first_id

    # Get latest
    latest_res = client.get("/api/v1/digests/latest?brand=jade")
    assert latest_res.status_code == 200
    latest = latest_res.json()
    assert "id" in latest
    assert latest["brand"] == "jade"
