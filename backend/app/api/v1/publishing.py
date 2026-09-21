from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from app.database.session import get_db
from app.models.entities import PublishingRecord, ContentQueue
from app.schemas.dtos import PublishingRecordCreate, PublishingRecordResponse
from app.services.hitl_service import is_publishable

router = APIRouter(prefix="/publishing", tags=["Publishing"])

@router.get("", response_model=List[PublishingRecordResponse])
def list_publishing_records(db: Session = Depends(get_db)):
    """
    List all simulated publishing dispatch records ordered by most recent.
    """
    query = select(PublishingRecord).order_by(desc(PublishingRecord.created_at))
    return db.execute(query).scalars().all()

@router.get("/{record_id}", response_model=PublishingRecordResponse)
def get_publishing_record(record_id: int, db: Session = Depends(get_db)):
    """
    Retrieve details of a specific simulated dispatch record.
    """
    record = db.get(PublishingRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Publishing record not found")
    return record

@router.post("", response_model=PublishingRecordResponse, status_code=201)
def schedule_publishing(item_in: PublishingRecordCreate, db: Session = Depends(get_db)):
    """
    Human-controlled publishing dispatch preview.
    STRICT GOVERNANCE RULES (single source of truth: app.services.hitl_service.is_publishable):
    1. Only human-approved (status == 'approved') content can reach simulated dispatch.
    2. AND compliance_status must be exactly 'passed' — pending, human_review, rejected,
       and compliance-flagged/failed content are all rejected, regardless of score.
    3. Persists dispatch record in SQLite/Postgres with status 'scheduled'.
    """
    content = db.get(ContentQueue, item_in.content_id)
    if not content:
        raise HTTPException(status_code=404, detail=f"Content item #{item_in.content_id} not found")

    if not is_publishable(content.status, content.compliance_status):
        raise HTTPException(
            status_code=400,
            detail=(
                f"Cannot schedule content unless status='approved' AND compliance_status='passed'. "
                f"Current: status='{content.status}', compliance_status='{content.compliance_status}' "
                f"(score={content.compliance_score})."
            )
        )

    # Create dispatch record
    record = PublishingRecord(
        content_id=item_in.content_id,
        platform=item_in.platform or content.platform,
        status="scheduled",
        scheduled_at=item_in.scheduled_at or datetime.now(timezone.utc),
        engagement_metrics="{\"dispatch_mode\": \"simulated_preview\", \"external_api\": \"none\"}",
        created_at=datetime.now(timezone.utc)
    )
    db.add(record)

    # Update content queue item status
    content.status = "scheduled"
    
    db.commit()
    db.refresh(record)
    return record

@router.patch("/{record_id}/cancel", response_model=PublishingRecordResponse)
def cancel_scheduled_publishing(record_id: int, db: Session = Depends(get_db)):
    """
    Cancel a scheduled dispatch and revert the content item status to 'approved'.
    """
    record = db.get(PublishingRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Publishing record not found")
    
    record.status = "cancelled"
    
    content = db.get(ContentQueue, record.content_id)
    if content and content.status == "scheduled":
        content.status = "approved"

    db.commit()
    db.refresh(record)
    return record
