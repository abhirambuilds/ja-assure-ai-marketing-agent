"""
Human-in-the-Loop governance tests.

These tests exercise the HITL state machine (app/services/hitl_service.py) end-to-end
through the public API: they verify legal transitions succeed, illegal transitions are
rejected with 409, publishing is only reachable via approved+compliance-passed, and that
attempts to bypass the workflow through direct API calls (PATCH / creation with a
privileged status) are neutralized server-side rather than merely hidden in the UI.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def _create_item(status="pending", compliance_status="passed", compliance_score=100.0, **overrides):
    payload = {
        "brand": "jade",
        "platform": "linkedin",
        "content_type": "post",
        "topic": "HITL Governance Test Topic",
        "content_raw": "Jade offers agreed-value coverage for bespoke jewellery collections.\n\n*Terms and conditions apply.*",
        "variation": "A",
        "language": "en",
        "compliance_status": compliance_status,
        "status": status,
        "compliance_score": compliance_score,
    }
    payload.update(overrides)
    res = client.post("/api/v1/queue", json=payload)
    assert res.status_code == 201, res.text
    return res.json()


# ---------------------------------------------------------------------------
# 1. Approval
# ---------------------------------------------------------------------------

def test_approve_from_human_review_succeeds():
    item = _create_item(status="human_review")
    res = client.post(f"/api/v1/queue/{item['id']}/approve")
    assert res.status_code == 200
    assert res.json()["status"] == "approved"


def test_approve_from_rejected_is_blocked():
    item = _create_item(status="pending")
    reject_res = client.post(f"/api/v1/queue/{item['id']}/reject", json={
        "reason_tag": "false_guarantee", "notes": "Contains an absolute guarantee."
    })
    assert reject_res.status_code == 200
    assert reject_res.json()["status"] == "rejected"

    # Bypass attempt: approve a rejected item directly without ever addressing the rejection.
    approve_res = client.post(f"/api/v1/queue/{item['id']}/approve")
    assert approve_res.status_code == 409
    assert "Cannot 'approve'" in approve_res.json()["detail"]


# ---------------------------------------------------------------------------
# 2. Rejection
# ---------------------------------------------------------------------------

def test_reject_from_human_review_succeeds():
    item = _create_item(status="human_review")
    res = client.post(f"/api/v1/queue/{item['id']}/reject", json={
        "reason_tag": "off_brand", "notes": "Tone doesn't match Jade voice."
    })
    assert res.status_code == 200
    assert res.json()["status"] == "rejected"


def test_reject_already_approved_is_blocked():
    item = _create_item(status="human_review")
    assert client.post(f"/api/v1/queue/{item['id']}/approve").status_code == 200
    res = client.post(f"/api/v1/queue/{item['id']}/reject", json={
        "reason_tag": "off_brand", "notes": "too late"
    })
    assert res.status_code == 409


# ---------------------------------------------------------------------------
# 3. Edit  &  4. Edit -> review again
# ---------------------------------------------------------------------------

def test_edit_returns_item_to_human_review_not_approved():
    item = _create_item(status="human_review")
    res = client.post(f"/api/v1/queue/{item['id']}/edit", json={
        "edited_content": "Jade provides agreed-value protection for bespoke jewellery. *Terms and conditions apply.*",
        "reason_tag": "human_edit",
        "notes": "Tightened the copy."
    })
    assert res.status_code == 200
    updated = res.json()
    assert updated["status"] == "human_review"  # an edit is NEVER auto-approved
    assert updated["content_raw"].startswith("Jade provides agreed-value protection")


def test_edited_content_must_be_reviewed_again_before_publish():
    item = _create_item(status="human_review")
    edit_res = client.post(f"/api/v1/queue/{item['id']}/edit", json={
        "edited_content": "Edited copy awaiting fresh sign-off. *Terms and conditions apply.*",
    })
    assert edit_res.status_code == 200
    assert edit_res.json()["status"] == "human_review"

    # Immediately after an edit, with no fresh approval, publishing must fail.
    pub_res = client.post("/api/v1/publishing", json={"content_id": item["id"], "platform": "linkedin"})
    assert pub_res.status_code == 400

    # Only after a fresh, explicit approval does it become schedulable.
    approve_res = client.post(f"/api/v1/queue/{item['id']}/approve")
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "approved"


def test_edit_preserves_original_ai_generated_text_across_multiple_edits():
    original_text = "Original AI draft about worldwide jewellery transit protection."
    item = _create_item(status="human_review", content_raw=original_text)
    client.post(f"/api/v1/queue/{item['id']}/edit", json={"edited_content": "First human edit."})
    client.post(f"/api/v1/queue/{item['id']}/edit", json={"edited_content": "Second human edit."})

    fetched = client.get(f"/api/v1/queue/{item['id']}").json()
    assert fetched["content_raw"] == "Second human edit."
    assert fetched["original_content_raw"] == original_text  # never overwritten, regardless of edit count


# ---------------------------------------------------------------------------
# 5. Compliance failure -> cannot publish
# ---------------------------------------------------------------------------

def test_compliance_flagged_content_cannot_publish_even_if_approved():
    # Approve is a human-override action and does not itself require compliance_status
    # to be 'passed' — but the publishing gate independently must, regardless of approval.
    item = _create_item(status="human_review", compliance_status="flagged", compliance_score=40.0)
    approve_res = client.post(f"/api/v1/queue/{item['id']}/approve")
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "approved"

    pub_res = client.post("/api/v1/publishing", json={"content_id": item["id"], "platform": "linkedin"})
    assert pub_res.status_code == 400
    assert "compliance_status='passed'" in pub_res.json()["detail"]


# ---------------------------------------------------------------------------
# 6. Unreviewed content -> cannot publish
# ---------------------------------------------------------------------------

def test_pending_content_cannot_publish():
    item = _create_item(status="pending")
    pub_res = client.post("/api/v1/publishing", json={"content_id": item["id"], "platform": "linkedin"})
    assert pub_res.status_code == 400


def test_human_review_content_cannot_publish():
    item = _create_item(status="human_review")
    pub_res = client.post("/api/v1/publishing", json={"content_id": item["id"], "platform": "linkedin"})
    assert pub_res.status_code == 400


# ---------------------------------------------------------------------------
# 7. Rejected content -> cannot publish (and cannot be silently rewritten)
# ---------------------------------------------------------------------------

def test_rejected_content_cannot_publish():
    item = _create_item(status="pending")
    client.post(f"/api/v1/queue/{item['id']}/reject", json={"reason_tag": "off_brand", "notes": "no"})
    pub_res = client.post("/api/v1/publishing", json={"content_id": item["id"], "platform": "linkedin"})
    assert pub_res.status_code == 400


def test_rejected_content_cannot_be_rewritten_directly():
    item = _create_item(status="pending")
    client.post(f"/api/v1/queue/{item['id']}/reject", json={"reason_tag": "off_brand", "notes": "no"})
    res = client.post(f"/api/v1/queue/{item['id']}/rewrite")
    assert res.status_code == 409


def test_rejected_content_can_be_regenerated_into_fresh_review():
    item = _create_item(status="pending")
    client.post(f"/api/v1/queue/{item['id']}/reject", json={"reason_tag": "off_brand", "notes": "no"})
    res = client.post(f"/api/v1/queue/{item['id']}/regenerate")
    assert res.status_code == 200
    assert res.json()["status"] == "human_review"


# ---------------------------------------------------------------------------
# 8. Direct API bypass attempts
# ---------------------------------------------------------------------------

def test_patch_cannot_set_privileged_fields_directly():
    item = _create_item(status="pending", compliance_status="pending", compliance_score=0.0)
    res = client.patch(f"/api/v1/queue/{item['id']}", json={
        "status": "approved",
        "compliance_status": "passed",
        "compliance_score": 100.0,
        "content_raw": "Fabricated approved text.",
        "notes": "attempted bypass via PATCH",
    })
    assert res.status_code == 200  # the request succeeds; the privileged fields are just not accepted

    fetched = client.get(f"/api/v1/queue/{item['id']}").json()
    assert fetched["status"] == "pending"
    assert fetched["compliance_status"] == "pending"
    assert fetched["compliance_score"] == 0.0
    assert fetched["content_raw"] != "Fabricated approved text."
    assert fetched["notes"] == "attempted bypass via PATCH"  # non-privileged metadata still updates normally

    pub_res = client.post("/api/v1/publishing", json={"content_id": item["id"], "platform": "linkedin"})
    assert pub_res.status_code == 400


def test_create_cannot_seed_approved_status_directly():
    res = client.post("/api/v1/queue", json={
        "brand": "jade", "platform": "linkedin", "content_type": "post",
        "topic": "Bypass attempt", "content_raw": "Attempted fabricated approved content.",
        "variation": "A", "language": "en",
        "compliance_status": "passed", "status": "approved", "compliance_score": 100.0,
    })
    assert res.status_code == 201
    created = res.json()
    assert created["status"] == "pending"  # server clamps a privileged initial status

    pub_res = client.post("/api/v1/publishing", json={"content_id": created["id"], "platform": "linkedin"})
    assert pub_res.status_code == 400


# ---------------------------------------------------------------------------
# 9. Approved + compliance pass -> publishable
# ---------------------------------------------------------------------------

def test_approved_and_compliance_passed_is_publishable():
    item = _create_item(status="human_review", compliance_status="passed", compliance_score=95.0)
    approve_res = client.post(f"/api/v1/queue/{item['id']}/approve")
    assert approve_res.status_code == 200

    pub_res = client.post("/api/v1/publishing", json={
        "content_id": item["id"], "platform": "linkedin", "scheduled_at": "2026-12-01T09:00:00Z"
    })
    assert pub_res.status_code == 201
    assert pub_res.json()["status"] == "scheduled"


# ---------------------------------------------------------------------------
# Audit trail (ReviewDecision)
# ---------------------------------------------------------------------------

def test_review_decisions_are_logged_in_order_for_edit_then_approve():
    item = _create_item(status="human_review")
    client.post(f"/api/v1/queue/{item['id']}/edit", json={"edited_content": "Edited text for audit trail test."})
    client.post(f"/api/v1/queue/{item['id']}/approve")

    history = client.get(f"/api/v1/queue/{item['id']}/history").json()
    decisions = [h["decision"] for h in history]
    assert decisions == ["edit", "approve"]
    assert history[0]["previous_status"] == "human_review"
    assert history[0]["new_status"] == "human_review"
    assert history[0]["edited_content"] == "Edited text for audit trail test."
    assert history[1]["previous_status"] == "human_review"
    assert history[1]["new_status"] == "approved"
