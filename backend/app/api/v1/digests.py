from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.dtos import (
    ExecutiveDigestGenerateRequest,
    ExecutiveDigestResponse,
)
from app.services.digest_service import digest_service

router = APIRouter(prefix="/digests", tags=["Executive Digest"])


@router.get("", response_model=List[ExecutiveDigestResponse])
def list_digests(
    brand: Optional[str] = Query(None, description="Filter by brand (all, jade, doctorshield, jaguartransit)"),
    market: Optional[str] = Query(None, description="Filter by market (Singapore, Malaysia, Hong Kong, Thailand, Indonesia)"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Lists historical executive competitor and market intelligence digests."""
    return digest_service.list_digests(db, brand=brand, market=market, limit=limit)


@router.get("/latest", response_model=ExecutiveDigestResponse)
def get_latest_digest(
    brand: Optional[str] = Query(None, description="Filter by brand"),
    market: Optional[str] = Query(None, description="Filter by market"),
    db: Session = Depends(get_db),
):
    """Retrieves the most recent executive digest matching the criteria, generating one if none exist."""
    digest = digest_service.get_latest_digest(db, brand=brand, market=market)
    if not digest:
        # Auto-generate baseline digest if none exists
        digest = digest_service.generate_digest(
            db,
            brand=brand or "all",
            market=market or "Singapore",
            period_days=30,
        )
    return digest


@router.post("/generate", response_model=ExecutiveDigestResponse, status_code=status.HTTP_201_CREATED)
def generate_digest(
    req: ExecutiveDigestGenerateRequest,
    db: Session = Depends(get_db),
):
    """
    Generates a new executive competitor & market intelligence digest:
    Synthesizes observed competitor shifts, pricing anomalies, warranty gaps,
    and lead signals into an actionable 4-pillar strategic action blueprint.
    """
    try:
        digest = digest_service.generate_digest(
            db,
            brand=req.brand or "all",
            market=req.market or "Singapore",
            niche=req.niche or "all",
            period_days=req.period_days or 30,
        )
        return digest
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Executive digest generation failed: {str(exc)}",
        )


@router.get("/{digest_id}", response_model=ExecutiveDigestResponse)
def get_digest(
    digest_id: int,
    db: Session = Depends(get_db),
):
    """Retrieves a single executive digest by ID."""
    digest = digest_service.get_digest(db, digest_id)
    if not digest:
        raise HTTPException(status_code=404, detail=f"Executive Digest #{digest_id} not found")
    return digest
