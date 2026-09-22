import os
import json
import logging
from typing import Optional, Dict, Any, Type, List
from pydantic import BaseModel
from app.config import settings
from app.services.security.dns_resolver import install_resilient_dns

# Ensure DNS is resilient for Groq API calls
install_resilient_dns()

logger = logging.getLogger("ja_assure.llm")

CANDIDATE_MODELS = [
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-20b",
    "openai/gpt-oss-120b",
]

class LLMProvider:
    """
    Unified LLM provider interface.
    Powered by Groq API when GROQ_API_KEY is configured, with automatic model fallback
    across verified fast inference models (Qwen 3.8 27B, GPT-OSS 20B, GPT-OSS 120B).
    """

    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        self.api_key = api_key or settings.GROQ_API_KEY
        self.model_name = model_name or settings.GROQ_MODEL or "qwen/qwen3.8-27b"
        self.provider_name = "Groq"
        self._groq_client = None
        self._initialize_client()

    def _initialize_client(self):
        if self.api_key:
            try:
                from groq import Groq
                self._groq_client = Groq(api_key=self.api_key)
                logger.info(f"Groq client initialized with default model: {self.model_name}")
            except Exception as e:
                logger.warning(f"Failed to initialize Groq client: {e}. Falling back to mock mode.")
                self._groq_client = None
        else:
            logger.info("No GROQ_API_KEY provided; operating in demo/mock provider mode.")

    @property
    def is_live(self) -> bool:
        if settings.ENVIRONMENT == "test":
            return False
        return self._groq_client is not None

    def _get_model_candidates(self) -> List[str]:
        models = [self.model_name]
        for m in CANDIDATE_MODELS:
            if m not in models:
                models.append(m)
        return models

    def generate_text(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        """
        Generate plain text response via Groq chat completions with model fallback.
        """
        if self.is_live:
            messages = []
            if system_instruction:
                messages.append({"role": "system", "content": system_instruction})
            messages.append({"role": "user", "content": prompt})

            candidates = self._get_model_candidates()
            for model_candidate in candidates:
                try:
                    completion = self._groq_client.chat.completions.create(
                        model=model_candidate,
                        messages=messages,
                        temperature=0.7,
                        max_completion_tokens=2048
                    )
                    content = completion.choices[0].message.content or ""
                    if content:
                        self.model_name = model_candidate
                        return content
                except Exception as e:
                    err_str = str(e)
                    if "429" in err_str or "404" in err_str or "model_not_found" in err_str or "rate_limit" in err_str:
                        logger.warning(f"Groq model {model_candidate} unavailable ({err_str[:80]}). Trying next candidate...")
                        continue
                    logger.error(f"Groq API call error on {model_candidate}: {e}")
                    break

        # Fallback / Demo mode output
        return f"[Demo Mode Output for prompt: {prompt[:80]}...]"

    def generate_structured(self, prompt: str, schema: Type[BaseModel], system_instruction: Optional[str] = None) -> BaseModel:
        """
        Generate structured output adhering to a Pydantic schema using Groq JSON mode with model fallback.
        """
        if self.is_live:
            schema_json = json.dumps(schema.model_json_schema(), indent=2)
            system_content = (
                f"{system_instruction or 'You are an enterprise InsurTech AI marketing assistant.'}\n\n"
                f"You MUST respond ONLY with valid JSON conforming to this JSON schema:\n{schema_json}"
            )
            messages = [
                {"role": "system", "content": system_content},
                {"role": "user", "content": prompt}
            ]

            candidates = self._get_model_candidates()
            for model_candidate in candidates:
                raw_text = None
                # Attempt 1: Groq server-side json_object mode
                try:
                    completion = self._groq_client.chat.completions.create(
                        model=model_candidate,
                        messages=messages,
                        temperature=0.3,
                        response_format={"type": "json_object"},
                        max_completion_tokens=2048
                    )
                    raw_text = completion.choices[0].message.content or "{}"
                except Exception as e:
                    err_str = str(e)
                    if "429" in err_str or "rate_limit" in err_str:
                        logger.warning(f"Groq model {model_candidate} rate limited. Trying next candidate...")
                        continue
                    elif "404" in err_str or "model_not_found" in err_str:
                        logger.warning(f"Groq model {model_candidate} not found. Trying next candidate...")
                        continue
                    else:
                        # Attempt 2: Groq standard completion without json_object constraint
                        try:
                            completion = self._groq_client.chat.completions.create(
                                model=model_candidate,
                                messages=messages,
                                temperature=0.2,
                                max_completion_tokens=2048
                            )
                            raw_text = completion.choices[0].message.content or "{}"
                        except Exception as text_err:
                            logger.warning(f"Text completion fallback on {model_candidate} also failed: {text_err}")
                            continue

                if raw_text:
                    clean_json = raw_text.strip()
                    if clean_json.startswith("```json"):
                        clean_json = clean_json[7:]
                    if clean_json.startswith("```"):
                        clean_json = clean_json[3:]
                    if clean_json.endswith("```"):
                        clean_json = clean_json[:-3]
                    clean_json = clean_json.strip()

                    # Find outer { ... }
                    s_idx = clean_json.find("{")
                    e_idx = clean_json.rfind("}")
                    if s_idx != -1 and e_idx > s_idx:
                        clean_json = clean_json[s_idx : e_idx + 1]

                    try:
                        data = json.loads(clean_json)
                        validated = schema.model_validate(data)
                        self.model_name = model_candidate
                        return validated
                    except Exception as parse_err:
                        logger.warning(f"JSON validation failed for {model_candidate}: {parse_err}. Trying next candidate...")
                        continue

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
                if name == "variation_label":
                    dummy_data[name] = "B" if "variation: b" in prompt.lower() else "A"
                elif name == "content_text":
                    dummy_data[name] = "JA Assure tailored insurance advisory copy.\n\n*Terms, conditions, and underwriting limits apply.*"
                else:
                    dummy_data[name] = f"Demo generated {name} for query"
            else:
                dummy_data[name] = None

        try:
            return schema.model_validate(dummy_data)
        except Exception:
            return schema.model_construct(**dummy_data)

# Singleton provider instance
llm_provider = LLMProvider()
