from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import HTMLResponse, PlainTextResponse, Response

router = APIRouter(tags=["landing"])

_SITE = "https://gieochu.vn"

_ROBOTS = f"""User-agent: *
Allow: /

Sitemap: {_SITE}/sitemap.xml
"""

_SITEMAP = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>{_SITE}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>{_SITE}/terms</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>
  <url><loc>{_SITE}/privacy</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>
</urlset>
"""

_WEB = Path(__file__).resolve().parent.parent.parent / "web"
# Landing chính = bản HTML/CSS tĩnh (nhẹ ~40KB, mở tức thì, SEO tốt).
_LANDING = _WEB / "gieochu.html"
# Bản Claude Design standalone (nặng 1.5MB) — giữ để đối chiếu.
_LANDING_CLAUDE = _WEB / "gieochu-landing.html"
# Bản hand-build cũ (dự phòng / so sánh).
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


@router.get("/landing-claude", response_class=HTMLResponse)
def landing_claude() -> str:
    return _serve(_LANDING_CLAUDE)


@router.get("/google6484d2edca309cd5.html", response_class=PlainTextResponse)
def google_site_verification() -> str:
    # Xác minh sở hữu website với Google Search Console (phương thức file HTML).
    return "google-site-verification: google6484d2edca309cd5.html"


@router.get("/robots.txt", response_class=PlainTextResponse)
def robots() -> str:
    return _ROBOTS


@router.get("/sitemap.xml")
def sitemap() -> Response:
    return Response(content=_SITEMAP, media_type="application/xml")
