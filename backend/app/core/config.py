"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings
from pydantic import model_validator


class Settings(BaseSettings):
    APP_NAME: str = "QLTB"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True
    DATABASE_URL: str = "sqlite:///./qltb.db"

    # JWT Auth
    SECRET_KEY: str = "change-me-in-production-use-a-random-256-bit-string"
    ACCESS_TOKEN_EXPIRE_HOURS: int = 8
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Default admin seed (used once on first startup)
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin123"
    ADMIN_HO_TEN: str = "Quản Trị Viên"

    class Config:
        env_file = ".env"
        extra = "ignore"

    @model_validator(mode="after")
    def validate_secret_key(self) -> 'Settings':
        if not self.DEBUG and self.SECRET_KEY == "change-me-in-production-use-a-random-256-bit-string":
            raise ValueError("SECRET_KEY must be changed in production!")
        return self


settings = Settings()
