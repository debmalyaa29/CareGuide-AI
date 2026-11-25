from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=("backend/.env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Server settings
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: str = "http://localhost:3000,https://localhost:3000,http://127.0.0.1:3000"

    # Google Gemini API
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-3-flash-preview"
    EMBEDDING_MODEL: str = "gemini-embedding-001"
    EMBEDDING_DIMENSION: int = 768

    # Firecrawl
    FIRECRAWL_API_KEY: Optional[str] = None

    # Supabase
    SUPABASE_URL: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    SUPABASE_DB_URL: Optional[str] = None

    # Memento Persistent Memory (Native Supabase PostgreSQL Adapter)
    MEMENTO_MEMORY_STORE: str = "postgres_supabase"
    MEMENTO_API_KEY: Optional[str] = None

    # Trusted Healthcare Domains Allowlist
    TRUSTED_DOMAINS: List[str] = [
        "who.int",
        "cdc.gov",
        "nhs.uk",
        "medlineplus.gov",
    ]

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
