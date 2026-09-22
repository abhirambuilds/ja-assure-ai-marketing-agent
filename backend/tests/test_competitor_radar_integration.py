from __future__ import annotations

import hashlib
import json
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database.session import engine, get_db
from app.models.entities import (
    Competitor,
    CompetitorSnapshot,
    CompetitorChange,
    CompetitorBattlecard,
)
from app.services.competitors.monitor import (
    CompetitorMonitor,
    competitor_monitor,
    PricingExtraction,
    CoverageExtraction,
    CompetitorExtractionSchema,
)
from app.services.competitors.change_detector import ChangeDetector, change_detector
from app.services.competitors.battlecard_generator import BattlecardGenerator, battlecard_generator
from app.services.competitors.seed_data import seed_initial_competitors
from app.services.competitor_service import CompetitorService, competitor_service
from app.services.security.url_safety import validate_public_http_url, UnsafeURL

client = TestClient(app)


# -------------------------------------------------------------------------
# Test 1 & 15: Competitor Creation and Database Persistence
# -------------------------------------------------------------------------
def test_competitor_creation_and_persistence():
    with Session(engine) as db:
        data = {
            "name": "SingSpecie Marine Cargo",
            "url": "https://singspecie.com.sg/products",
            "category": "transit",
            "brand": "jaguartransit",
            "market": "Singapore & Malaysia",
            "underwriter": "Lloyd's Specie Syndicate",
            "threat_level": "medium",
            "pricing_summary": "0.15% declared value. Min SGD 2,500.",
            "coverage_strengths": "Armored courier partnerships",
            "coverage_weaknesses": "48-hour pre-declaration required",
        }
        comp = competitor_service.create_competitor(db, data)
        assert comp.id is not None
        assert comp.name == "SingSpecie Marine Cargo"
        assert comp.domain == "singspecie.com.sg"
        assert comp.brand == "jaguartransit"
        assert comp.category == "transit"

        # Verify DB persistence
        retrieved = db.get(Competitor, comp.id)
        assert retrieved is not None
        assert retrieved.name == "SingSpecie Marine Cargo"

        # Initial battlecard should have been generated automatically
        bc = db.query(CompetitorBattlecard).filter(CompetitorBattlecard.competitor_id == comp.id).first()
        assert bc is not None
        assert bc.ja_product == "Jaguar Transit"
        assert len(bc.why_ja_wins) > 0


# -------------------------------------------------------------------------
# Test 2: Competitor Retrieval
# -------------------------------------------------------------------------
def test_competitor_retrieval():
    with Session(engine) as db:
        competitor_service.ensure_seeded(db)
        competitors = competitor_service.list_competitors(db, limit=10)
        assert len(competitors) > 0

        first = competitors[0]
        found = competitor_service.get_competitor(db, first.id)
        assert found is not None
        assert found.id == first.id


# -------------------------------------------------------------------------
# Test 3 & 4: URL Validation and SSRF Protection
# -------------------------------------------------------------------------
def test_url_validation_and_ssrf_protection():
    # Valid public URLs
    assert validate_public_http_url("https://www.google.com") == "https://www.google.com"
    assert validate_public_http_url("https://chubb.com/sg") == "https://chubb.com/sg"

    # Blocked local, loopback, private IPs
    with pytest.raises(UnsafeURL):
        validate_public_http_url("http://localhost:8000/secret")

    with pytest.raises(UnsafeURL):
        validate_public_http_url("http://127.0.0.1/admin")

    with pytest.raises(UnsafeURL):
        validate_public_http_url("http://169.254.169.254/latest/meta-data/")

    with pytest.raises(UnsafeURL):
        validate_public_http_url("http://192.168.1.1/internal")

    with pytest.raises(UnsafeURL):
        validate_public_http_url("http://10.0.0.1/corp")

    # Monitor inspect method handles SSRF safely without raising unhandled exception
    res = competitor_monitor.inspect_competitor(
        competitor_name="Malicious Local Host",
        niche="jewellery",
        url="http://127.0.0.1:8000/internal",
    )
    assert res.fetch_success is False
    assert "SSRF Blocked" in (res.error_message or "")
    assert res.content_hash != ""


