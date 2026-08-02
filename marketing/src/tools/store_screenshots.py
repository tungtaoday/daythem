"""Sinh ảnh đăng store (App Store + CH Play) từ ảnh màn app THẬT.

Xuất đủ bộ:
  - App Store iPhone 6.7"  : 1290x2796  (5 ảnh)
  - CH Play điện thoại      : 1080x1920  (5 ảnh)
  - CH Play feature graphic : 1024x500   (1 ảnh, BẮT BUỘC)
  - Icon                    : 512x512    (1 ảnh)

Dùng lại khung điện thoại + font của app_intro_video để đồng bộ nhận diện.
Chữ overlay lấy từ docs/store-listing-copy.md (mục 9).
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

from src.tools.app_intro_video import (
    BRAND_ICON, CORAL, CREAM, FONT_BLACK, FONT_BOLD, GREEN, GREEN_DEEP, HONEY, MINT,
    SCREENS, _font, _phone, _rounded, _wrap,
)

OUT = Path(__file__).resolve().parent.parent.parent / "data" / "store"

# 5 ảnh: (file màn, tiêu đề, nền, màu chữ, tỉ lệ cắt dọc)
SHOTS = [
    ("home.png", "Lớp hôm nay, ai chưa nộp —\nthấy ngay", GREEN, CREAM, 0.0),
    ("attendance.png", "Điểm danh một chạm", MINT, GREEN_DEEP, 0.05),
    ("tuition.png", "Không sót ai chưa đóng", HONEY, GREEN_DEEP, 0.0),
    ("s_thiep.png", "Báo cáo riêng\ntừng phụ huynh", CORAL, CREAM, 0.10),
    ("s_class_students.png", "Mọi việc của lớp —\nmột màn", CREAM, GREEN_DEEP, 0.0),
]


def _shadow(base: Image.Image, obj: Image.Image, xy: tuple[int, int], blur: int = 30) -> None:
    sh = Image.new("RGBA", base.size, (0, 0, 0, 0))
    blob = Image.new("RGBA", obj.size, (0, 0, 0, 120))
    blob.putalpha(obj.split()[3].point(lambda a: int(a * 0.5)))
    sh.paste(blob, (xy[0], xy[1] + int(blur * 0.8)), blob)
    base.alpha_composite(sh.filter(ImageFilter.GaussianBlur(blur)))


def make_shot(w: int, h: int, screen: str, headline: str, bg: tuple, fg: tuple,
              pan: float) -> Image.Image:
    """1 ảnh store: nền màu + tiêu đề trên + khung điện thoại tràn đáy."""
    img = Image.new("RGBA", (w, h), bg + (255,))
    d = ImageDraw.Draw(img)

    # Tiêu đề — cỡ theo chiều rộng ảnh để cân ở mọi kích thước
    fsize = int(w * 0.072)
    f = _font(FONT_BLACK, fsize)
    lines: list[str] = []
    for part in headline.split("\n"):
        lines += _wrap(d, part, f, int(w * 0.86))
    y = int(h * 0.055)
    for ln in lines:
        tw = d.textlength(ln, font=f)
        d.text(((w - tw) / 2, y), ln, font=f, fill=fg)
        y += int(fsize * 1.22)

    # Khung điện thoại: rộng ~78% ảnh, đáy tràn khỏi khung (nhìn năng động hơn)
    pw = int(w * 0.78)
    src = Image.open(SCREENS / screen).convert("RGB")
    vis_h = int(pw * 2.03) - int(pw * 0.055)
    crop_h = int(src.width * vis_h / (pw - int(pw * 0.055)))
    off = int(max(0, src.height - crop_h) * pan)
    view = src.crop((0, off, src.width, min(src.height, off + crop_h)))
    ph = _phone(view, pw)

    px = (w - pw) // 2
    py = y + int(h * 0.035)
    _shadow(img, ph, (px, py), blur=int(w * 0.025))
    img.alpha_composite(ph, (px, py))
    return img


def make_feature_graphic(w: int = 1024, h: int = 500) -> Image.Image:
    """Feature graphic CH Play — bắt buộc, hiển thị ở đầu trang app."""
    img = Image.new("RGBA", (w, h), GREEN_DEEP + (255,))
    d = ImageDraw.Draw(img)
    # khối màu chéo nhẹ cho đỡ phẳng
    d.polygon([(int(w * 0.62), 0), (w, 0), (w, h), (int(w * 0.48), h)], fill=GREEN + (255,))

    if BRAND_ICON.exists():
        s = int(h * 0.30)
        ic = _rounded(Image.open(BRAND_ICON).convert("RGBA").resize((s, s), Image.LANCZOS),
                      int(s * 0.24))
        img.alpha_composite(ic, (int(w * 0.07), int(h * 0.20)))

    f1 = _font(FONT_BLACK, int(h * 0.135))
    f2 = _font(FONT_BOLD, int(h * 0.068))
    x = int(w * 0.07)
    d.text((x, int(h * 0.56)), "GieoChữ", font=f1, fill=CREAM)
    d.text((x, int(h * 0.75)), "Trợ lý lớp dạy thêm", font=f2, fill=HONEY)

    # điện thoại nhỏ bên phải, nghiêng nhẹ
    try:
        src = Image.open(SCREENS / "home.png").convert("RGB")
        pw = int(h * 0.62)
        crop_h = int(src.width * (pw * 2.03) / pw)
        ph = _phone(src.crop((0, 0, src.width, min(src.height, crop_h))), pw)
        ph = ph.rotate(-8, expand=True, resample=Image.BICUBIC)
        img.alpha_composite(ph, (int(w * 0.66), int(h * 0.16)))
    except Exception:
        pass
    return img


def make_icon(size: int = 512) -> Image.Image:
    """Icon store — nền thương hiệu + logo, KHÔNG bo góc (store tự bo)."""
    img = Image.new("RGBA", (size, size), GREEN + (255,))
    if BRAND_ICON.exists():
        s = int(size * 0.66)
        ic = Image.open(BRAND_ICON).convert("RGBA").resize((s, s), Image.LANCZOS)
        img.alpha_composite(ic, ((size - s) // 2, (size - s) // 2))
    return img


def build_all() -> dict:
    OUT.mkdir(parents=True, exist_ok=True)
    made: list[str] = []

    specs = [("ios", 1290, 2796), ("play", 1080, 1920)]
    for tag, w, h in specs:
        for i, (screen, head, bg, fg, pan) in enumerate(SHOTS, 1):
            if not (SCREENS / screen).exists():
                continue
            im = make_shot(w, h, screen, head, bg, fg, pan).convert("RGB")
            p = OUT / f"{tag}_{i}_{w}x{h}.png"
            im.save(p, quality=95)
            made.append(p.name)

    fg_img = make_feature_graphic().convert("RGB")
    fg_img.save(OUT / "play_feature_graphic_1024x500.png", quality=95)
    made.append("play_feature_graphic_1024x500.png")

    ic = make_icon().convert("RGB")
    ic.save(OUT / "icon_512x512.png", quality=95)
    made.append("icon_512x512.png")

    return {"status": "success", "dir": str(OUT), "files": made, "count": len(made)}


if __name__ == "__main__":
    print(build_all())
