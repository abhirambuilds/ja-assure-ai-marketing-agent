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

    # Supabase Project Credentials
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # LLM Settings (Groq API)
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "groq/compound"

    # Optional Lead Discovery & Enrichment API Keys
    GOOGLE_MAPS_API_KEY: str = ""
    HUNTER_API_KEY: str = ""
    SEARCH_API_KEY: str = ""
    LEAD_AGENT_MODE: str = "demo"

    # Email & Outreach Automation Settings
    EMAIL_PROVIDER: str = "mock"
    REAL_EMAIL_ENABLED: bool = False
    REAL_PROVIDER_SEND: bool = False
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    GMAIL_CLIENT_ID: str = ""
    GMAIL_CLIENT_SECRET: str = ""
    GMAIL_REFRESH_TOKEN: str = ""

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