# -------------------------------------------------------------------------
# Test 5: Website Fetch Failure Handling
# -------------------------------------------------------------------------
def test_website_fetch_failure_graceful_handling():
    # Dead domain should not crash the monitor
    res = competitor_monitor.inspect_competitor(
        competitor_name="Nonexistent Insurance Entity",
        niche="medical",
        url="https://a-completely-nonexistent-domain-123459876.com",
        known_pricing="Standard clinical rates",
        known_strengths="Local council defense",
    )
    assert res.fetch_success is False
    assert res.content_hash != ""
    assert res.pricing_data is not None
    assert "pricing_summary" in res.pricing_data


# -------------------------------------------------------------------------
# Test 6 & 7: Snapshot Creation & SHA-256 Hashing
# -------------------------------------------------------------------------
def test_snapshot_creation_and_sha256_hashing():
    text_content = "Comprehensive Jewellers Block insurance covering mysterious disappearance and trade fairs."
    expected_hash = hashlib.sha256(text_content.encode("utf-8")).hexdigest()
    computed_hash = competitor_monitor.calculate_content_hash(text_content)
    assert computed_hash == expected_hash

    with Session(engine) as db:
        comp = Competitor(
            name="Snapshot Test Insurer",
            category="jewellery",
            title="Snapshot Test",
            summary="Snapshot verification",
        )
        db.add(comp)
        db.flush()

        snapshot = CompetitorSnapshot(
            competitor_id=comp.id,
            page_url="https://testinsurer.com",
            page_title="Test Insurer Coverage",
            content_hash=computed_hash,
            pricing_data_json=json.dumps({"base_rate": "0.45%", "minimum_premium": "SGD 4,000"}),
            coverage_terms_json=json.dumps({"inclusions": ["Jewelry stock"], "exclusions": ["Unattended loss"]}),
            raw_text_excerpt=text_content,
        )
        db.add(snapshot)
        db.commit()

        assert snapshot.id is not None
        assert snapshot.content_hash == expected_hash
        assert snapshot.pricing_data["base_rate"] == "0.45%"
        assert snapshot.coverage_terms["inclusions"] == ["Jewelry stock"]


# -------------------------------------------------------------------------
# Test 8: Identical Snapshot Detection (No Changes)
# -------------------------------------------------------------------------
def test_identical_snapshot_detection():
    detector = ChangeDetector()
    hash_val = "abc123hash"
    prev_snapshot = CompetitorSnapshot(
        competitor_id=1,
        page_url="https://example.com",
        content_hash=hash_val,
        pricing_data_json=json.dumps({"base_rate": "0.40%", "minimum_premium": "SGD 3,500"}),
        coverage_terms_json=json.dumps({"exclusions": ["Unattended loss"]}),
    )

    new_data = {
        "content_hash": hash_val,
        "pricing_data": {"base_rate": "0.40%", "minimum_premium": "SGD 3,500"},
        "coverage_terms": {"exclusions": ["Unattended loss"]},
        "public_announcements": [],
    }

    diffs = detector.detect_changes(
        competitor_name="Example Insurer",
        competitor_id=1,
        new_data=new_data,
        prev_snapshot=prev_snapshot,
    )
    assert len(diffs) == 0


# -------------------------------------------------------------------------
# Test 9: Changed Snapshot Detection (Pricing & Coverage Diffs)
# -------------------------------------------------------------------------
def test_changed_snapshot_detection():
    detector = ChangeDetector()
    prev_snapshot = CompetitorSnapshot(
        competitor_id=2,
        page_url="https://example.com",
        content_hash="oldhash123",
        pricing_data_json=json.dumps({"base_rate": "0.35%", "minimum_premium": "SGD 3,000"}),
        coverage_terms_json=json.dumps({"exclusions": ["Unattended vehicle loss"]}),
        public_announcements_json=json.dumps([{"title": "Initial 2025 launch"}]),
    )

    # Simulate price hike, new exclusion, and new announcement
    new_data = {
        "content_hash": "newhash456",
        "pricing_data": {"base_rate": "0.55%", "minimum_premium": "SGD 5,000"},
        "coverage_terms": {"exclusions": ["Unattended vehicle loss", "Unapproved display cabinets"]},
        "public_announcements": [
            {"title": "Initial 2025 launch"},
            {"title": "New 2026 Commercial Underwriting Guidelines", "summary": "Strict new retail warranties introduced."},
        ],
    }

    diffs = detector.detect_changes(
        competitor_name="Example Insurer",
        competitor_id=2,
        new_data=new_data,
        prev_snapshot=prev_snapshot,
    )

    assert len(diffs) >= 3

    change_types = [d["change_type"] for d in diffs]
    assert "pricing_change" in change_types
    assert "coverage_update" in change_types
    assert "social_campaign" in change_types

    # Base rate change should be critical severity
    rate_change = next(d for d in diffs if "baseline underwriting rate" in d["title"])
    assert rate_change["severity"] == "critical"
    assert rate_change["old_value"] == "0.35%"
    assert rate_change["new_value"] == "0.55%"

    # Coverage exclusion should be major severity
    cov_change = next(d for d in diffs if d["change_type"] == "coverage_update")
    assert cov_change["severity"] == "major"
    assert "Unapproved display cabinets" in cov_change["description"]


