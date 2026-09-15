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
        topic = inputs.get("topic", "Market Trends & Competitor Analysis")
        competitor_url = inputs.get("competitor_url")
        
        self.log_event("start_research", {"brand": brand, "topic": topic, "url": competitor_url})

        from app.services.research_service import research_service
        insight = await research_service.conduct_research(
            brand=brand,
            topic=topic,
            competitor_url=competitor_url
        )

        return insight.model_dump()
