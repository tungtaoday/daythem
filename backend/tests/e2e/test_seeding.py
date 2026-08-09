"""Seeding hằng ngày — chủ đề phải tất định và bám đúng dữ liệu nghe ngóng."""
from collections import Counter
from datetime import date, timedelta

from daythem.service.seeding import CYCLE, TOPICS, seeding_lines, topic_of_day


def test_cung_mot_ngay_luon_ra_cung_chu_de():
    """Tất định — chạy lại bao nhiêu lần cũng thế, không gọi AI."""
    d = date(2026, 8, 4)
    assert topic_of_day(d).key == topic_of_day(d).key
    assert topic_of_day(d) is topic_of_day(date(2026, 8, 4))


def test_chu_de_doi_theo_ngay():
    keys = {topic_of_day(date(2026, 8, 4) + timedelta(days=i)).key for i in range(8)}
    assert len(keys) > 1, "8 ngày liên tiếp mà chỉ có 1 chủ đề thì vòng xoay hỏng"


def test_moi_khoa_trong_vong_xoay_deu_ton_tai():
    for k in CYCLE:
        assert k in TOPICS, f"vòng xoay trỏ tới chủ đề {k!r} không tồn tại"


def test_trong_so_bam_du_lieu_nghe_ngong():
    """'nhắc học phí' được nhắc 44 lần → phải xuất hiện nhiều nhất.
    'báo cáo & phẩm giá' 0 lần → ít nhất. Xem docs/books/05."""
    c = Counter(CYCLE)
    assert c["hocphi"] > c["baocao"], "chủ đề người ta kêu nhiều nhất phải xuất hiện nhiều hơn"
    assert c["hocphi"] == max(c.values()), "'nhắc học phí' phải là chủ đề xuất hiện nhiều nhất"


def test_moi_chu_de_du_tu_khoa_va_mau_tra_loi():
    for key, t in TOPICS.items():
        assert t.keywords, f"{key} thiếu từ khoá tìm kiếm"
        assert len(t.reply) > 80, f"{key} mẫu trả lời quá ngắn, không dùng được"
        assert t.pillar, f"{key} thiếu trụ nội dung"


def test_mau_tra_loi_khong_nhac_ten_app():
    """Luật vàng: trả lời trong nhóm KHÔNG được quảng cáo — nhắc app là bị gỡ bài."""
    for key, t in TOPICS.items():
        low = t.reply.lower()
        for cam in ["gieochu", "gieo chữ", "tải app", "link app", "app của em"]:
            assert cam not in low, f"mẫu {key} có nhắc app ({cam!r}) — sẽ bị coi là quảng cáo"


def test_mau_tra_loi_khong_bia_so():
    """Luật cứng: chưa có số đo thật thì không được nêu con số thành tích."""
    for key, t in TOPICS.items():
        low = t.reply.lower()
        for cam in ["tiết kiệm 30 phút", "% hài lòng", "nghìn giáo viên", "hàng nghìn"]:
            assert cam not in low, f"mẫu {key} bịa số ({cam!r})"


def test_khoi_telegram_co_du_thanh_phan():
    lines = seeding_lines(date(2026, 8, 4), posts_this_week=0, target_posts=5)
    text = "\n".join(lines)
    assert "SEEDING HÔM NAY" in text
    assert "Bấm là ra bài đang hỏi" in text, "phải có link bấm thẳng, không bắt người dùng tự gõ từ khoá"
    assert "0/5" in text, "thiếu bài phải nhắc số bài còn thiếu"


def test_du_bai_thi_khong_nhac_nua():
    lines = seeding_lines(date(2026, 8, 4), posts_this_week=5, target_posts=5)
    assert not any("Bài đăng tuần này" in ln for ln in lines), \
        "đăng đủ rồi mà vẫn nhắc là gây nhiễu"


# ── Link nhóm trong bản tin ──────────────────────────────────────────────────

def test_ban_tin_co_du_5_link_nhom():
    from daythem.service.seeding import GROUPS, group_link_lines
    text = "\n".join(group_link_lines(date(2026, 8, 10)))
    for g in GROUPS:
        assert g.url in text, f"thiếu link nhóm {g.name}"
    assert text.count("<a href=") == len(GROUPS) == 5


def test_link_tim_dung_dinh_dang_va_ma_hoa():
    """Facebook nhận /search/?q= với từ khoá đã URL-encode — kiểm cả chiều giải mã."""
    from urllib.parse import unquote
    from daythem.service.seeding import GROUPS, search_url, topic_of_day
    kw = topic_of_day(date(2026, 8, 10)).keywords[0]
    u = search_url(GROUPS[0], kw)
    assert "/search/?q=" in u and u.startswith(GROUPS[0].url)
    assert unquote(u.split("q=")[1]) == kw, "mã hoá rồi giải mã phải ra đúng từ khoá gốc"


def test_tu_khoa_xoay_de_5_link_khong_trung_het():
    """5 link một sáng phải phủ nhiều từ khoá, không phải cùng một từ."""
    import re
    from daythem.service.seeding import group_link_lines
    text = "\n".join(group_link_lines(date(2026, 8, 10)))
    kws = set(re.findall(r"“(.+?)”", text))
    assert len(kws) >= 2, f"cả 5 nhóm cùng một từ khoá: {kws}"


def test_seeding_lines_gom_ca_link_va_mau():
    from daythem.service.seeding import seeding_lines
    text = "\n".join(seeding_lines(date(2026, 8, 10), 0, 5))
    assert "Bấm là ra bài đang hỏi" in text
    assert "<a href=" in text
    assert "Mẫu trả lời" in text
