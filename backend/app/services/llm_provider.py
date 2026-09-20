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
    Powered by Groq API when GROQ_API_KEY is configured,
    and falls back to deterministic mock/demo responses when running in dev/demo mode
    without external API credentials.
    """

    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        self.api_key = api_key or settings.GROQ_API_KEY
        self.model_name = model_name or settings.GROQ_MODEL
        self.provider_name = "Groq"
        self._groq_client = None
        self._initialize_client()

    def _initialize_client(self):
        if self.api_key:
            try:
                from groq import Groq
                self._groq_client = Groq(api_key=self.api_key)
                logger.info(f"Groq client initialized with model: {self.model_name}")
            except Exception as e:
                logger.warning(f"Failed to initialize Groq client: {e}. Falling back to mock mode.")
                self._groq_client = None
        else:
            logger.info("No GROQ_API_KEY provided; operating in demo/mock provider mode.")

    @property
    def is_live(self) -> bool:
        return self._groq_client is not None

    def generate_text(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        """
        Generate plain text response via Groq chat completions.
        """
        if self.is_live:
            try:
                messages = []
                if system_instruction:
                    messages.append({"role": "system", "content": system_instruction})
                messages.append({"role": "user", "content": prompt})

                completion = self._groq_client.chat.completions.create(
                    model=self.model_name,
                    messages=messages,
                    temperature=0.7,
                )
                return completion.choices[0].message.content or ""
            except Exception as e:
                logger.error(f"Groq API call failed: {e}. Fallback triggered.")

        # Fallback / Demo mode output
        return f"[Demo Mode Output for prompt: {prompt[:80]}...]"

    def generate_structured(self, prompt: str, schema: Type[BaseModel], system_instruction: Optional[str] = None) -> BaseModel:
        """
        Generate structured output adhering to a Pydantic schema using Groq JSON mode.
        """
        if self.is_live:
            try:
                schema_json = json.dumps(schema.model_json_schema(), indent=2)
                system_content = (
                    f"{system_instruction or 'You are an enterprise InsurTech AI marketing assistant.'}\n\n"
                    f"You MUST respond ONLY with valid JSON conforming to this JSON schema:\n{schema_json}"
                )
                messages = [
                    {"role": "system", "content": system_content},
                    {"role": "user", "content": prompt}
                ]

                completion = self._groq_client.chat.completions.create(
                    model=self.model_name,
                    messages=messages,
                    temperature=0.3,
                    response_format={"type": "json_object"}
                )

                raw_text = completion.choices[0].message.content or "{}"
                clean_json = raw_text.strip()
                if clean_json.startswith("```json"):
                    clean_json = clean_json[7:]
                if clean_json.startswith("```"):
                    clean_json = clean_json[3:]
                if clean_json.endswith("```"):
                    clean_json = clean_json[:-3]
                clean_json = clean_json.strip()

                data = json.loads(clean_json)
                return schema.model_validate(data)
            except Exception as e:
                logger.error(f"Failed structured Groq generation: {e}. Falling back to schema mock.")

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
