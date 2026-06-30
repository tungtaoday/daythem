"""Lightweight in-memory rate limiter (per single instance).

Good enough to stop brute-force / SMS-bomb on auth endpoints for a single-process
deployment. For multi-instance, back this with Redis.
"""
import time
from collections import defaultdict, deque
from fastapi import HTTPException, Request

# key -> deque[timestamps]
_HITS: dict[str, deque] = defaultdict(deque)


def _client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def rate_limit(bucket: str, key: str, *, limit: int, window_seconds: int) -> None:
    """Raise 429 if `key` exceeded `limit` hits within `window_seconds`."""
    now = time.monotonic()
    dq = _HITS[f"{bucket}:{key}"]
    cutoff = now - window_seconds
    while dq and dq[0] < cutoff:
        dq.popleft()
    if len(dq) >= limit:
        raise HTTPException(
            status_code=429,
            detail="Bạn thử quá nhiều lần. Vui lòng đợi một lát rồi thử lại.",
        )
    dq.append(now)


def make_limiter(bucket: str, *, limit: int, window_seconds: int):
    """FastAPI dependency factory: rate-limits by client IP."""
    def _dep(request: Request) -> None:
        rate_limit(bucket, _client_ip(request), limit=limit, window_seconds=window_seconds)
    return _dep


def reset() -> None:
    """Clear all counters (used by tests)."""
    _HITS.clear()
