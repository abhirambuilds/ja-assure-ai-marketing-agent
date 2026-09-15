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
        brief_data = inputs.get("brief", {})
        brief = ContentBrief.model_validate(brief_data)
        
        self.log_event("generate_content", {"brand": brief.brand, "platform": brief.platform, "topic": brief.topic})

        # Generate variations A and B
        variations: List[Dict[str, Any]] = []
        for label in ["A", "B"][:brief.variations_count]:
            prompt = (
                f"Draft variation {label} for brand '{brief.brand}' on platform '{brief.platform}' in '{brief.language}'. "
                f"Topic: {brief.topic}. Key benefits: {', '.join(brief.key_benefits)}. "
                f"Lessons learned from past human reviews: {', '.join(brief.context_lessons) if brief.context_lessons else 'None'}."
            )
            system_prompt = (
                f"You are the senior marketing copywriter for {brief.brand}. Adhere strictly to brand voice, "
                f"high-converting hooks, and regional regulatory caution."
            )
            var: GeneratedVariation = llm_provider.generate_structured(
                prompt=prompt,
                schema=GeneratedVariation,
                system_instruction=system_prompt
            )
            variations.append(var.model_dump())

        return {"brand": brief.brand, "platform": brief.platform, "variations": variations}
