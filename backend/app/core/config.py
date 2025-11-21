import os
from datetime import datetime
from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    ENVIRONMENT: str = Field("development", env="ENVIRONMENT")
    DB_PATH: str = Field("backend/data/hospital.db", env="DB_PATH")
    SECRET_KEY: str = Field("change-me", env="SECRET_KEY")
    FERNET_KEY: str = Field("generate-me", env="FERNET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(60, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(7, env="REFRESH_TOKEN_EXPIRE_DAYS")
    
    # SMTP Settings for MFA
    SMTP_HOST: str = Field("smtp.gmail.com", env="SMTP_HOST")
    SMTP_PORT: int = Field(587, env="SMTP_PORT")
    SMTP_USER: str = Field("", env="SMTP_USER")
    SMTP_PASSWORD: str = Field("", env="SMTP_PASSWORD")
    SMTP_FROM: str = Field("", env="SMTP_FROM")
    SMTP_USE_TLS: bool = Field(True, env="SMTP_USE_TLS")
    
    # MFA Settings
    MFA_CODE_EXPIRE_MINUTES: int = Field(5, env="MFA_CODE_EXPIRE_MINUTES")
    MFA_CODE_LENGTH: int = 6
    
    # Server metadata
    SERVER_START_TIME: datetime | None = None
    LAST_SYNC_TIME: datetime | None = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    project_root = Path(__file__).resolve().parents[3]
    db_path = Path(settings.DB_PATH)
    if not db_path.is_absolute():
        db_path = (project_root / db_path).resolve()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    settings.DB_PATH = str(db_path)
    print("=== LOADING SETTINGS ===")
    print("SECRET_KEY from env:", repr(os.getenv("SECRET_KEY")))
    print("========================")
    return settings


settings = get_settings()

