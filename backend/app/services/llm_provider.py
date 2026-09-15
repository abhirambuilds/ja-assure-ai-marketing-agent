import os
import json
import logging
from typing import Optional, Dict, Any, Type
from pydantic import BaseModel
from app.config import settings

logger = logging.getLogger("ja_assure.llm")

class LLMProvider:
    """
    Unified LLM provider interface.
    Supports Google Gemini API when GEMINI_API_KEY is configured,
    and falls back to deterministic mock/demo responses when running in dev/demo mode
    without external API credentials.
    """

    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model_name = model_name or settings.GEMINI_MODEL
        self._gemini_client = None
        self._initialize_client()

    def _initialize_client(self):
        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self._gemini_client = genai.GenerativeModel(self.model_name)
                logger.info(f"Gemini client initialized with model: {self.model_name}")
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini client: {e}. Falling back to mock mode.")
                self._gemini_client = None
        else:
            logger.info("No GEMINI_API_KEY provided; operating in demo/mock provider mode.")

    @property
    def is_live(self) -> bool:
        return self._gemini_client is not None

    def generate_text(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        """
        Generate plain text response.
        """
        if self.is_live:
            try:
                full_prompt = f"System Instruction: {system_instruction}\n\nUser: {prompt}" if system_instruction else prompt
                response = self._gemini_client.generate_content(full_prompt)
                return response.text
            except Exception as e:
                logger.error(f"Gemini API call failed: {e}. Fallback triggered.")
        
        # Fallback / Demo mode output
        return f"[Demo Mode Output for prompt: {prompt[:80]}...]"

    def generate_structured(self, prompt: str, schema: Type[BaseModel], system_instruction: Optional[str] = None) -> BaseModel:
        """
        Generate structured output adhering to a Pydantic schema.
        """
        if self.is_live:
            try:
                schema_json = json.dumps(schema.model_json_schema(), indent=2)
                structured_prompt = (
                    f"{system_instruction or ''}\n\n"
                    f"Respond ONLY with valid JSON conforming to this schema:\n{schema_json}\n\n"
                    f"Task:\n{prompt}\n\n"
                    f"JSON Response:"
                )
                response = self._gemini_client.generate_content(structured_prompt)
                raw_text = response.text.strip()
                if raw_text.startswith("```json"):
                    raw_text = raw_text[7:]
                if raw_text.startswith("```"):
                    raw_text = raw_text[3:]
                if raw_text.endswith("```"):
                    raw_text = raw_text[:-3]
                raw_text = raw_text.strip()
                data = json.loads(raw_text)
                return schema.model_validate(data)
            except Exception as e:
                logger.error(f"Failed structured Gemini generation: {e}. Falling back to schema mock.")

        # In mock / demo mode, return default construct if available or basic mock
        return self._generate_fallback_mock(schema, prompt)

    def _generate_fallback_mock(self, schema: Type[BaseModel], prompt: str) -> BaseModel:
        """
        Produce a safe dummy object matching the Pydantic schema for seamless offline testing.
        """
        fields = schema.model_fields
        dummy_data: Dict[str, Any] = {}
        for name, field in fields.items():
            annotation = str(field.annotation).lower()
            if "list" in annotation or "sequence" in annotation:
                dummy_data[name] = ["Demo item 1"]
            elif "dict" in annotation:
                dummy_data[name] = {}
            elif "bool" in annotation:
                dummy_data[name] = True
            elif "int" in annotation:
                dummy_data[name] = 1
            elif "float" in annotation:
                dummy_data[name] = 95.0
            elif "str" in annotation:
                dummy_data[name] = f"Demo generated {name} for query"
            else:
                dummy_data[name] = None
        
        try:
            return schema.model_validate(dummy_data)
        except Exception:
            return schema.model_construct(**dummy_data)

# Singleton provider instance
llm_provider = LLMProvider()
