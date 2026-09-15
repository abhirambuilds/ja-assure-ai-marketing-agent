from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.schemas.agent_contracts import ComplianceResult
from app.services.compliance_service import compliance_service, COMPLIANCE_RULES

router = APIRouter(prefix="/compliance", tags=["Compliance Gate"])

class ComplianceCheckRequest(BaseModel):
    brand: str = "jade"
    content_text: str
    content_type: str = "post"

@router.post("/check", response_model=ComplianceResult)
async def check_compliance(req: ComplianceCheckRequest):
    """
    Run the mandatory insurance compliance gate on any marketing copy.
    Returns pass/fail status, regulatory violations, suggestions, and penalty score.
    """
    try:
        result = await compliance_service.evaluate_content(
            brand=req.brand,
            content_text=req.content_text,
            content_type=req.content_type
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Compliance check failed: {str(e)}")

@router.post("/rewrite")
async def rewrite_compliance(req: ComplianceCheckRequest):
    """
    Compliance Rewrite Workflow:
    Identifies regulatory violations, suggests compliant replacement copy,
    and audits the new copy.
    """
    try:
        rewrite_result = await compliance_service.rewrite_non_compliant_content(
            brand=req.brand,
            original_text=req.content_text
        )
        return rewrite_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Compliance rewrite failed: {str(e)}")

@router.get("/rules")
def list_compliance_rules():
    """
    List all regulatory compliance rules enforced by the gate.
    """
    return [
        {
            "id": r["id"],
            "name": r["name"],
            "severity": r["severity"],
            "penalty": r["penalty"],
            "explanation": r["explanation"],
            "suggested_fix": r["suggested_fix"]
        }
        for r in COMPLIANCE_RULES
    ]
