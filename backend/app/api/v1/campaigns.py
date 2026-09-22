from __future__ import annotations

import logging
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.dtos import (
    CampaignCreate,
    CampaignResponse,
)
from app.services.campaign_service import campaign_service

logger = logging.getLogger("app.api.v1.campaigns")
router = APIRouter()


@router.get("", response_model=List[CampaignResponse])
def list_campaigns_endpoint(
    db: Session = Depends(get_db),
):
    """List all marketing campaigns ordered by creation date."""
    return campaign_service.list_campaigns(db)


@router.post("", response_model=CampaignResponse)
def create_campaign_endpoint(
    payload: CampaignCreate,
    db: Session = Depends(get_db),
):
    """Create a new targeted B2B lead generation campaign."""
    try:
        camp = campaign_service.create_campaign(
            db=db,
            name=payload.name,
            brand=payload.brand,
            target_industry=payload.target_industry,
            market=payload.market,
            target_count=payload.target_count,
            minimum_score=payload.minimum_score,
            is_demo=payload.is_demo,
        )
        db.commit()
        db.refresh(camp)
        return camp
    except Exception as exc:
        db.rollback()
        logger.error("Error creating campaign: %s", exc)
        raise HTTPException(status_code=500, detail=f"Failed to create campaign: {str(exc)}")


@router.get("/{campaign_id}", response_model=CampaignResponse)
def get_campaign_endpoint(
    campaign_id: int,
    db: Session = Depends(get_db),
):
    """Retrieve details for a specific campaign."""
    camp = campaign_service.get_campaign(db, campaign_id)
    if not camp:
        raise HTTPException(status_code=404, detail=f"Campaign {campaign_id} not found")
    return camp


@router.post("/{campaign_id}/pause", response_model=CampaignResponse)
def pause_campaign_endpoint(
    campaign_id: int,
    db: Session = Depends(get_db),
):
    """Pause an active campaign."""
    try:
        camp = campaign_service.pause_campaign(db, campaign_id)
        db.commit()
        db.refresh(camp)
        return camp
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to pause campaign: {str(exc)}")


@router.post("/{campaign_id}/resume", response_model=CampaignResponse)
def resume_campaign_endpoint(
    campaign_id: int,
    db: Session = Depends(get_db),
):
    """Resume a paused campaign."""
    try:
        camp = campaign_service.resume_campaign(db, campaign_id)
        db.commit()
        db.refresh(camp)
        return camp
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to resume campaign: {str(exc)}")


@router.get("/{campaign_id}/metrics")
def get_campaign_metrics_endpoint(
    campaign_id: int,
    db: Session = Depends(get_db),
):
    """Retrieve aggregate performance and conversion metrics for a campaign."""
    try:
        return campaign_service.get_campaign_metrics(db, campaign_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        logger.error("Error fetching campaign metrics for #%d: %s", campaign_id, exc)
        raise HTTPException(status_code=500, detail=f"Failed to fetch campaign metrics: {str(exc)}")
