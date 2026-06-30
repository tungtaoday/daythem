import json
import os
from fastapi import APIRouter
from daythem.config import settings

router = APIRouter(tags=["promo"])


@router.get("/promo")
def get_promo() -> dict:
    """Owner-controlled in-app banner. Reads PROMO_PATH (JSON) on each request so the
    owner can update the banner by editing the file on the server — no redeploy needed.

    Expected JSON shape (all optional except id/title when active):
      {"id": "tet-2026", "active": true, "title": "...", "body": "...",
       "cta_label": "Xem ngay", "cta_url": "https://...", "tone": "green"}
    Returns {"active": false} if the file is missing, unreadable, or marked inactive.
    """
    path = settings.PROMO_PATH
    if not os.path.isfile(path):
        return {"active": False}
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (OSError, json.JSONDecodeError):
        return {"active": False}
    if not isinstance(data, dict) or not data.get("active") or not data.get("title"):
        return {"active": False}
    return {
        "id": str(data.get("id") or data.get("title")),
        "active": True,
        "title": data.get("title", ""),
        "body": data.get("body", ""),
        "cta_label": data.get("cta_label") or None,
        "cta_url": data.get("cta_url") or None,
        "tone": data.get("tone") or "green",
    }
