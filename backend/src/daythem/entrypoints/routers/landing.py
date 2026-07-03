from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import HTMLResponse

router = APIRouter(tags=["landing"])

_WEB = Path(__file__).resolve().parent.parent.parent / "web"
# Landing chính = bản xuất từ Claude Design (standalone bundle).
_LANDING = _WEB / "gieochu-landing.html"
# Bản hand-build (dự phòng / so sánh).
_LANDING_V1 = _WEB / "landing.html"


def _serve(p: Path) -> str:
    try:
        return p.read_text(encoding="utf-8")
    except FileNotFoundError:
        return "<h1>GieoChữ</h1><p>Trang giới thiệu đang cập nhật.</p>"


@router.get("/", response_class=HTMLResponse)
@router.get("/landing", response_class=HTMLResponse)
def landing_page() -> str:
    return _serve(_LANDING)


@router.get("/landing-v1", response_class=HTMLResponse)
def landing_v1() -> str:
    return _serve(_LANDING_V1)