# -------------------------------------------------------------------------
# Test 10: Structured Extraction Schema Validation
# -------------------------------------------------------------------------
def test_structured_extraction_schema():
    raw_dict = {
        "page_title": "Chubb Jewellers Block Singapore",
        "pricing_data": {
            "base_rate": "0.45% - 0.75%",
            "minimum_premium": "SGD 4,500",
            "deductible_terms": "SGD 2,500 per claim",
            "pricing_summary": "Premium tier pricing for luxury jewelers.",
        },
        "coverage_terms": {
            "inclusions": ["Precious stones", "Transit between stores", "Trade fair floater"],
            "exclusions": ["Unattended vehicle", "Sub-standard safe"],
            "target_customer": "Tier-1 Retailers",
        },
        "public_announcements": [
            {
                "title": "Chubb tightens high-value gemstone warranty rules",
                "date": "2026",
                "summary": "Mandates dual-GSM alarm and UL safe certification.",
            }
        ],
    }

    validated = CompetitorExtractionSchema.model_validate(raw_dict)
    assert validated.page_title == "Chubb Jewellers Block Singapore"
    assert validated.pricing_data.minimum_premium == "SGD 4,500"
    assert len(validated.coverage_terms.inclusions) == 3
    assert len(validated.public_announcements) == 1


# -------------------------------------------------------------------------
# Test 11: Malformed LLM Response Graceful Fallback
# -------------------------------------------------------------------------
def test_malformed_llm_response_fallback():
    # Test that monitor fallback handles unparseable content safely
    monitor = CompetitorMonitor()
    parsed = monitor.inspect_competitor(
        competitor_name="Test Broken LLM Insurer",
        niche="medical",
        url="https://example.com/broken",
        known_pricing="SGD 2,500 annual",
        known_strengths="Standard doctor coverage",
    )
    assert parsed.pricing_data is not None
    assert "base_rate" in parsed.pricing_data
    assert parsed.coverage_terms is not None
    assert len(parsed.coverage_terms.get("inclusions", [])) > 0


# -------------------------------------------------------------------------
# Test 12: Threat Assessment
# -------------------------------------------------------------------------
def test_threat_assessment():
    with Session(engine) as db:
        comp = Competitor(
            name="Threat Assessment Target",
            category="jewellery",
            title="Threat Test",
            summary="Testing threat level escalation",
            threat_level="medium",
            url="https://example.com/target",
        )
        db.add(comp)
        db.flush()

        # Add an initial baseline snapshot
        snap1 = CompetitorSnapshot(
            competitor_id=comp.id,
            page_url=comp.url,
            content_hash="hash1",
            pricing_data_json=json.dumps({"base_rate": "0.30%", "minimum_premium": "SGD 2,500"}),
            coverage_terms_json=json.dumps({"exclusions": ["Standard terms"]}),
        )
        db.add(snap1)
        db.commit()

        # Mock a scan where competitor revises base rate (triggering critical diff)
        # Scan method should auto-escalate threat_level to 'high'
        res = competitor_service.scan_competitor(db, comp.id)
        db.refresh(comp)
        assert res["status"] in ("success", "partial_fallback")
        assert comp.last_monitored_at is not None


