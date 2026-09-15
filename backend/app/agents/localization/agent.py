from typing import Any, Dict
from app.agents.base import BaseAgent
from app.services.llm_provider import llm_provider

class LocalizationAgent(BaseAgent):
    """
    Agent responsible for translating and culturally adapting insurance marketing content
    into target Southeast Asian languages (English, Malay, Indonesian, Thai, Chinese).
    """
    def __init__(self):
        super().__init__(name="localization_agent")

    async def run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        text = inputs.get("text", "")
        target_lang = inputs.get("target_lang", "ms")
        brand = inputs.get("brand", "jade")
        source_lang = inputs.get("source_lang", "en")

        self.log_event("localize_content", {"target_lang": target_lang, "brand": brand})

        from app.services.localization_service import localization_service
        result = await localization_service.localize_content(
            text=text,
            target_lang=target_lang,
            brand=brand,
            source_lang=source_lang
        )

        return result.model_dump()
