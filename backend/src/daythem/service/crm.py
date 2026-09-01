"""CRM chăm sóc giáo viên — MỘT nguồn logic cho cả hai cửa (Telegram + admin).

Vì sao tách ra từ viec_hom_nay: bản tin Telegram và khu CRM của admin phải cho
cùng kết quả từ cùng sổ (BR1 của BUC-UNIFIED-ADMIN-OPERATIONS). Logic nằm trong
module bản tin thì admin phải import từ "bản tin" — sai chỗ về ngữ nghĩa và dễ
có người sao chép thay vì dùng chung. Đây là nhà mới của nó; bản tin import lại.
"""
from __future__ import annotations

from daythem.service.cham_soc import dang_im_lang, ghi, lich_su
from daythem.service.user_health import user_list

__all__ = ["tin_nhan", "uu_tien", "queue", "act"]


def tin_nhan(u) -> str:
    """Tin soạn sẵn theo ĐÚNG điểm kẹt. Gọi tên MỘT lần ở câu chào, sau đó xưng
    hô trung tính — nhắc tên mỗi câu đọc là biết máy soạn, và không đoán giới
    tính từ tên (đoán sai là mất thiện cảm ngay câu đầu)."""
    ten = (u.name or "").strip()
    chao = f"Chào {ten} ạ" if ten else "Chào thầy/cô ạ"

    if u.classes == 0:
        return (f"{chao}, em bên GieoChữ đây. Em thấy mình vừa đăng ký mà chưa tạo "
                f"lớp nào. Mình cần em hướng dẫn tạo lớp đầu tiên không ạ? Chỉ mất "
                f"khoảng 1 phút thôi.")
    if u.students == 0:
        return (f"{chao}. Mình đã tạo lớp rồi, giờ thêm học sinh vào là dùng được "
                f"ngay. Nếu có sẵn danh sách thì mình chụp ảnh gửi em, em chỉ cách "
                f"nhập nhanh cả lớp một lúc ạ.")
    aha = (u.features.get("điểm danh", 0) + u.features.get("thu phí", 0)
           + u.features.get("báo cáo", 0))
    if aha == 0:
        return (f"{chao}. Em thấy mình đã nhập {u.students} em vào lớp rồi. Buổi tới "
                f"mình thử điểm danh trên app xem sao ạ — chạm một cái là xong cả "
                f"lớp. Em chỉ trong 1 phút nếu cần ạ.")
    if u.days_quiet >= 7:
        return (f"{chao}, lâu rồi em không thấy mình vào app. Mình có gặp chỗ nào khó "
                f"dùng không ạ? Mình nói em nghe, em sửa luôn.")
    if u.features.get("báo cáo", 0) == 0:
        return (f"{chao}. Mình thử gửi thiệp báo cáo riêng cho một phụ huynh xem sao "
                f"ạ — có tên con và số buổi học, phụ huynh thích lắm. Mình cần em "
                f"chỉ không ạ?")
    return (f"{chao}, mình dùng app thấy tiện chứ ạ? Nếu được, mình cho em xin một "
            f"câu nhận xét ngắn, và giới thiệu giúp em đồng nghiệp nào đang dạy thêm "
            f"với ạ.")


def uu_tien(u) -> int:
    """Xếp theo MẤT MÁT nếu bỏ rơi, không theo mới-cũ (BR2)."""
    dang_dung_tot = u.active_days >= 2 and u.days_quiet <= 3
    if u.days_quiet >= 7 and u.students:
        return 0        # đã dùng thật rồi im lặng — cấp cứu, mất là mất hẳn
    if dang_dung_tot:
        return 5        # người đang khoẻ: mời dùng thêm, KHÔNG phải cứu hộ
    if u.students >= 10:
        return 1        # nhập cả chục em bằng tay rồi dừng — tiếc nhất
    if u.students:
        return 2
    if u.classes:
        return 3
    return 4


def queue(session_factory) -> list[dict]:
    """Hàng đợi chăm sóc: người kẹt, đã trừ khung im lặng, xếp theo mất mát."""
    d = user_list(session_factory)
    im = dang_im_lang(session_factory)
    ra = []
    for u in sorted([x for x in d["users"] if x.stuck and x.teacher_id not in im],
                    key=uu_tien):
        gan_nhat = lich_su(session_factory, u.teacher_id, 1)
        ra.append({
            "teacher_id": u.teacher_id,
            "ten": u.name,
            "phone": u.phone,
            "chan_doan": u.stuck,
            "muc_mat_mat": uu_tien(u),
            "tin_soan_san": tin_nhan(u),
            "cham_soc_gan_nhat": (
                {"kind": gan_nhat[0].kind,
                 "ngay": gan_nhat[0].created_at.strftime("%Y-%m-%d")}
                if gan_nhat else None),
        })
    return ra


def act(session_factory, teacher_id: str, kind: str) -> bool:
    """Ghi một hành động chăm sóc — uỷ quyền cho sổ chung (cham_soc.ghi).

    Ghi lặp vô hại về mặt trạng thái: hai bản ghi 'nhan' liên tiếp cho cùng
    người vẫn chỉ nghĩa là "đang trong khung im lặng" (EF2 của BUC)."""
    return ghi(session_factory, teacher_id, kind)
