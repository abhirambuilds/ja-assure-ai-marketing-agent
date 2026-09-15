from typing import Any, Dict, List
from app.agents.base import BaseAgent
from app.schemas.agent_contracts import ContentBrief, GeneratedVariation
from app.services.llm_provider import llm_provider

class ContentAgent(BaseAgent):
    """
    Agent responsible for drafting multi-channel, multi-format variations incorporating lessons learned.
    """
    def __init__(self):
        super().__init__(name="content_agent")

    async def run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        brief_data = inputs.get("brief", inputs)
        brief = ContentBrief.model_validate(brief_data)
        
        self.log_event("generate_content", {"brand": brief.brand, "platform": brief.platform, "topic": brief.topic})

        from app.services.content_service import content_service
        variations = await content_service.generate_variations(brief)

        return {
            "brand": brief.brand,
            "platform": brief.platform,
            "variations": [v.model_dump() for v in variations]
        }
