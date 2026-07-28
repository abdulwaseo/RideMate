import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    APP_NAME: str = "RideMate API"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # Google Maps Integration Placeholder
    GOOGLE_MAPS_API_KEY: str = "placeholder_key_for_future_backend_maps_integration"


    # Security settings
    SECRET_KEY: str  # Required via environment / .env — fails startup if not set
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database URLs
    DATABASE_URL: str  # Required via environment / .env — fails startup if not set

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def sanitize_database_url(cls, v: str) -> str:
        if not v or not isinstance(v, str) or not v.strip():
            raise ValueError("[CRITICAL CONFIG ERROR] DATABASE_URL environment variable is missing or empty. Please set a valid PostgreSQL connection string in the environment or .env file.")
        v = v.strip()
        if v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql://", 1)
        if not (v.startswith("postgresql://") or v.startswith("sqlite://")):
            raise ValueError(f"[CRITICAL CONFIG ERROR] Invalid DATABASE_URL scheme '{v}'. Connection string must start with 'postgresql://' or 'postgres://'.")
        return v

    # CORS origins resolver
    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "https://ride-mate-nine.vercel.app",
    ]
    CORS_ORIGIN_REGEX: str = r"https://ride-mate.*\.vercel\.app"

    @field_validator("CORS_ORIGINS")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://localhost:8000",
            "https://ride-mate-nine.vercel.app",
        ]

    # Redis settings
    REDIS_URL: str = "redis://localhost:6379/0"

    # WebSocket Real-Time settings
    WS_HEARTBEAT_INTERVAL: int = 30  # seconds
    WS_HEARTBEAT_TIMEOUT: int = 45  # seconds
    WS_MAX_CONNECTIONS_PER_USER: int = 5
    WS_RATE_LIMIT_MESSAGES_PER_MIN: int = 120

    # Logging & Upload folders
    LOG_LEVEL: str = "INFO"
    UPLOAD_DIRECTORY: str = "uploads"


try:
    settings = Settings()
except Exception as exc:
    import sys
    print(f"\n❌ [DATABASE_URL / CONFIG ERROR] App startup failed because required configuration settings are missing or invalid:\n{exc}\n", file=sys.stderr)
    raise SystemExit(1) from exc

