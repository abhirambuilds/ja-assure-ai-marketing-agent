import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_research_context_and_competitor_scraping():
    # 1. Run research
    res = client.post("/api/v1/research/run", json={"brand": "jade", "topic": "Jewellery Appraisal Caps"})
    assert res.status_code == 200
    data = res.json()
    assert data["brand"] == "jade"
    assert len(data["competitor_insights"]) > 0

    # 2. Scrape competitor URL
    scrape_res = client.post("/api/v1/research/scrape", json={"url": "https://briteprotect.example.com"})
    assert scrape_res.status_code == 200
    assert "url" in scrape_res.json()

def test_smart_content_generation_with_lessons_and_ab():
    payload = {
        "brand": "doctorshield",
        "platform": "linkedin",
        "topic": "Telemedicine Medico-Legal Liabilities",
        "key_benefits": ["Panel defence counsel", "Retroactive coverage"]
    }
    res = client.post("/api/v1/content/generate", json=payload)
    assert res.status_code == 200
    variations = res.json()
    assert len(variations) == 2
    assert variations[0]["variation_label"] == "A"
    assert variations[1]["variation_label"] == "B"
    # Verify mandatory disclaimer is present
    assert "terms" in variations[0]["content_text"].lower()

def test_compliance_check_and_rewrite():
    # 1. Flagged non-compliant text
    bad_copy = "100% Guaranteed payout with zero risk and no questions asked!"
    check_res = client.post("/api/v1/compliance/check", json={"brand": "jade", "content_text": bad_copy})
    assert check_res.status_code == 200
    assert check_res.json()["passed"] is False

    # 2. Compliance Rewrite Workflow
    rewrite_res = client.post("/api/v1/compliance/rewrite", json={"brand": "jade", "content_text": bad_copy})
    assert rewrite_res.status_code == 200
    r_data = rewrite_res.json()
    assert r_data["new_score"] > r_data["previous_score"]
    assert r_data["new_passed"] is True
    assert "terms" in r_data["corrected_text"].lower()
    assert r_data["human_review_required"] is True

def test_queue_rewrite_endpoint():
    # Create or ensure an item is awaiting human review (non-compliant text) so the
    # rewrite endpoint has something to fix. Rewrite is only legal from a HUMAN_REVIEW
    # status (see hitl_service) — "rejected" is intentionally not one of them (a rejected
    # item must be re-drafted via /regenerate, not silently rewritten).
    create_res = client.post("/api/v1/queue", json={
        "brand": "jade",
        "platform": "facebook",
        "content_type": "post",
        "topic": "100% Risk Free Guarantee Diamond Protection",
        "content_raw": "Never worry about lost diamonds again! 100% Guaranteed payout with zero risk and no questions asked!",
        "variation": "A",
        "language": "en",
        "compliance_status": "failed",
        "status": "pending",
        "compliance_score": 45.0,
        "reason_tag": "false_guarantee",
        "notes": "Flagged for false guarantee"
    })
    assert create_res.status_code == 201
    item_id = create_res.json()["id"]

    # Trigger compliance rewrite
    rewrite_res = client.post(f"/api/v1/queue/{item_id}/rewrite")
    assert rewrite_res.status_code == 200
    updated_item = rewrite_res.json()
    assert updated_item["status"] == "human_review" # NEVER auto-approved
    assert updated_item["compliance_score"] >= 80.0

def test_lead_intelligence_with_context():
    res = client.post("/api/v1/leads/discover", json={"brand": "doctorshield"})
    assert res.status_code == 200
    prospects = res.json()
    assert len(prospects) > 0
    lead = prospects[0]
    assert lead["fit_score"] > 0
    assert lead["outreach_draft"] is not None
    assert "DoctorShield" in lead["outreach_draft"]

def test_closed_loop_feedback_and_analytics():
    # 1. Run Content Suite
    suite_req = {
        "brand": "jaguartransit",
        "topic": "High-Value Cargo Port Delay Security",
        "platforms": ["linkedin"],
        "content_types": ["post"],
        "languages": ["en"]
    }
    res = client.post("/api/v1/content/suite", json=suite_req)
    assert res.status_code == 200
    created = res.json()
    assert len(created) > 0
    item = created[0]

    # 2. Reject item with reason tag
    reject_res = client.post(f"/api/v1/queue/{item['id']}/reject", json={
        "reason_tag": "missing_disclaimer",
        "notes": "Intermediary license disclosure was omitted."
    })
    assert reject_res.status_code == 200

    # 3. Check analytics
    analytics_res = client.get("/api/v1/analytics/summary")
    assert analytics_res.status_code == 200
    summary = analytics_res.json()
    assert "rejection_rate" in summary
    assert "feedback_reason_frequency" in summary
    assert "missing_disclaimer" in summary["feedback_reason_frequency"]
