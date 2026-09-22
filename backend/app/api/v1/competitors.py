from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.entities import Competitor
from app.schemas.dtos import (
    CompetitorCreate,
    CompetitorResponse,
    CompetitorSnapshotResponse,
    CompetitorChangeResponse,
    CompetitorBattlecardResponse,
    CompetitorScanResponse,
    CompetitiveHookResponse,
)
from app.services.competitor_service import competitor_service
from app.services.research_service import research_service

router = APIRouter(prefix="/competitors", tags=["Competitor Intelligence & Radar"])


class CompetitorAnalyzeRequest(BaseModel):
    url: str
    brand: Optional[str] = "jade"


# -------------------------------------------------------------------------
# Static collection endpoints (placed before /{comp_id} to prevent shadowing)
# -------------------------------------------------------------------------

@router.get("", response_model=List[CompetitorResponse])
def list_competitors(
    brand: Optional[str] = Query(None, description="Filter by brand (jade, doctorshield, jaguartransit)"),
    category: Optional[str] = Query(None, description="Filter by category/niche (jewellery, transit, medical)"),
    niche: Optional[str] = Query(None, description="Alias for category"),
    threat_level: Optional[str] = Query(None, description="Filter by threat level (high, medium, low)"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Lists competitors with optional filters for brand, niche, and threat level."""
    return competitor_service.list_competitors(
        db,
        brand=brand,
        category=category,
        niche=niche,
        threat_level=threat_level,
        is_active=is_active,
        limit=limit,
    )


@router.post("", response_model=CompetitorResponse, status_code=201)
def create_competitor(comp_in: CompetitorCreate, db: Session = Depends(get_db)):
    """Registers a new competitor and automatically generates initial battlecard."""
    try:
        comp = competitor_service.create_competitor(db, comp_in.model_dump())
        return comp
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/changes", response_model=List[CompetitorChangeResponse])
def list_all_changes(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Returns detected competitor changes across the entire radar feed."""
    return competitor_service.list_changes(db, competitor_id=None, limit=limit)


@router.post("/scan-all")
def scan_all_competitors(
    niche: Optional[str] = Query(None, description="Filter scan by niche (jewellery, transit, medical)"),
    db: Session = Depends(get_db),
):
    """Triggers batch website scan across active competitors."""
    results = competitor_service.scan_all_competitors(db, niche=niche)
    return {
        "status": "success",
        "scanned_count": len(results),
        "results": results,
    }


@router.get("/hook", response_model=CompetitiveHookResponse)
def get_competitive_hook(
    brand: Optional[str] = Query(None, description="Brand name (jade, doctorshield, jaguartransit)"),
    industry: Optional[str] = Query(None, description="Industry or niche term"),
    db: Session = Depends(get_db),
):
    """
    Lead Discovery Cross-Link: Returns tactical competitive battlecard hooks
    and objection handling for lead outreach generation.
    """
    hook = competitor_service.get_competitive_hook_for_lead(db, brand=brand, industry=industry)
    if not hook:
        raise HTTPException(status_code=404, detail="No competitive hook available for specified brand/industry")
    return hook


@router.post("/analyze-url", response_model=CompetitorResponse)
async def analyze_competitor_url(req: CompetitorAnalyzeRequest, db: Session = Depends(get_db)):
    """
    Supplied URL flow:
    1. Scrapes the page safely
    2. Analyzes messaging, claims, offerings
    3. Extracts strategic counter-positioning whitespace
    4. Upserts competitor record
    5. Returns the updated competitor entity
    """
    scraped = await research_service.scrape_url(req.url)
    if scraped.get("status") != "success":
        raise HTTPException(
            status_code=400,
            detail=f"Failed to scrape URL: {scraped.get('summary', 'Invalid or unreachable website')}",
        )

    finding = await research_service.analyze_scraped_content(scraped, brand=req.brand)
    research_service._save_or_update_competitor(req.brand or "jade", req.url, finding)

    comp = db.query(Competitor).filter(Competitor.url == req.url).first()
    if not comp:
        raise HTTPException(status_code=500, detail="Failed to retrieve saved competitor record")
    return comp


@router.post("/scrape", response_model=CompetitorResponse)
async def scrape_competitor_alias(req: CompetitorAnalyzeRequest, db: Session = Depends(get_db)):
    """Alias for /analyze-url for frontend client compatibility."""
    return await analyze_competitor_url(req, db)


# -------------------------------------------------------------------------
# Dynamic entity endpoints (by ID)
# -------------------------------------------------------------------------

@router.get("/{comp_id}", response_model=CompetitorResponse)
def get_competitor(comp_id: int, db: Session = Depends(get_db)):
    """Retrieves a single competitor by ID."""
    comp = competitor_service.get_competitor(db, comp_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Competitor record not found")
    return comp


@router.post("/{comp_id}/scan", response_model=CompetitorScanResponse)
def scan_single_competitor(comp_id: int, db: Session = Depends(get_db)):
    """
    Triggers live website scan, SHA-256 snapshot capture,
    diff/change detection, and sales battlecard refresh for a competitor.
    """
    try:
        result = competitor_service.scan_competitor(db, comp_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Competitor scan failed: {str(e)}")


@router.get("/{comp_id}/snapshots", response_model=List[CompetitorSnapshotResponse])
def get_competitor_snapshots(
    comp_id: int,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Retrieves historical snapshots for a competitor."""
    comp = competitor_service.get_competitor(db, comp_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Competitor record not found")
    return competitor_service.list_snapshots(db, comp_id, limit=limit)


@router.get("/{comp_id}/changes", response_model=List[CompetitorChangeResponse])
def get_competitor_changes(
    comp_id: int,
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Retrieves detected changes specifically for a competitor."""
    comp = competitor_service.get_competitor(db, comp_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Competitor record not found")
    return competitor_service.list_changes(db, comp_id, limit=limit)


@router.get("/{comp_id}/battlecard", response_model=CompetitorBattlecardResponse)
def get_competitor_battlecard(comp_id: int, db: Session = Depends(get_db)):
    """Retrieves head-to-head sales enablement battlecard for a competitor."""
    try:
        return competitor_service.get_battlecard(db, comp_id, force_regenerate=False)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{comp_id}/battlecard", response_model=CompetitorBattlecardResponse)
def regenerate_competitor_battlecard(comp_id: int, db: Session = Depends(get_db)):
    """Forces regeneration of sales battlecard for a competitor."""
    try:
        return competitor_service.get_battlecard(db, comp_id, force_regenerate=True)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
