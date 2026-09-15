from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from app.database.session import get_db
from app.models.entities import PublishingRecord
from app.schemas.dtos import PublishingRecordCreate, PublishingRecordResponse

router = APIRouter(prefix="/publishing", tags=["Publishing"])

@router.get("", response_model=List[PublishingRecordResponse])
def list_publishing_records(db: Session = Depends(get_db)):
    query = select(PublishingRecord).order_by(desc(PublishingRecord.created_at))
    return db.execute(query).scalars().all()

@router.post("", response_model=PublishingRecordResponse, status_code=201)
def schedule_publishing(item_in: PublishingRecordCreate, db: Session = Depends(get_db)):
    record = PublishingRecord(**item_in.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record
