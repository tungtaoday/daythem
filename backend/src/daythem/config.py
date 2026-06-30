from pydantic_settings import BaseSettings

DEFAULT_SECRET_KEY = "daythem-dev-secret"
# Substrings that mark a SECRET_KEY as a placeholder, not a real production secret.
_PLACEHOLDER_MARKERS = ("dev-secret", "change-in-prod", "changeme", "placeholder")


class Settings(BaseSettings):
    # "dev" (default) keeps test/local conveniences; "prod" enforces hard safety checks at boot.
    ENV: str = "dev"
    DATABASE_URL: str = "sqlite:///./daythem.db"
    SECRET_KEY: str = DEFAULT_SECRET_KEY
    JWT_EXPIRE_DAYS: int = 30
    # OTP dev mode: fixed code 123456 + code echoed in response. MUST be off in prod.
    OTP_DEV_MODE: bool = True
    # Comma-separated list of allowed CORS origins. "*" allows any (dev only).
    CORS_ORIGINS: str = "*"
    # Vietnam is UTC+7 with no DST.
    TZ_OFFSET_HOURS: int = 7
    # Annual tax thresholds (VND). Revenue ≤ threshold → exempt; ABOVE threshold →
    # whole revenue is taxed at TAX_RATE (Vietnamese hộ/cá nhân kinh doanh rule).
    TAX_THRESHOLD_2025: float = 100_000_000      # đến hết 2025 (Thông tư 40/2021)
    TAX_THRESHOLD_DEFAULT: float = 1_000_000_000  # 2026+ (Nghị định 141/2026/NĐ-CP: 1 tỷ/năm)
    TAX_RATE: float = 0.02
    # Owner-controlled in-app promo banner (edit this JSON file on the server to push content).
    PROMO_PATH: str = "promo.json"
    # Owner-controlled notification config (defaults/groups/contact policy) + marketing campaigns.
    NOTIFY_CONFIG_PATH: str = "notify_config.json"
    NOTIFY_CAMPAIGNS_PATH: str = "notify_campaigns.json"

    model_config = {"env_file": ".env"}

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def is_prod(self) -> bool:
        return self.ENV.lower() in ("prod", "production")

    @property
    def is_secret_key_weak(self) -> bool:
        """True if the signing key is a known placeholder or too short to be safe."""
        key = self.SECRET_KEY or ""
        if len(key) < 32:
            return True
        low = key.lower()
        return any(m in low for m in _PLACEHOLDER_MARKERS)

    def validate_for_prod(self) -> list[str]:
        """Return a list of fatal misconfigurations when running in production."""
        problems: list[str] = []
        if not self.is_prod:
            return problems
        if self.is_secret_key_weak:
            problems.append("SECRET_KEY is a weak/placeholder value — set a strong random 32+ char secret.")
        if self.OTP_DEV_MODE:
            problems.append("OTP_DEV_MODE must be off in production (it fixes the OTP to 123456 and leaks it).")
        if self.DATABASE_URL.startswith("sqlite"):
            problems.append("DATABASE_URL is SQLite — use PostgreSQL in production.")
        if "*" in self.cors_origin_list:
            problems.append("CORS_ORIGINS must be an explicit allowlist in production, not '*'.")
        return problems


settings = Settings()
