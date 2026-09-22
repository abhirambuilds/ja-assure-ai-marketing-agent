import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.models.entities import Lead
from app.services.security.url_safety import validate_public_http_url, UnsafeURL
from app.services.enrichment.normalization import (
    normalize_company_name,
    normalize_domain,
    normalize_phone,
)
from app.services.discovery.base import (
    CandidateCompany,
    DiscoveryRequest,
    SourceEvidence,
    Signal,
    Contact,
)
from app.services.discovery.config import get_brand_config
from app.services.discovery.google_places import GooglePlacesProvider
from app.services.discovery.market_intel import MarketIntelDiscoveryProvider
from app.services.discovery.industry_sources import IndustrySourceProvider, get_demo_candidates
from app.services.deduplication import DeduplicationService
from app.services.enrichment.company_verifier import CompanyVerifier
from app.services.enrichment.website_inspector import WebsiteInspector
from app.services.enrichment.role_selector import DecisionMakerRoleSelector
from app.services.enrichment.contacts import HunterContactProvider, DemoContactProvider
from app.services.signals.classifier import SignalClassifier
from app.services.signals.detector import SignalDetector
from app.services.scoring.lead_scorer import LeadScorer
from app.services.lead_service import lead_service

client = TestClient(app)


# ==============================================================================
# 1. Query Expansion Tests
# ==============================================================================
def test_brand_query_expansion():
    jade_cfg = get_brand_config("jade")
    assert any("jeweller" in q.lower() for q in jade_cfg.discovery_queries)
    assert any("diamond" in q.lower() for q in jade_cfg.discovery_queries)

    transit_cfg = get_brand_config("jaguartransit")
    assert any("freight" in q.lower() or "logistics" in q.lower() for q in transit_cfg.discovery_queries)

    doctor_cfg = get_brand_config("doctorshield")
    assert any("clinic" in q.lower() or "medical" in q.lower() for q in doctor_cfg.discovery_queries)

    # Test GooglePlacesProvider query formatter
    places_provider = GooglePlacesProvider()
    queries = places_provider._get_search_queries(
        DiscoveryRequest(brand="jade", market="Singapore", target_industry="fine jewellery")
    )
    assert len(queries) > 0
    assert any("Singapore" in q for q in queries)


# ==============================================================================
# 2. Normalization Tests (Company Name, Domain, Phone)
# ==============================================================================
def test_company_name_normalization():
    assert normalize_company_name("Sovereign Gems Pte Ltd") == "sovereign gems"
    assert normalize_company_name("Pacific Freight Forwarders Sdn Bhd.") == "pacific freight forwarders"
    assert normalize_company_name("Novena Medical Clinic Co., Ltd") == "novena medical clinic"
    assert normalize_company_name("Royal Atelier Private Limited") == "royal atelier"


def test_domain_normalization():
    assert normalize_domain("https://www.sovereign-gems.sg/about-us") == "sovereign-gems.sg"
    assert normalize_domain("http://novena-clinic.com.sg?ref=google") == "novena-clinic.com.sg"
    assert normalize_domain("WWW.PACIFIC-LOGISTICS.COM/services") == "pacific-logistics.com"
    assert normalize_domain("") is None
    assert normalize_domain(None) is None


def test_phone_normalization():
    assert normalize_phone("+65 6738 0001") == "6567380001"
    assert normalize_phone("(65) 6542-0003") == "6565420003"
    assert normalize_phone("invalid") is None
    assert normalize_phone(None) is None


# ==============================================================================
# 3. 4-Stage Deduplication Tests
# ==============================================================================
def test_deduplication_by_domain():
    deduper = DeduplicationService()
    c1 = CandidateCompany(
        company_name="Sovereign Gemological Ateliers",
        domain="sovereign-gems.sg",
        source_provider="google_places",
        source_identifier="place-1",
        description="First description",
    )
    c2 = CandidateCompany(
        company_name="Sovereign Gemological Salon Pte Ltd",
        domain="https://www.sovereign-gems.sg/contact",
        source_provider="web_directory",
        source_identifier="web-1",
        description="Second description",
    )
    result = deduper.deduplicate([c1, c2])
    assert len(result) == 1
    assert result[0].domain == "sovereign-gems.sg"


def test_deduplication_by_source_identifier():
    deduper = DeduplicationService()
    c1 = CandidateCompany(
        company_name="Alpha Medical Centre",
        source_provider="google_places",
        source_identifier="ChIJN1t_tDeuEmsRUsoyG83frY4",
    )
    c2 = CandidateCompany(
        company_name="Alpha Medical - Mount Elizabeth",
        source_provider="google_places",
        source_identifier="ChIJN1t_tDeuEmsRUsoyG83frY4",
    )
    result = deduper.deduplicate([c1, c2])
    assert len(result) == 1


