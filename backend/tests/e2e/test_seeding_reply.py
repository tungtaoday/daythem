"""Soạn câu trả lời seeding — chốt chặn phải hoạt động dù model có quên luật."""
import pytest

from daythem.service import seeding_reply as sr


def test_bo_cau_nhac_ten_app():
    """Model lỡ nhắc app thì tầng code phải cắt, không được trả nguyên văn."""
    out = sr._check({
        "relevant": True, "topic": "học phí", "why": "x",
        "reply": "Cô thử cách này xem ạ.\nEm có làm app GieoChữ đúng việc này.\nChúc cô dạy vui.",
    })
    assert "gieochu" not in out["reply"].lower()
    assert "warning" in out, "phải cảnh báo để người dùng biết đã bị cắt"
    assert "Cô thử cách này" in out["reply"], "chỉ cắt dòng vi phạm, giữ phần còn lại"


@pytest.mark.parametrize("bad", [
    "app của em giúp cô việc này",
    "tải app ở link dưới nhé",
    "app này tiết kiệm 30 phút mỗi ngày",
    "hàng nghìn giáo viên đang dùng",
    "vào daythem.doitay.vn xem thử",
])
def test_chan_moi_cum_tu_cam(bad):
    out = sr._check({"relevant": True, "topic": "t", "why": "w",
                     "reply": f"Dòng sạch.\n{bad}\nDòng sạch nữa."})
    assert bad not in out["reply"]
    assert "warning" in out


def test_cau_tra_loi_sach_thi_giu_nguyen():
    clean = "Em thấy nhiều cô nhắn riêng từng phụ huynh cho đỡ ngại ạ.\nCô thử xem sao."
    out = sr._check({"relevant": True, "topic": "t", "why": "w", "reply": clean})
    assert out["reply"] == clean
    assert "warning" not in out


def test_bai_khong_lien_quan_khong_bi_dung_cham():
    out = sr._check({"relevant": False, "topic": "khác", "why": "không phải tệp", "reply": ""})
    assert out["reply"] == ""
    assert "warning" not in out


def test_thieu_khoa_thi_bao_loi_ro_rang(monkeypatch):
    monkeypatch.setattr(sr.settings, "GEMINI_API_KEY", "")
    with pytest.raises(ValueError, match="GEMINI_API_KEY"):
        sr.reply_for_text("một bài đăng dài đủ để xử lý bình thường")


def test_bai_rong_thi_bao_loi(monkeypatch):
    monkeypatch.setattr(sr.settings, "GEMINI_API_KEY", "fake-key")
    with pytest.raises(ValueError, match="nội dung"):
        sr.reply_for_text("   ")


def test_luat_cung_co_trong_prompt():
    """Nếu ai sửa prompt mà bỏ mất luật, test này phải đỏ."""
    s = sr._SYSTEM.lower()
    for phai_co in ["không nhắc tên app", "không bịa số", "chi cục thuế", "xưng \"em\""]:
        assert phai_co in s, f"prompt thiếu luật: {phai_co!r}"
