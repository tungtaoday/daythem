"""Báo việc đã làm qua Telegram — đóng vòng lặp: đọc bản tin trên điện thoại
thì cũng phải trả lời lại được từ điện thoại."""
import importlib.util
import sys
from pathlib import Path

import pytest

from daythem.service.gtm_plan import PLAN, mark, next_tasks, seed_tasks

_BOT = Path(__file__).resolve().parents[2] / "scripts" / "seeding_bot.py"


@pytest.fixture
def bot(db, monkeypatch):
    """Nạp bot rồi trỏ SessionLocal của nó vào DB test."""
    spec = importlib.util.spec_from_file_location("seeding_bot_under_test", _BOT)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = mod
    spec.loader.exec_module(mod)
    monkeypatch.setattr(mod, "SessionLocal", lambda: db)
    seed_tasks(lambda: db)
    return mod


def test_viec_liet_ke_co_danh_so_va_ma(bot):
    t = bot._viec_text()
    assert "VIỆC CẦN LÀM" in t
    assert "1. " + PLAN[0].title in t
    assert PLAN[0].key in t, "phải hiện mã việc để gõ tay được khi cần"


def test_xong_bang_so_thu_tu(bot, db):
    out = bot._mark_text("1", "done")
    assert "✅" in out and PLAN[0].title in out
    assert PLAN[0].key not in [x.key for x in next_tasks(lambda: db, 99)]


def test_xong_bang_ma_viec(bot, db):
    bot._mark_text("zalo-oa", "done")
    assert "zalo-oa" not in [x.key for x in next_tasks(lambda: db, 99)]


def test_bao_xong_thi_goi_y_viec_tiep_theo(bot):
    """Báo xong mà không biết làm gì tiếp là mất đà."""
    out = bot._mark_text("1", "done")
    assert "Tiếp theo" in out
    assert PLAN[1].title in out


def test_so_thu_tu_bam_theo_danh_sach_dang_mo(bot, db):
    """Sau khi việc 1 xong, '/xong 1' phải trỏ vào việc kế — không phải việc cũ."""
    bot._mark_text("1", "done")
    out = bot._mark_text("1", "done")
    assert PLAN[1].title in out


def test_so_ngoai_khoang_bao_loi_ro(bot):
    out = bot._mark_text("999", "done")
    assert "❌" in out or "Thiếu" in out
    assert "/viec" in out, "phải chỉ đường cho người dùng tự sửa"


def test_ma_viec_sai_bao_loi_ro(bot):
    out = bot._mark_text("khong-co-that", "done")
    assert "❌" in out and "/viec" in out


def test_thieu_tham_so_thi_huong_dan(bot):
    out = bot._mark_text("", "done")
    assert "/xong 1" in out


def test_help_co_ca_hai_nhom_lenh(bot):
    """Bot làm hai việc khác nhau — help phải nói rõ cả hai."""
    assert "seeding" in bot.HELP.lower()
    for c in ["/viec", "/xong", "/chude"]:
        assert c in bot.HELP


def test_viec_da_xong_hien_trong_traceback(bot):
    mark(lambda: bot.SessionLocal(), PLAN[0].key, "done")
    assert "Vừa xong" in bot._viec_text()