def test_deduplication_by_phone():
    deduper = DeduplicationService()
    c1 = CandidateCompany(
        company_name="Pacific Cargo Express",
        phone="+65 6542 1122",
        source_provider="source_a",
    )
    c2 = CandidateCompany(
        company_name="Pacific Cargo Regional Carrier",
        phone="6542-1122",
        source_provider="source_b",
    )
    result = deduper.deduplicate([c1, c2])
    assert len(result) == 1


def test_deduplication_by_normalized_name():
    deduper = DeduplicationService()
    c1 = CandidateCompany(
        company_name="Marina Aesthetics Pte Ltd",
        source_provider="source_a",
    )
    c2 = CandidateCompany(
        company_name="Marina Aesthetics Private Limited.",
        source_provider="source_b",
    )
    result = deduper.deduplicate([c1, c2])
    assert len(result) == 1
    assert result[0].company_name == "Marina Aesthetics Pte Ltd"


def test_no_false_positive_deduplication_different_companies():
    deduper = DeduplicationService()
    c1 = CandidateCompany(
        company_name="Marina Bay Diamond Atelier",
        domain="marinabay-diamonds.sg",
        phone="+65 6738 0001",
        source_provider="source_a",
    )
    c2 = CandidateCompany(
        company_name="Marina Bay Orthopaedic Surgery",
        domain="marinabay-ortho.sg",
        phone="+65 6734 0002",
        source_provider="source_b",
    )
    result = deduper.deduplicate([c1, c2])
    assert len(result) == 2


# ==============================================================================
# 4. SSRF Safety Tests
# ==============================================================================
def test_ssrf_validation_blocks_internal_ips():
    with pytest.raises(UnsafeURL):
        validate_public_http_url("http://127.0.0.1/admin")

    with pytest.raises(UnsafeURL):
        validate_public_http_url("http://localhost:8000/api")

    with pytest.raises(UnsafeURL):
        validate_public_http_url("http://169.254.169.254/latest/meta-data/")

    with pytest.raises(UnsafeURL):
        validate_public_http_url("ftp://example.com/file")


def test_ssrf_validation_permits_public_hosts():
    assert validate_public_http_url("https://www.google.com") == "https://www.google.com"
    assert validate_public_http_url("http://example.com") == "http://example.com"


def test_website_inspector_failure_handling():
    inspector = WebsiteInspector()
    # Unsafe domain handled gracefully without crashing
    assert inspector.inspect("http://127.0.0.1:8080") is None
    # None/empty domain handled gracefully
    assert inspector.inspect(None) is None
    assert inspector.inspect("") is None


# ==============================================================================
# 5. Role Selection Tests
# ==============================================================================
def test_role_selection_by_brand():
    jade_cfg = get_brand_config("jade")
    selector = DecisionMakerRoleSelector(jade_cfg)
    cand_retail = CandidateCompany(
        company_name="Boutique Jeweller",
        description="Retail boutique showroom",
        source_provider="google_places",
    )
    roles = selector.roles_for(cand_retail)
    assert len(roles) > 0
    assert any(r in ["owner", "founder", "managing director"] for r in roles)

    cand_wholesale = CandidateCompany(
        company_name="Precious Metals Wholesale",
        description="Wholesale gemstone distributor",
        source_provider="google_places",
    )
    roles_ws = selector.roles_for(cand_wholesale)
    assert any("director" in r.lower() or "manager" in r.lower() for r in roles_ws)


# ==============================================================================
# 6. Deterministic 5-Factor Scoring & Breakdown Tests
# ==============================================================================
def test_deterministic_5_factor_scoring():
    jade_cfg = get_brand_config("jade")
    scorer = LeadScorer(jade_cfg)

    signals = [
        Signal(
            signal_type="new_showroom",
            description="Opened a new flagship showroom in Marina Bay Sands.",
            source_url="https://example.com/news",
            source_type="press_release",
            confidence=0.88,
        )
    ]
    contacts = [
        Contact(
            name="Alice Tan",
            role="Managing Director",
            email="alice@sovereign-gems.sg",
            email_status="verified",
            confidence=0.9,
        )
    ]

    score_result = scorer.score(
        industry="jewellery_retail",
        country="Singapore",
        market="Singapore",
        product_fit=jade_cfg.product,
        signals=signals,
        contacts=contacts,
        has_description=True,
    )

    assert 0 <= score_result.total <= 100
    bd = score_result.breakdown
    assert "industry_fit" in bd
    assert "company_relevance" in bd
    assert "geographic_fit" in bd
    assert "product_fit" in bd
    assert "trigger_strength" in bd
    assert sum(bd.values()) == score_result.total
    assert bd["industry_fit"] == 25  # direct industry match
    assert bd["geographic_fit"] == 20  # market match


