import hashlib
from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import HTMLResponse, PlainTextResponse, Response

router = APIRouter(tags=["landing"])

_SITE = "https://gieochu.vn"

_ROBOTS = f"""User-agent: *
Allow: /

Sitemap: {_SITE}/sitemap.xml
"""

# ── Cẩm nang (blog SEO) ─────────────────────────────────────────────────────
# Manifest là NGUỒN DUY NHẤT về danh sách bài: trang /blog, sitemap và whitelist
# slug đều đọc từ đây. Thêm bài = thêm 1 dòng + 1 file HTML trong web/blog/.
# Slug cố ý không găm con số pháp lý (ngưỡng 500tr có thể đổi — đổi slug là mất hạng).
BLOG_POSTS = [
    {"slug": "thue-day-them-2026",
     "title": "Thuế dạy thêm 2026: bỏ thuế khoán, giáo viên kê khai thế nào?",
     "desc": "Dạy học miễn GTGT, môn bài đã bỏ, ngưỡng 500 triệu/năm — giải thích bằng ví dụ của một cô giáo dạy 3 lớp.",
     "date": "2026-08-25"},
    {"slug": "day-them-thu-bao-nhieu-phai-nop-thue",
     "title": "Dạy thêm thu bao nhiêu thì phải nộp thuế?",
     "desc": "Trả lời ngắn kèm bảng ví dụ theo số lớp và học phí để thầy cô tự đối chiếu.",
     "date": "2026-08-25"},
    {"slug": "dang-ky-ho-kinh-doanh-day-them",
     "title": "Đăng ký hộ kinh doanh dạy thêm: tự làm từng bước",
     "desc": "Mã ngành 8559, hồ sơ, nơi nộp từ 07/2025, lệ phí ~100k — tự làm được, không cần thuê dịch vụ.",
     "date": "2026-08-25"},
    {"slug": "thong-tu-29-day-them-giao-vien-can-lam-gi",
     "title": "Thông tư 29 về dạy thêm: giáo viên cần làm gì?",
     "desc": "Ai được dạy, ai được đứng tên hộ kinh doanh, khi nào phải báo hiệu trưởng — checklist đầy đủ.",
     "date": "2026-08-25"},
]

_BLOG_URLS = "".join(
    f"  <url><loc>{_SITE}/blog/{p['slug']}</loc><lastmod>{p['date']}</lastmod>"
    f"<changefreq>monthly</changefreq><priority>0.7</priority></url>\n"
    for p in BLOG_POSTS
)

_SITEMAP = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>{_SITE}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>{_SITE}/blog</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
{_BLOG_URLS}  <url><loc>{_SITE}/terms</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>
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
def landing_page() -> HTMLResponse:
    """Landing chính.

    Đặt Cache-Control tường minh vì trước đây trang KHÔNG có header cache nào —
    không Cache-Control, không ETag, không Last-Modified. Trình duyệt không có
    cách nào biết trang đã đổi, nên sau mỗi lần deploy người xem (kể cả chủ web)
    dễ nhìn thấy bản cũ và tưởng thay đổi chưa lên.

    5 phút: đủ ngắn để sửa xong là thấy gần như ngay, đủ dài để không bắt server
    dựng lại trang cho mỗi lượt tải trong một phiên xem.
    """
    html = _serve(_LANDING)
    return HTMLResponse(
        content=html,
        headers={
            "Cache-Control": "public, max-age=300, must-revalidate",
            "ETag": f'W/"{hashlib.md5(html.encode()).hexdigest()[:16]}"',
        },
    )


_BLOG_DIR = _WEB / "blog"
_BLOG_BY_SLUG = {p["slug"]: p for p in BLOG_POSTS}


def _hoc_cache(html: str) -> HTMLResponse:
    """Cache 5 phút + ETag theo nội dung — cùng lý do với landing_page."""
    return HTMLResponse(content=html, headers={
        "Cache-Control": "public, max-age=300, must-revalidate",
        "ETag": f'W/"{hashlib.md5(html.encode()).hexdigest()[:16]}"',
    })


@router.get("/blog", response_class=HTMLResponse)
def blog_index() -> HTMLResponse:
    """Mục lục Cẩm nang — sinh từ manifest để không bao giờ lệch với sitemap."""
    items = "".join(
        f'<li><a class="title" href="/blog/{p["slug"]}">{p["title"]}</a>'
        f'<p class="d">{p["desc"]}</p>'
        f'<span class="date">Cập nhật {p["date"][8:10]}/{p["date"][5:7]}/{p["date"][:4]}</span></li>'
        for p in BLOG_POSTS
    )
    html = f"""<!DOCTYPE html><html lang="vi"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cẩm nang cho giáo viên dạy thêm — thuế, Thông tư 29, hộ kinh doanh | GieoChữ</title>
<meta name="description" content="Hướng dẫn thực tế cho giáo viên dạy thêm: Thông tư 29, đăng ký hộ kinh doanh, thuế 2026 — viết cho người dạy tại nhà, không phải cho kế toán.">
<link rel="canonical" href="{_SITE}/blog">
<meta property="og:type" content="website"><meta property="og:title" content="Cẩm nang cho giáo viên dạy thêm">
<meta property="og:description" content="Thuế, Thông tư 29, hộ kinh doanh — viết cho người dạy tại nhà.">
<meta property="og:url" content="{_SITE}/blog"><meta property="og:image" content="{_SITE}/assets/og.jpg">
<meta property="og:locale" content="vi_VN">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/blog.css">
<script async src="https://www.googletagmanager.com/gtag/js?id=G-8WZ3J2BC2N"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){{dataLayer.push(arguments);}}gtag('js',new Date());gtag('config','G-8WZ3J2BC2N');</script>
</head><body>
<div class="nav"><div class="in"><a href="/" class="wordmark">Gieo<b>Chữ</b></a>
<a href="/" class="tai">Tải app miễn phí</a></div></div>
<main><h1>Cẩm nang cho giáo viên dạy thêm</h1>
<p class="meta">Thuế, Thông tư 29, hộ kinh doanh — viết cho người dạy tại nhà, không phải cho kế toán.</p>
<ul class="post-list">{items}</ul></main>
<footer>© 2026 GieoChữ · <a href="/">Trang chủ</a> · <a href="/terms">Điều khoản</a> · <a href="/privacy">Bảo mật</a></footer>
</body></html>"""
    return _hoc_cache(html)


@router.get("/blog/{slug}", response_class=HTMLResponse)
def blog_post(slug: str) -> HTMLResponse:
    """Bài viết — chỉ phục vụ slug có trong manifest (chặn đọc file tuỳ tiện)."""
    if slug not in _BLOG_BY_SLUG:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Không có bài này")
    return _hoc_cache(_serve(_BLOG_DIR / f"{slug}.html"))


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
