from __future__ import annotations

import logging
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.dtos import (
    OutreachApproveRequest,
    OutreachMessageResponse,
    OutreachSendRequest,
    OutreachSendResponse,
    ProviderStatusResponse,
    SimulateReplyRequest,
    SimulateReplyResponse,
    SuppressionCreate,
    SuppressionResponse,
)
from app.services.outreach_service import outreach_service

logger = logging.getLogger("app.api.v1.outreach")
router = APIRouter()


@router.post("/{lead_id}/generate", response_model=OutreachMessageResponse)
def generate_outreach_endpoint(
    lead_id: int,
    db: Session = Depends(get_db),
):
    """Generate a 3-touch compliant outreach cadence for a lead, entering HITL review."""
    try:
        msg = outreach_service.generate_outreach(db, lead_id)
        db.commit()
        db.refresh(msg)
        return msg
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        db.rollback()
        logger.error("Error generating outreach for lead %d: %s", lead_id, exc)
        raise HTTPException(status_code=500, detail=f"Failed to generate outreach: {str(exc)}")


@router.post("/{message_id}/approve", response_model=OutreachMessageResponse)
def approve_outreach_endpoint(
    message_id: int,
    payload: OutreachApproveRequest = OutreachApproveRequest(),
    db: Session = Depends(get_db),
):
    """Mandatory Human-In-The-Loop approval gate for outreach messages."""
    try:
        msg = outreach_service.approve_outreach(
            db,
            message_id,
            actor=payload.actor,
            notes=payload.notes,
        )
        db.commit()
        db.refresh(msg)
        return msg
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        db.rollback()
        logger.error("Error approving outreach %d: %s", message_id, exc)
        raise HTTPException(status_code=500, detail=f"Failed to approve outreach: {str(exc)}")


@router.post("/{message_id}/send", response_model=OutreachSendResponse)
def send_outreach_endpoint(
    message_id: int,
    payload: OutreachSendRequest = OutreachSendRequest(),
    db: Session = Depends(get_db),
):
    """Dispatch an outreach message subject to approval, suppression, and provider safety."""
    try:
        result = outreach_service.send_outreach(
            db,
            message_id,
            dry_run=payload.dry_run,
        )
        db.commit()
        return OutreachSendResponse(**result)
    except Exception as exc:
        db.rollback()
        logger.error("Error in send endpoint for outreach %d: %s", message_id, exc)
        raise HTTPException(status_code=500, detail=f"Send dispatch error: {str(exc)}")


@router.get("/{lead_id}/messages", response_model=List[OutreachMessageResponse])
def get_lead_messages_endpoint(
    lead_id: int,
    db: Session = Depends(get_db),
):
    """Retrieve full outreach and reply message history for a lead."""
    return outreach_service.get_lead_messages(db, lead_id)


@router.post("/replies/simulate", response_model=SimulateReplyResponse)
def simulate_reply_endpoint(
    payload: SimulateReplyRequest,
    db: Session = Depends(get_db),
):
    """Simulate an inbound reply from a lead and trigger automated intent actions."""
    try:
        res = outreach_service.simulate_inbound_reply(
            db=db,
            lead_id=payload.lead_id,
            message=payload.message,
            sender=payload.sender,
        )
        db.commit()
        return SimulateReplyResponse(**res)
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        db.rollback()
        logger.error("Error simulating reply for lead %d: %s", payload.lead_id, exc)
        raise HTTPException(status_code=500, detail=f"Reply simulation error: {str(exc)}")


@router.get("/suppression", response_model=List[SuppressionResponse])
def list_suppression_endpoint(
    db: Session = Depends(get_db),
):
    """List all suppressed / opted-out contacts."""
    return outreach_service.list_suppressed(db)


@router.post("/suppression", response_model=SuppressionResponse)
def add_suppression_endpoint(
    payload: SuppressionCreate,
    db: Session = Depends(get_db),
):
    """Manually add an email address to the suppression list."""
    try:
        entry = outreach_service.add_suppression(
            db=db,
            email=payload.email,
            reason=payload.reason,
            source=payload.source,
        )
        db.commit()
        db.refresh(entry)
        return entry
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to add suppression: {str(exc)}")


@router.delete("/suppression/{email}")
def remove_suppression_endpoint(
    email: str,
    db: Session = Depends(get_db),
):
    """Remove an email address from the suppression list (opt-in override)."""
    removed = outreach_service.remove_suppression(db, email)
    db.commit()
    return {"email": email, "removed": removed}


@router.get("/provider-status", response_model=ProviderStatusResponse)
def provider_status_endpoint():
    """Check current email provider status, mode, and safety armed flags."""
    return outreach_service.get_provider_status()
