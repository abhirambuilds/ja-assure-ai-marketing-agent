from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from app.database.session import get_db
from app.models.entities import Feedback
from app.schemas.dtos import FeedbackCreate, FeedbackResponse

router = APIRouter(prefix="/feedback", tags=["Human Feedback"])

@router.get("", response_model=List[FeedbackResponse])
def list_feedback(
    reason_tag: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = select(Feedback)
    if reason_tag:
        query = query.where(Feedback.reason_tag == reason_tag)
    query = query.order_by(desc(Feedback.created_at)).limit(limit)
    return db.execute(query).scalars().all()

@router.post("", response_model=FeedbackResponse, status_code=201)
def record_feedback(item_in: FeedbackCreate, db: Session = Depends(get_db)):
    feedback = Feedback(**item_in.model_dump())
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback
