import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.models.entities import ContentQueue, Lead, Competitor, LessonLearned

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "brands" in data
    assert "jade" in data["brands"]

def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert data["llm_provider"] == "Groq"
    assert "llm_mode" in data

def test_list_queue():
    response = client.get("/api/v1/queue")
    assert response.status_code == 200
    items = response.json()
    assert isinstance(items, list)
    assert len(items) > 0

def test_list_leads():
    response = client.get("/api/v1/leads")
    assert response.status_code == 200
    leads = response.json()
    assert isinstance(leads, list)
    assert len(leads) > 0

def test_list_competitors():
    response = client.get("/api/v1/competitors")
    assert response.status_code == 200
    competitors = response.json()
    assert isinstance(competitors, list)
    assert len(competitors) > 0

def test_list_lessons():
    response = client.get("/api/v1/lessons")
    assert response.status_code == 200
    lessons = response.json()
    assert isinstance(lessons, list)
    assert len(lessons) > 0

def test_analytics_summary():
    response = client.get("/api/v1/analytics/summary")
    assert response.status_code == 200
    summary = response.json()
    assert "total_content" in summary
    assert "average_compliance_score" in summary
    assert summary["total_content"] > 0

def test_agents_list():
    response = client.get("/api/v1/agents/list")
    assert response.status_code == 200
    data = response.json()
    assert "agents" in data
    assert "compliance" in data["agents"]
    assert "content" in data["agents"]

def test_compliance_agent_run():
    response = client.post(
        "/api/v1/agents/run/compliance",
        json={"brand": "jade", "content_text": "100% guaranteed diamond replacement with zero exclusions."}
    )
    assert response.status_code == 200
    res = response.json()
    assert res["status"] == "success"
    assert "output" in res
    assert "passed" in res["output"] or "score" in res["output"]

def test_analytics_summary_kpis_and_distributions():
    response = client.get("/api/v1/analytics/summary")
    assert response.status_code == 200
    summary = response.json()
    assert "approval_rate" in summary
    assert "active_lessons_count" in summary
    assert "total_feedback_count" in summary
    assert "compliance_score_distribution" in summary
    assert "lead_score_distribution" in summary
    assert "status_breakdown" in summary
    assert "90_100" in summary["compliance_score_distribution"]
    assert "tier_1_high" in summary["lead_score_distribution"]

def test_publishing_strict_governance_rejection():
    # Attempting to schedule a pending item must fail with 400
    # First create or find a pending item
    queue_res = client.get("/api/v1/queue")
    items = queue_res.json()
    pending_item = next((i for i in items if i["status"] in ["pending", "human_review"]), None)
    if pending_item:
        pub_res = client.post("/api/v1/publishing", json={
            "content_id": pending_item["id"],
            "platform": "linkedin"
        })
        assert pub_res.status_code == 400
        assert "Cannot schedule content unless status='approved'" in pub_res.json()["detail"]

    # Non-existent item should return 404
    pub_res_none = client.post("/api/v1/publishing", json={
        "content_id": 999999,
        "platform": "linkedin"
    })
    assert pub_res_none.status_code == 404

def test_publishing_lifecycle_on_approved_content():
    # 1. Create a content item or use an existing approved item
    queue_res = client.get("/api/v1/queue")
    items = queue_res.json()
    approved_item = next((i for i in items if i["status"] == "approved" and i["compliance_score"] >= 80), None)
    
    if not approved_item:
        # Find any item and approve it
        item_to_approve = items[0]
        approve_res = client.post(f"/api/v1/queue/{item_to_approve['id']}/approve", json={"notes": "Approved for dispatch test"})
        approved_item = approve_res.json()
    
    content_id = approved_item["id"]

    # 2. Schedule dispatch preview
    schedule_res = client.post("/api/v1/publishing", json={
        "content_id": content_id,
        "platform": "linkedin",
        "scheduled_at": "2026-10-01T09:00:00Z"
    })
    assert schedule_res.status_code == 201
    record = schedule_res.json()
    assert record["content_id"] == content_id
    assert record["status"] == "scheduled"
    assert record["platform"] == "linkedin"
    record_id = record["id"]

    # 3. Retrieve list and specific record
    list_res = client.get("/api/v1/publishing")
    assert list_res.status_code == 200
    records = list_res.json()
    assert any(r["id"] == record_id for r in records)

    get_res = client.get(f"/api/v1/publishing/{record_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == record_id

    # 4. Cancel scheduled dispatch
    cancel_res = client.patch(f"/api/v1/publishing/{record_id}/cancel")
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "cancelled"

    # Verify content item status reverted to approved
    reverted_item_res = client.get(f"/api/v1/queue/{content_id}")
    assert reverted_item_res.json()["status"] == "approved"

