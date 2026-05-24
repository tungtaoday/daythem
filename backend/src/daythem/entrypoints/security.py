from datetime import datetime, timedelta, timezone
import jwt
from daythem.config import settings


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def create_token(teacher_id: str) -> str:
    payload = {
        "sub": teacher_id,
        "exp": _now() + timedelta(days=settings.JWT_EXPIRE_DAYS),
        "iat": _now(),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def decode_token(token: str) -> str:
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    return payload["sub"]
