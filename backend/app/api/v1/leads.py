from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from app.database.session import get_db
from app.models.entities import Lead
from app.schemas.dtos import LeadCreate, LeadResponse, LeadScoreResponse
from app.schemas.agent_contracts import LeadProspect
from app.services.lead_service import lead_service

router = APIRouter(prefix="/leads", tags=["Lead Generation & Scoring"])


class DiscoverLeadsRequest(BaseModel):
    brand: Optional[str] = None
    country: Optional[str] = None
    industry: Optional[str] = None
    target_audience: Optional[str] = None
    keywords: Optional[str] = None


class EnrichLeadRequest(BaseModel):
    source_url: Optional[str] = None


@router.get("", response_model=List[LeadResponse])
def list_leads(
    brand: Optional[str] = Query(None, description="Filter by recommended brand (jade, doctorshield, jaguartransit)"),
    country: Optional[str] = Query(None, description="Filter by country/jurisdiction"),
    industry: Optional[str] = Query(None, description="Filter by industry"),
    status: Optional[str] = Query(None, description="Filter by status (new, qualified, contacted, etc.)"),
    min_score: Optional[float] = Query(None, description="Filter by minimum fit score"),
    is_demo: Optional[bool] = Query(None, description="Filter demo vs live leads"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Retrieve discovered and qualified leads with optional multi-attribute filters."""
    query = select(Lead)
    if brand and brand != "all":
        query = query.where(Lead.recommended_brand.ilike(f"%{brand}%"))
    if country and country != "all":
        query = query.where(
            (Lead.country.ilike(f"%{country}%")) | (Lead.location.ilike(f"%{country}%"))
        )
    if industry:
        query = query.where(Lead.industry.ilike(f"%{industry}%"))
    if status and status != "all":
        query = query.where(Lead.status == status)
    if min_score is not None:
        query = query.where(Lead.fit_score >= min_score)
    if is_demo is not None:
        query = query.where(Lead.is_demo == is_demo)

    query = query.order_by(desc(Lead.fit_score)).limit(limit)
    return db.execute(query).scalars().all()


@router.post("/discover", response_model=List[LeadProspect])
async def discover_and_score_leads(req: DiscoverLeadsRequest):
    """Run the multi-source lead discovery, deduplication, and deterministic scoring pipeline.

    - Discovers candidates across Google Places (when configured), Market Intel (LLM), and Industry Registries
    - Normalizes company names, domains, and phone numbers
    - Performs 4-stage deduplication
    - Conducts SSRF-safe website inspection
    - Detects evidence-backed growth/expansion signals and formulates 'Why Now' opportunity explanation
    - Calculates deterministic 5-factor fit score (0-100)
    - Persists records to PostgreSQL/Supabase
    """
    try:
        prospects = await lead_service.discover_and_score_leads(
            brand=req.brand,
            country=req.country,
            industry=req.industry,
            target_audience=req.target_audience,
            keywords=req.keywords,
        )
        return prospects
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lead discovery failed: {str(e)}")


@router.get("/{lead_id}", response_model=LeadResponse)
def get_lead(lead_id: int, db: Session = Depends(get_db)):
    """Retrieve a specific lead by ID with full scoring breakdown and Why Now explanation."""
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail=f"Lead #{lead_id} not found")
    return lead


@router.post("/{lead_id}/enrich", response_model=LeadResponse)
async def enrich_lead(lead_id: int, req: EnrichLeadRequest = EnrichLeadRequest()):
    """Enrich an existing lead record with SSRF-safe website inspection, signal detection, and re-scoring."""
    try:
        enriched_lead = await lead_service.enrich_lead(lead_id=lead_id, source_url=req.source_url)
        return enriched_lead
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lead enrichment failed: {str(e)}")


@router.post("/{lead_id}/score", response_model=LeadScoreResponse)
def score_lead(lead_id: int):
    """Recalculate deterministic 5-factor underwriting score (0-100) and Why Now trigger for a lead."""
    try:
        res = lead_service.score_lead(lead_id=lead_id)
        return LeadScoreResponse(
            lead_id=res["lead_id"],
            score=res["score"],
            score_breakdown=res["score_breakdown"],
            why_now=res.get("why_now"),
        )
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lead scoring failed: {str(e)}")


@router.post("/{lead_id}/outreach")
def generate_lead_outreach(lead_id: int, db: Session = Depends(get_db)):
    """Generate personalized B2B outreach draft incorporating Why Now cues and brand persona."""
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail=f"Lead #{lead_id} not found")

    brand = lead.recommended_brand or "doctorshield"
    outreach = lead_service.generate_outreach(
        prospect_name=lead.name,
        company=lead.company,
        brand=brand,
        industry=lead.industry,
        location=lead.location,
        research_context=lead.why_now[:120] if lead.why_now else None,
    )
    lead.outreach_draft = outreach
    db.commit()
    db.refresh(lead)
    return {"lead_id": lead.id, "outreach_draft": outreach}


@router.post("", response_model=LeadResponse, status_code=201)
def create_lead(lead_in: LeadCreate, db: Session = Depends(get_db)):
    """Manually register a prospective lead."""
    lead = Lead(**lead_in.model_dump())
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


@router.patch("/{lead_id}/status", response_model=LeadResponse)
def update_lead_status(lead_id: int, status: str, db: Session = Depends(get_db)):
    """Update lead qualification or outreach status."""
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail=f"Lead #{lead_id} not found")
    lead.status = status
    db.commit()
    db.refresh(lead)
    return lead
