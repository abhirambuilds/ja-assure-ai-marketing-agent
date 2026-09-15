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
