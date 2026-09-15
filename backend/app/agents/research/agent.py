from typing import Any, Dict, List
from app.agents.base import BaseAgent
from app.schemas.agent_contracts import ResearchInsight, CompetitorInsight
from app.services.llm_provider import llm_provider

class ResearchAgent(BaseAgent):
    """
    Agent responsible for market intelligence, competitor tracking, and finding content opportunities.
    """
    def __init__(self):
        super().__init__(name="research_agent")

    async def run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        brand = inputs.get("brand", "jade")
        topic = inputs.get("topic", "Jewellery Insurance Trends")
        
        self.log_event("start_research", {"brand": brand, "topic": topic})

        # Structured schema generation using LLM provider
        prompt = (
            f"Conduct marketing and competitor research for JA Assure brand '{brand}' on topic '{topic}'. "
            f"Identify market context, target audience, pain points, and competitor angles."
        )
        system_prompt = (
            "You are an insurance industry research analyst specializing in Asian markets "
            "(Singapore, Malaysia, Thailand, Indonesia)."
        )

        insight: ResearchInsight = llm_provider.generate_structured(
            prompt=prompt,
            schema=ResearchInsight,
            system_instruction=system_prompt
        )

        return insight.model_dump()
