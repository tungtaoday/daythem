from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./daythem.db"
    SECRET_KEY: str = "daythem-dev-secret"
    JWT_EXPIRE_DAYS: int = 30
    OTP_DEV_MODE: bool = True

    model_config = {"env_file": ".env"}


settings = Settings()
