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
        
        self.log_event("evaluate_compliance", {"brand": brand, "content_length": len(content_text)})

        prompt = (
            f"Analyze this insurance marketing copy for {brand} for regulatory compliance:\n\n"
            f"Content:\n\"\"\"{content_text}\"\"\"\n\n"
            f"Regulations checklist:\n"
            f"1. No guaranteed payouts or unconditional promises.\n"
            f"2. Mandatory disclaimer requirement (e.g. 'Terms and conditions apply').\n"
            f"3. Accurate representation of policy limits and exclusions.\n"
            f"4. Clear brand attribution and MAS/BNM insurance intermediary disclosures.\n"
            f"Return compliance result with pass/fail, score 0-100, violations, suggestions, and disclaimers."
        )
        system_prompt = (
            "You are a Chief Compliance Officer for a licensed Asian insurance broker. "
            "You strictly enforce insurance advertising standards."
        )

        result: ComplianceResult = llm_provider.generate_structured(
            prompt=prompt,
            schema=ComplianceResult,
            system_instruction=system_prompt
        )

        return result.model_dump()
