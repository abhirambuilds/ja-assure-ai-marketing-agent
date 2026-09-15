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
        concept = inputs.get("concept", "Jewellery burglary protection")
        format_type = inputs.get("format_type", "reel") # reel, carousel, video

        self.log_event("generate_media_brief", {"brand": brand, "format": format_type})

        prompt = (
            f"Generate a {format_type} storyboard and visual media prompt for {brand}.\n"
            f"Concept: {concept}\n"
            f"Provide scene-by-scene script (3 scenes), on-screen text, audio cue, and image generation prompt."
        )
        system_prompt = "You are a creative video director for short-form social media (Reels, TikTok, Shorts)."

        brief_text = llm_provider.generate_text(prompt, system_instruction=system_prompt)

        return {
            "brand": brand,
            "format_type": format_type,
            "storyboard": brief_text
        }
