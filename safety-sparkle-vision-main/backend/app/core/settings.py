from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    project_name: str = "Construction Site Digital Twin Backend"
    environment: str = "dev"
    api_v1_prefix: str = ""

    db_host: str = "postgres"
    db_port: int = 5432
    db_user: str = "postgres"
    db_password: str = "postgres"
    db_name: str = "construction_twin"

    redis_url: str = "redis://redis:6379/0"

    simulation_interval_seconds: float = 1.0
    simulation_channel: str = "simulation:updates"

    risk_high_threshold: float = 75.0
    risk_medium_threshold: float = 40.0

    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    rate_limit_default: str = "120/minute"

    secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 480
    refresh_token_expire_days: int = 14

    auto_start_simulation: bool = True
    default_admin_email: str = "admin@site.local"
    default_admin_password: str = "admin12345"

    auto_create_tables: bool = True
    auto_seed_data: bool = True
    enforce_migrations: bool = False

    @property
    def sqlalchemy_database_uri(self) -> str:
        return (
            f"postgresql+asyncpg://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @field_validator("environment")
    @classmethod
    def validate_environment(cls, value: str) -> str:
        allowed = {"dev", "staging", "prod", "test"}
        if value not in allowed:
            raise ValueError(f"environment must be one of: {', '.join(sorted(allowed))}")
        return value

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
