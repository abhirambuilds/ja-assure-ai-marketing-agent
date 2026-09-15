from typing import Any, Dict
from app.agents.base import BaseAgent
from app.schemas.agent_contracts import LeadProspect
from app.services.llm_provider import llm_provider

class LeadAgent(BaseAgent):
    """
    Agent responsible for finding, enriching, scoring B2B insurance prospects and drafting personalized outreach.
    """
    def __init__(self):
        super().__init__(name="lead_agent")

    async def run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        brand = inputs.get("brand")
        industry = inputs.get("industry")

        self.log_event("qualify_leads", {"brand": brand, "industry": industry})

        from app.services.lead_service import lead_service
        prospects = await lead_service.discover_and_score_leads(brand=brand, industry=industry)

        return {
            "count": len(prospects),
            "prospects": [p.model_dump() for p in prospects]
        }