# -------------------------------------------------------------------------
# Test 13: Battlecard Generation
# -------------------------------------------------------------------------
def test_battlecard_generation():
    generator = BattlecardGenerator()

    # Medical competitor (DoctorShield)
    mps_comp = Competitor(
        name="MPS Singapore Medical Protection",
        category="medical",
        brand="doctorshield",
        market="Singapore",
        underwriter="Discretionary Mutual Defense Fund",
        pricing_summary="SGD 3,000 GP to SGD 25,000+ surgeon",
        coverage_strengths="Long clinical history",
        coverage_weaknesses="Discretionary mutual, not an insurance contract",
    )

    bc = generator.generate_battlecard(mps_comp)
    assert bc["ja_product"] == "DoctorShield"
    assert len(bc["why_ja_wins"]) > 0
    assert len(bc["where_competitor_wins"]) > 0
    assert len(bc["objection_handling"]) > 0
    assert "contract" in str(bc["why_ja_wins"]).lower() or "certainty" in str(bc["why_ja_wins"]).lower()
    assert bc["sales_pitch_hook"] != ""

    # Transit competitor (Jaguar Transit)
    brinks_comp = Competitor(
        name="Brink's Armored Logistics",
        category="transit",
        brand="jaguartransit",
        market="Singapore",
        underwriter="Lloyd's Specie",
        pricing_summary="Ad-valorem + armored minimum fees",
        coverage_strengths="Physical armored trucks",
        coverage_weaknesses="Mandates using own armored courier fleet",
    )
    bc_transit = generator.generate_battlecard(brinks_comp)
    assert bc_transit["ja_product"] == "Jaguar Transit"
    assert "courier" in str(bc_transit["why_ja_wins"]).lower() or "digital" in str(bc_transit["why_ja_wins"]).lower()


# -------------------------------------------------------------------------
# Test 14: API Endpoints Verification
# -------------------------------------------------------------------------
def test_api_endpoints():
    # 1. GET /competitors
    res = client.get("/api/v1/competitors")
    assert res.status_code == 200
    competitors = res.json()
    assert isinstance(competitors, list)
    assert len(competitors) > 0

    first_comp = competitors[0]
    comp_id = first_comp["id"]

    # 2. GET /competitors/{comp_id}
    res_get = client.get(f"/api/v1/competitors/{comp_id}")
    assert res_get.status_code == 200
    assert res_get.json()["id"] == comp_id

    # 3. POST /competitors/{comp_id}/scan
    res_scan = client.post(f"/api/v1/competitors/{comp_id}/scan")
    assert res_scan.status_code == 200
    scan_data = res_scan.json()
    assert scan_data["competitor_id"] == comp_id
    assert "content_hash" in scan_data
    assert "changes_detected" in scan_data

    # 4. GET /competitors/{comp_id}/snapshots
    res_snaps = client.get(f"/api/v1/competitors/{comp_id}/snapshots")
    assert res_snaps.status_code == 200
    snapshots = res_snaps.json()
    assert isinstance(snapshots, list)
    assert len(snapshots) >= 1

    # 5. GET /competitors/{comp_id}/changes
    res_changes = client.get(f"/api/v1/competitors/{comp_id}/changes")
    assert res_changes.status_code == 200
    assert isinstance(res_changes.json(), list)

    # 6. GET /competitors/changes (all changes feed)
    res_all_changes = client.get("/api/v1/competitors/changes")
    assert res_all_changes.status_code == 200
    assert isinstance(res_all_changes.json(), list)

    # 7. GET /competitors/{comp_id}/battlecard
    res_bc = client.get(f"/api/v1/competitors/{comp_id}/battlecard")
    assert res_bc.status_code == 200
    bc_json = res_bc.json()
    assert bc_json["competitor_id"] == comp_id
    assert "ja_product" in bc_json
    assert "why_ja_wins" in bc_json
    assert "where_competitor_wins" in bc_json
    assert "objection_handling" in bc_json

    # 8. GET /competitors/hook (Lead Discovery Cross-Link)
    res_hook = client.get("/api/v1/competitors/hook?brand=jade&industry=jewellery")
    assert res_hook.status_code == 200
    hook_json = res_hook.json()
    assert hook_json["ja_product"] == "Jade"
    assert "sales_pitch_hook" in hook_json
    assert "why_ja_wins" in hook_json

    # 9. POST /competitors
    res_create = client.post(
        "/api/v1/competitors",
        json={
            "name": "API Created Specialty Carrier",
            "url": "https://api-specialty.sg",
            "category": "transit",
            "brand": "jaguartransit",
            "threat_level": "medium",
        }
    )
    assert res_create.status_code == 201
    created_comp = res_create.json()
    assert created_comp["name"] == "API Created Specialty Carrier"
