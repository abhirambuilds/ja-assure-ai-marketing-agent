from typing import Any, Dict
from app.agents.base import BaseAgent
from app.services.llm_provider import llm_provider

class MediaAgent(BaseAgent):
    """
    Agent responsible for generating video/reels storyboards, scene scripts, and visual design briefs.
    """
    def __init__(self):
        super().__init__(name="media_agent")

    async def run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        brand = inputs.get("brand", "jade")
        concept = inputs.get("concept", "High-value protection overview")
        target_duration = inputs.get("target_duration", 45)

        self.log_event("generate_media_script", {"brand": brand, "concept": concept})

        from app.services.media_service import media_service
        script = await media_service.generate_video_script(
            brand=brand,
            topic=concept,
            target_duration=target_duration
        )

        return script.model_dump()
