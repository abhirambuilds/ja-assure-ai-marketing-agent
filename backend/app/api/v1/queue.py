from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from app.database.session import get_db
from app.models.entities import ContentQueue, Feedback
from app.schemas.dtos import (
    ContentQueueCreate,
    ContentQueueUpdate,
    ContentQueueResponse,
)
from app.schemas.agent_contracts import HumanReviewAction
from app.services.compliance_service import compliance_service
from app.services.lessons_service import lessons_service
from app.services.content_service import content_service
from app.schemas.agent_contracts import ContentBrief

router = APIRouter(prefix="/queue", tags=["Content Queue & Human Review"])

class RejectRequest(BaseModel):
    reason_tag: str
    notes: str
    reviewer: Optional[str] = "compliance_officer"

class EditRequest(BaseModel):
    edited_content: str
    reason_tag: Optional[str] = "human_edit"
    notes: Optional[str] = "Edited during human review"
    reviewer: Optional[str] = "compliance_officer"

@router.get("", response_model=List[ContentQueueResponse])
def list_queue(
    brand: Optional[str] = Query(None),
    platform: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    compliance_status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = select(ContentQueue)
    if brand:
        query = query.where(ContentQueue.brand == brand.lower())
    if platform:
        query = query.where(ContentQueue.platform == platform.lower())
    if status:
        query = query.where(ContentQueue.status == status)
    if compliance_status:
        query = query.where(ContentQueue.compliance_status == compliance_status)

    query = query.order_by(desc(ContentQueue.created_at)).offset(offset).limit(limit)
    return db.execute(query).scalars().all()

@router.get("/pending", response_model=List[ContentQueueResponse])
def get_pending_content(db: Session = Depends(get_db)):
    """Retrieve content items awaiting human review."""
    query = select(ContentQueue).where(ContentQueue.status.in_(["human_review", "pending"])).order_by(desc(ContentQueue.created_at))
    return db.execute(query).scalars().all()

@router.get("/approved", response_model=List[ContentQueueResponse])
def get_approved_content(db: Session = Depends(get_db)):
    """Retrieve content items that have received human sign-off."""
    query = select(ContentQueue).where(ContentQueue.status.in_(["approved", "scheduled", "published"])).order_by(desc(ContentQueue.created_at))
    return db.execute(query).scalars().all()

@router.get("/rejected", response_model=List[ContentQueueResponse])
def get_rejected_content(db: Session = Depends(get_db)):
    """Retrieve rejected items with feedback tags."""
    query = select(ContentQueue).where(ContentQueue.status == "rejected").order_by(desc(ContentQueue.created_at))
    return db.execute(query).scalars().all()

@router.get("/{item_id}", response_model=ContentQueueResponse)
def get_queue_item(item_id: int, db: Session = Depends(get_db)):
    item = db.get(ContentQueue, item_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Content item {item_id} not found")
    return item

@router.post("/{item_id}/approve", response_model=ContentQueueResponse)
def approve_content(item_id: int, notes: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Mandatory human approval action.
    Advances content item to 'approved' status ready for scheduling/publishing.
    """
    item = db.get(ContentQueue, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Content item not found")

    item.status = "approved"
    if notes:
        item.notes = notes
    db.commit()
    db.refresh(item)
    return item

@router.post("/{item_id}/reject", response_model=ContentQueueResponse)
def reject_content(item_id: int, req: RejectRequest, db: Session = Depends(get_db)):
    """
    Human rejection action.
    Marks item as 'rejected' and synthesizes/updates an active Lesson Learned in the DB.
    """
    item = db.get(ContentQueue, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Content item not found")

    item.status = "rejected"
    item.reason_tag = req.reason_tag
    item.notes = req.notes

    # Ingest into closed-loop learning system
    lessons_service.record_feedback_and_synthesize(
        content_id=item.id,
        reason_tag=req.reason_tag,
        notes=req.notes,
        original_content=item.content_raw
    )

    db.commit()
    db.refresh(item)
    return item

@router.post("/{item_id}/edit", response_model=ContentQueueResponse)
def edit_content(item_id: int, req: EditRequest, db: Session = Depends(get_db)):
    """
    Human edit action.
    Preserves original text, updates content to corrected version, marks as 'approved',
    and records feedback for learning.
    """
    item = db.get(ContentQueue, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Content item not found")

    original_text = item.content_raw
    item.content_raw = req.edited_content
    item.status = "approved"
    item.reason_tag = req.reason_tag or "human_edit"
    item.notes = req.notes or "Edited and approved by reviewer"

    # Record feedback
    lessons_service.record_feedback_and_synthesize(
        content_id=item.id,
        reason_tag=item.reason_tag,
        notes=item.notes,
        original_content=original_text,
        corrected_content=req.edited_content
    )

    db.commit()
    db.refresh(item)
    return item

@router.post("/{item_id}/compliance", response_model=ContentQueueResponse)
async def rerun_compliance(item_id: int, db: Session = Depends(get_db)):
    """
    Re-evaluate compliance gate on current content text.
    """
    item = db.get(ContentQueue, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Content item not found")

    res = await compliance_service.evaluate_content(
        brand=item.brand,
        content_text=item.content_raw,
        content_type=item.content_type
    )

    item.compliance_status = "passed" if res.passed else "flagged"
    item.compliance_score = res.score
    item.notes = res.overall_feedback
    if res.violations:
        item.reason_tag = res.violations[0].rule_id

    db.commit()
    db.refresh(item)
    return item

@router.post("/{item_id}/regenerate", response_model=ContentQueueResponse)
async def regenerate_content(item_id: int, db: Session = Depends(get_db)):
    """
    Regenerate content item using updated active lessons learned from human feedback.
    """
    item = db.get(ContentQueue, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Content item not found")

    active_lessons = lessons_service.get_relevant_lessons_for_prompt(brand=item.brand, platform=item.platform)
    brief = ContentBrief(
        brand=item.brand,
        platform=item.platform,
        content_type=item.content_type,
        topic=item.topic,
        language=item.language,
        variations_count=1,
        context_lessons=active_lessons
    )

    variations = await content_service.generate_variations(brief)
    if variations:
        new_var = variations[0]
        item.content_raw = new_var.content_text
        item.status = "human_review" # pending review again
        # re-evaluate compliance
        comp = await compliance_service.evaluate_content(
            brand=item.brand,
            content_text=new_var.content_text,
            content_type=item.content_type
        )
        item.compliance_status = "passed" if comp.passed else "flagged"
        item.compliance_score = comp.score
        item.notes = f"Regenerated with {len(active_lessons)} active lessons learned. Compliance: {comp.overall_feedback}"

    db.commit()
    db.refresh(item)
    return item

@router.post("/{item_id}/rewrite", response_model=ContentQueueResponse)
async def rewrite_queue_item(item_id: int, db: Session = Depends(get_db)):
    """
    Automated Compliance Rewrite workflow:
    Rewrites non-compliant copy, re-checks compliance score, and places
    item into 'human_review' status for human verification.
    """
    item = db.get(ContentQueue, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Content item not found")

    rewrite_res = await compliance_service.rewrite_non_compliant_content(
        brand=item.brand,
        original_text=item.content_raw
    )

    item.content_raw = rewrite_res["corrected_text"]
    item.compliance_score = rewrite_res["new_score"]
    item.compliance_status = "passed" if rewrite_res["new_passed"] else "flagged"
    item.status = "human_review" # MANDATORY: never auto-approved
    item.notes = f"Compliance rewrite completed. Score improved from {rewrite_res['previous_score']} to {rewrite_res['new_score']}. Awaiting human review."

    db.commit()
    db.refresh(item)
    return item

@router.post("", response_model=ContentQueueResponse, status_code=201)
def create_queue_item(item_in: ContentQueueCreate, db: Session = Depends(get_db)):
    item = ContentQueue(**item_in.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.patch("/{item_id}", response_model=ContentQueueResponse)
def update_queue_item(item_id: int, item_in: ContentQueueUpdate, db: Session = Depends(get_db)):
    item = db.get(ContentQueue, item_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Content item {item_id} not found")

    update_data = item_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}", status_code=204)
def delete_queue_item(item_id: int, db: Session = Depends(get_db)):
    item = db.get(ContentQueue, item_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Content item {item_id} not found")
    db.delete(item)
    db.commit()
    return None
