import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    APP_NAME: str = "JA Assure AI Marketing Agent"
    API_V1_STR: str = "/api/v1"
    
    # CORS Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    # Database URL (Supabase PostgreSQL)
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/postgres"

    # LLM Settings (Groq API)
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # Logging
    LOG_LEVEL: str = "INFO"

    # Brands Supported by JA Assure
    DEFAULT_BRANDS: List[str] = ["jade", "doctorshield", "jaguartransit"]

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
