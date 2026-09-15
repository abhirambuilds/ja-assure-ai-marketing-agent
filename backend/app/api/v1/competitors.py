from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from app.database.session import get_db
from app.models.entities import Competitor
from app.schemas.dtos import CompetitorCreate, CompetitorResponse

router = APIRouter(prefix="/competitors", tags=["Competitor Intelligence"])

@router.get("", response_model=List[CompetitorResponse])
def list_competitors(
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = select(Competitor)
    if category:
        query = query.where(Competitor.category == category)
    query = query.order_by(desc(Competitor.collected_at)).limit(limit)
    return db.execute(query).scalars().all()

@router.post("", response_model=CompetitorResponse, status_code=201)
def create_competitor(comp_in: CompetitorCreate, db: Session = Depends(get_db)):
    comp = Competitor(**comp_in.model_dump())
    db.add(comp)
    db.commit()
    db.refresh(comp)
    return comp
