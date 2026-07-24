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
    SECRET_KEY: str = "fallback_super_secret_key_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database URLs
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://ridemate_user:dtcc123@localhost:5432/ridemate_db")

    # CORS origins resolver
    CORS_ORIGINS: Union[str, List[str]] = ["*"]

    @field_validator("CORS_ORIGINS")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

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

settings = Settings()
