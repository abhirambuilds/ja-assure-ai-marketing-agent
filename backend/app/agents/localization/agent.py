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

        self.log_event("localize_content", {"target_lang": target_lang, "brand": brand})

        prompt = (
            f"Localize this marketing content for JA Assure's {brand} brand into {target_lang}. "
            f"Maintain local regulatory standards, idioms, and high converting nuance.\n\n"
            f"Original text:\n{text}"
        )
        system_prompt = f"You are an insurance localization specialist for language code: {target_lang}."

        localized_text = llm_provider.generate_text(prompt, system_instruction=system_prompt)

        return {
            "target_lang": target_lang,
            "original_text": text,
            "localized_text": localized_text
        }
