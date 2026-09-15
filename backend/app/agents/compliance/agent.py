from typing import Any, Dict
from app.agents.base import BaseAgent
from app.schemas.agent_contracts import ComplianceResult
from app.services.llm_provider import llm_provider

class ComplianceAgent(BaseAgent):
    """
    Mandatory Insurance Compliance Gate agent.
    Checks marketing claims against insurance regulations (MAS/BNM/OIC), mandatory disclaimers,
    anti-misrepresentation, and policy wording correctness.
    """
    def __init__(self):
        super().__init__(name="compliance_agent")

    async def run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        brand = inputs.get("brand", "jade")
        content_text = inputs.get("content_text", "")
        content_type = inputs.get("content_type", "post")
        
        self.log_event("evaluate_compliance", {"brand": brand, "content_length": len(content_text)})

        from app.services.compliance_service import compliance_service
        result = await compliance_service.evaluate_content(
            brand=brand,
            content_text=content_text,
            content_type=content_type
        )

        return result.model_dump()
