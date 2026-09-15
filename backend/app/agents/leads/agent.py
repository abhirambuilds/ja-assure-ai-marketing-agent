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
        company_info = inputs.get("company_info", "Private Clinic Network, Singapore")
        brand = inputs.get("brand", "doctorshield")

        self.log_event("qualify_lead", {"brand": brand, "company": company_info})

        prompt = (
            f"Qualify and score this prospect for JA Assure's {brand} insurance product.\n"
            f"Prospect info: {company_info}\n"
            f"Determine industry fit score (0-100), qualification rationale, and draft a high-touch personalized outreach message."
        )
        system_prompt = "You are a B2B insurance growth specialist focusing on medical practices and luxury retailers."

        lead_result: LeadProspect = llm_provider.generate_structured(
            prompt=prompt,
            schema=LeadProspect,
            system_instruction=system_prompt
        )

        return lead_result.model_dump()
