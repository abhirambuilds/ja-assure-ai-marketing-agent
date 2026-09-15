from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from app.database.session import get_db
from app.models.entities import Lead
from app.schemas.dtos import LeadCreate, LeadResponse

router = APIRouter(prefix="/leads", tags=["Lead Generation"])

@router.get("", response_model=List[LeadResponse])
def list_leads(
    industry: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = select(Lead)
    if industry:
        query = query.where(Lead.industry == industry)
    if status:
        query = query.where(Lead.status == status)
    query = query.order_by(desc(Lead.fit_score)).limit(limit)
    return db.execute(query).scalars().all()

@router.post("", response_model=LeadResponse, status_code=201)
def create_lead(lead_in: LeadCreate, db: Session = Depends(get_db)):
    lead = Lead(**lead_in.model_dump())
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead

@router.patch("/{lead_id}/status", response_model=LeadResponse)
def update_lead_status(lead_id: int, status: str, db: Session = Depends(get_db)):
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    lead.status = status
    db.commit()
    db.refresh(lead)
    return lead
