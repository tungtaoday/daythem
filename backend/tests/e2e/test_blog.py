"""Cẩm nang /blog: route sống, manifest-sitemap-file không lệch nhau, SEO đủ thẻ."""
from pathlib import Path

from fastapi.testclient import TestClient

from daythem.entrypoints.app import app
from daythem.entrypoints.routers.landing import BLOG_POSTS, _BLOG_DIR

client = TestClient(app)


def test_muc_luc_blog_song_va_co_du_bai():
    r = client.get("/blog")
    assert r.status_code == 200
    for p in BLOG_POSTS:
        assert p["title"] in r.text
        assert f'/blog/{p["slug"]}' in r.text


def test_tung_bai_mo_duoc_va_co_the_seo():
    for p in BLOG_POSTS:
        r = client.get(f"/blog/{p['slug']}")
        assert r.status_code == 200, p["slug"]
        assert "<h1>" in r.text, p["slug"]
        assert f'rel="canonical" href="https://gieochu.vn/blog/{p["slug"]}"' in r.text, p["slug"]
        assert 'og:image' in r.text, p["slug"]
        assert 'application/ld+json' in r.text, p["slug"]
        # Bài thuế/pháp lý BẮT BUỘC có hộp lưu ý — khai thuế sai là rắc rối thật
        assert 'disclaimer' in r.text, f"{p['slug']} thiếu hộp lưu ý tham khảo"


def test_slug_la_tra_404_khong_doc_file_tuy_tien():
    assert client.get("/blog/khong-ton-tai").status_code == 404
    assert client.get("/blog/..%2Fgieochu").status_code in (404, 422)


def test_manifest_va_file_khong_lech_nhau():
    """Thêm bài vào manifest mà quên file (hoặc ngược lại) phải đỏ ngay ở đây,
    không phải đợi người dùng bấm vào link 404 trên trang thật."""
    slugs = {p["slug"] for p in BLOG_POSTS}
    files = {f.stem for f in Path(_BLOG_DIR).glob("*.html")}
    assert slugs == files, f"lệch: manifest={slugs - files} | file thừa={files - slugs}"


def test_sitemap_co_du_bai_blog():
    r = client.get("/sitemap.xml")
    assert "/blog</loc>" in r.text
    for p in BLOG_POSTS:
        assert f"/blog/{p['slug']}</loc>" in r.text


def test_landing_co_du_the_seo_moi():
    r = client.get("/")
    assert 'rel="canonical" href="https://gieochu.vn/"' in r.text
    assert 'og:image' in r.text
    assert 'application/ld+json' in r.text
    assert 'href="/blog"' in r.text          # tab Cẩm nang có mặt


def test_bai_viet_co_lien_ket_noi_bo():
    """Mỗi bài phải trỏ sang ít nhất 1 bài khác — SEO nội bộ và giữ người đọc."""
    for p in BLOG_POSTS:
        r = client.get(f"/blog/{p['slug']}")
        khac = [q["slug"] for q in BLOG_POSTS if q["slug"] != p["slug"]]
        assert any(f'/blog/{s}' in r.text for s in khac), f"{p['slug']} không link bài nào"
