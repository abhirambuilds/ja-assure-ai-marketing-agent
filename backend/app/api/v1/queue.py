from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from app.database.session import get_db
from app.models.entities import ContentQueue, Feedback
from app.schemas.dtos import (
    ContentQueueCreate,
    ContentQueueUpdate,
    ContentQueueResponse,
    FeedbackCreate,
)
from app.schemas.agent_contracts import HumanReviewAction

router = APIRouter(prefix="/queue", tags=["Content Queue"])

@router.get("", response_model=List[ContentQueueResponse])
def list_queue(
    brand: Optional[str] = Query(None, description="Filter by brand"),
    platform: Optional[str] = Query(None, description="Filter by platform"),
    status: Optional[str] = Query(None, description="Filter by queue status"),
    compliance_status: Optional[str] = Query(None, description="Filter by compliance status"),
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
    items = db.execute(query).scalars().all()
    return items

@router.post("", response_model=ContentQueueResponse, status_code=201)
def create_queue_item(item_in: ContentQueueCreate, db: Session = Depends(get_db)):
    item = ContentQueue(**item_in.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.get("/{item_id}", response_model=ContentQueueResponse)
def get_queue_item(item_id: int, db: Session = Depends(get_db)):
    item = db.get(ContentQueue, item_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Content item {item_id} not found")
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

@router.post("/{item_id}/review", response_model=ContentQueueResponse)
def submit_human_review(
    item_id: int,
    action: HumanReviewAction,
    db: Session = Depends(get_db)
):
    item = db.get(ContentQueue, item_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Content item {item_id} not found")

    if action.action == "approve":
        item.status = "approved"
        item.notes = action.notes or item.notes
    elif action.action == "reject":
        item.status = "rejected"
        item.reason_tag = action.reason_tag or "human_rejected"
        item.notes = action.notes or item.notes
        # Record feedback for the closed-loop learning mechanism
        feedback = Feedback(
            content_id=item.id,
            reason_tag=item.reason_tag,
            notes=action.notes or "Rejected by human reviewer",
            original_content=item.content_raw,
            corrected_content=action.corrected_content
        )
        db.add(feedback)
    elif action.action == "edit":
        item.status = "approved" # edited and approved
        feedback = Feedback(
            content_id=item.id,
            reason_tag=action.reason_tag or "human_edit",
            notes=action.notes or "Edited during human review",
            original_content=item.content_raw,
            corrected_content=action.corrected_content
        )
        if action.corrected_content:
            item.content_raw = action.corrected_content
        db.add(feedback)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported review action: {action.action}")

    db.commit()
    db.refresh(item)
    return item
