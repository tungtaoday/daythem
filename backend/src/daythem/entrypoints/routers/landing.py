from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import HTMLResponse

router = APIRouter(tags=["landing"])

# Trang giới thiệu (marketing) — phục vụ tại "/" và "/landing".
_LANDING = Path(__file__).resolve().parent.parent.parent / "web" / "landing.html"


@router.get("/", response_class=HTMLResponse)
@router.get("/landing", response_class=HTMLResponse)
def landing_page() -> str:
    try:
        return _LANDING.read_text(encoding="utf-8")
    except FileNotFoundError:
        return "<h1>GieoChữ</h1><p>Trang giới thiệu đang cập nhật.</p>"
