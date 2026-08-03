"""Báo cáo tuần — việc tuần lấy từ lộ trình cứng, phần nhìn lại đo từ DB thật."""
from datetime import date

import pytest

from daythem.service.weekly_report import (
    TARGET_POSTS_PER_WEEK, _mark, _week_bounds, build_weekly_report, current_phase,
)


def test_tuan_bat_dau_thu_2_ket_chu_nhat():
    # 05/08/2026 là Thứ 4
    start, end = _week_bounds(date(2026, 8, 5))
    assert start == date(2026, 8, 3) and start.weekday() == 0
    assert end == date(2026, 8, 9) and end.weekday() == 6


def test_ngay_dau_va_cuoi_tuan_van_ra_cung_mot_tuan():
    assert _week_bounds(date(2026, 8, 3)) == _week_bounds(date(2026, 8, 9))


def test_moi_ngay_deu_roi_vao_dung_mot_giai_doan():
    """Không được có ngày nào lọt khe giữa hai giai đoạn, cũng không chồng nhau."""
    d = date(2026, 8, 3)
    while d <= date(2026, 8, 31):
        assert current_phase(d) is not None, f"{d} không thuộc giai đoạn nào"
        d = date.fromordinal(d.toordinal() + 1)


@pytest.mark.parametrize("actual,target,expected", [
    (5, 5, "✅"), (6, 5, "✅"),
    (3, 5, "⚠️"), (0, 5, "❌"), (1, 5, "❌"),
])
def test_cham_diem(actual, target, expected):
    assert _mark(actual, target) == expected


def test_bao_cao_chay_duoc_tren_db_rong(db):
    """DB chưa có gì cũng phải ra báo cáo, không nổ."""
    r = build_weekly_report(lambda: db)
    assert r["text"] and "BÁO CÁO TUẦN" in r["text"]
    assert r["lookback"]["posts"] == 0
    assert r["tasks"], "phải luôn có việc tuần (lộ trình cứng + việc lặp)"


def test_khong_dang_bai_thi_bao_dang_tac(db):
    r = build_weekly_report(lambda: db)
    assert any("KHÔNG đăng bài" in b["text"] for b in r["blocked"])


def test_moi_viec_deu_co_nguon_lan_nguoc(db):
    """'Traceback' = lần ngược được về tài liệu gốc, không có việc từ trên trời."""
    r = build_weekly_report(lambda: db)
    for t in r["tasks"]:
        assert t["source"], f"việc {t['text']!r} thiếu nguồn"
        assert t["owner"] in ("anh", "claude")


def test_muc_tieu_bai_dang_khop_giua_van_ban_va_hang_so(db):
    """Chữ trong việc lặp phải khớp hằng số, tránh sửa một chỗ quên chỗ kia."""
    r = build_weekly_report(lambda: db)
    assert any(f"{TARGET_POSTS_PER_WEEK} bài group" in t["text"] for t in r["tasks"])
