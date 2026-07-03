from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import HTMLResponse

router = APIRouter(tags=["landing"])

_WEB = Path(__file__).resolve().parent.parent.parent / "web"
# Landing chính (hand-build, đã chạy tốt).
_LANDING = _WEB / "landing.html"
# Bản xuất từ Claude Design (standalone) — dùng khi đã có FILE ĐẦY ĐỦ.
_LANDING_CLAUDE = _WEB / "gieochu-landing.html"


def _serve(p: Path) -> str:
    try:
        return p.read_text(encoding="utf-8")
    except FileNotFoundError:
        return "<h1>GieoChữ</h1><p>Trang giới thiệu đang cập nhật.</p>"


@router.get("/", response_class=HTMLResponse)
@router.get("/landing", response_class=HTMLResponse)
def landing_page() -> str:
    return _serve(_LANDING)


@router.get("/landing-claude", response_class=HTMLResponse)
def landing_claude() -> str:
    return _serve(_LANDING_CLAUDE)
