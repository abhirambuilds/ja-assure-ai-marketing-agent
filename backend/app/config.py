import os
from typing import List, Annotated
from pydantic_settings import BaseSettings, SettingsConfigDict, NoDecode
from pydantic import field_validator

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    APP_NAME: str = "JA Assure AI Marketing Agent"
    API_V1_STR: str = "/api/v1"

    # CORS Origins
    # NoDecode: pydantic-settings otherwise tries to JSON-decode List[str] env values
    # before the field_validator below ever runs, which crashes on a plain
    # comma-separated .env value (e.g. "http://a,http://b") -- exactly the format
    # this codebase's .env.example files use. NoDecode defers to the validator instead.
    CORS_ORIGINS: Annotated[List[str], NoDecode] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    # Database URL (Supabase PostgreSQL)
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/postgres"

    # Supabase Project Credentials
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # LLM Settings (Groq API)
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "groq/compound"

    # Image Generation (OpenAI Images API) -- optional. Leave empty to use the
    # clearly-labeled branded fallback card instead of real AI-generated visuals.
    OPENAI_API_KEY: str = ""

    # Image Generation (Hugging Face Inference Providers) -- optional second real
    # AI image vendor. Leave HF_TOKEN empty to keep this provider unavailable.
    HF_TOKEN: str = ""
    HF_IMAGE_MODEL: str = "black-forest-labs/FLUX.1-dev"

    # Which image provider video_generation_service should use for scene visuals:
    # "openai" (default) | "huggingface" | "branded_fallback" (explicit, no API call)
    IMAGE_PROVIDER: str = "openai"

    # Logging
    LOG_LEVEL: str = "INFO"

    # Brands Supported by JA Assure
    DEFAULT_BRANDS: Annotated[List[str], NoDecode] = ["jade", "doctorshield", "jaguartransit"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, tuple)):
            return list(v)
        return v

    @field_validator("DEFAULT_BRANDS", mode="before")
    @classmethod
    def assemble_brands(cls, v):
        if isinstance(v, str):
            return [i.strip().lower() for i in v.split(",") if i.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
