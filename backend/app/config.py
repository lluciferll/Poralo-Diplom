import os
from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./arena.db"
    secret_key: str = "change-me-in-production-arena-pulse-2026"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7
    cors_origins: str = "http://localhost:5173,http://localhost:8080"
    data_dir: str = "/data"
    static_dir: str = "static"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()

if "sqlite" in settings.database_url and "/data" not in settings.database_url:
    data = Path(settings.data_dir)
    data.mkdir(parents=True, exist_ok=True)
    settings.database_url = f"sqlite:///{data / 'arena.db'}"