# ==============================================================================
# 7. Signal Detection & Why Now Tests
# ==============================================================================
def test_signal_detection_and_why_now():
    jade_cfg = get_brand_config("jade")
    classifier = SignalClassifier(jade_cfg)
    detector = SignalDetector(classifier)

    candidate = CandidateCompany(
        company_name="Sovereign Gemological Ateliers",
        source_provider="test_provider",
        evidence=[
            SourceEvidence(
                source_type="registry",
                source_url="https://example.com/sja/member",
                title="SJA Announcement",
                evidence_excerpt="Announced a new showroom opening in Paragon Shopping Centre.",
                provider="sja",
                confidence=0.9,
            )
        ],
    )

    signals = detector.detect(candidate)
    assert len(signals) > 0
    assert signals[0].signal_type == "new_showroom"
    assert signals[0].confidence > 0.7

    why_now = detector.why_now(candidate.company_name, signals, "Jade")
    assert why_now is not None
    assert "Sovereign Gemological Ateliers" in why_now
    assert "new showroom" in why_now
    assert "Jade" in why_now


# ==============================================================================
# 8. Provider Fallback & Missing Keys Tests
# ==============================================================================
def test_provider_fallback_without_keys():
    # Google Places provider handles missing API key gracefully
    places = GooglePlacesProvider()
    places.api_key = ""
    res = places.discover(DiscoveryRequest(brand="jade", market="Singapore"))
    assert res == []

    # Hunter provider handles missing API key gracefully
    hunter = HunterContactProvider()
    hunter.api_key = ""
    contacts = hunter.find_contacts(
        CandidateCompany(company_name="Test Co", domain="test.com", source_provider="test"),
        roles=["CEO"],
    )
    assert contacts == []

    # Industry provider returns demo records
    ind_provider = IndustrySourceProvider()
    industry_res = ind_provider.discover(DiscoveryRequest(brand="jade", market="Singapore"))
    assert len(industry_res) > 0
    assert any(c.is_demo for c in industry_res)


# ==============================================================================
# 9. Lead Persistence Tests
# ==============================================================================
def test_lead_persistence():
    db = SessionLocal()
    try:
        cand = CandidateCompany(
            company_name="Integration Test Atelier",
            domain="integration-test-atelier.sg",
            country="Singapore",
            city="Singapore",
            phone="+65 6789 1234",
            industry="jewellery",
            description="High value diamond testing atelier.",
            source_provider="integration_test",
            is_demo=True,
        )
        score_res = lead_service.score(cand, "jade")
        lead = lead_service.persist(
            db=db,
            candidate=cand,
            brand="jade",
            score_res=score_res,
            why_now="Integration test trigger",
            signals=[],
            contacts=[],
            outreach="Dear Atelier...",
        )
        assert lead.id is not None
        assert lead.company == "Integration Test Atelier"
        assert lead.normalized_company_name == "integration test atelier"
        assert lead.domain == "integration-test-atelier.sg"
        assert lead.score_breakdown_json is not None
        assert lead.why_now == "Integration test trigger"
        assert lead.is_demo is True
    finally:
        db.close()


# ==============================================================================
# 10. API Endpoints Tests
# ==============================================================================
def test_api_list_leads():
    response = client.get("/api/v1/leads?brand=jade&limit=10")
    assert response.status_code == 200
    leads = response.json()
    assert isinstance(leads, list)


def test_api_discover_leads():
    payload = {
        "brand": "doctorshield",
        "country": "Singapore",
        "industry": "Aesthetic Clinic",
    }
    response = client.post("/api/v1/leads/discover", json=payload)
    assert response.status_code == 200
    prospects = response.json()
    assert isinstance(prospects, list)
    assert len(prospects) > 0
    first = prospects[0]
    assert "company" in first
    assert "fit_score" in first
    assert "scoring_breakdown" in first


def test_api_lead_score_endpoint():
    # First get an existing lead
    list_res = client.get("/api/v1/leads?limit=1")
    assert list_res.status_code == 200
    leads = list_res.json()
    assert len(leads) > 0
    lead_id = leads[0]["id"]

    # Score lead
    score_res = client.post(f"/api/v1/leads/{lead_id}/score")
    assert score_res.status_code == 200
    data = score_res.json()
    assert data["lead_id"] == lead_id
    assert "score" in data
    assert "score_breakdown" in data
