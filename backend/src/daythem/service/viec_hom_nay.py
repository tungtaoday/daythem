"""Bản tin sáng: chỉ những gì PHẢI LÀM, kèm tin nhắn soạn sẵn để copy là gửi.

Vì sao viết lại thay vì sửa `ops_digest`: bản tin cũ dài ~40 dòng gồm North Star,
phễu cộng dồn, hàng chờ, click theo kênh, bài đã đăng, mốc store... Đọc xong vẫn
phải tự nghĩ "vậy giờ làm gì". Ở quy mô một người, thứ cần là một danh sách việc,
không phải bảng chỉ số.

Số liệu KHÔNG mất đi — vẫn nằm ở /admin/ops và /admin/users cho lúc muốn đào sâu.
Chỉ là không bắt đọc mỗi sáng nữa.

Nguyên tắc: mỗi mục phải trả lời được "làm gì tiếp theo". Cái nào không trả lời
được thì không thuộc về bản tin này.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from daythem.service.cham_soc import dang_im_lang
from daythem.service.user_health import user_list

_VN = timezone(timedelta(hours=7))

# Tin nhắn soạn sẵn theo ĐÚNG điểm kẹt. Viết như đồng nghiệp nhắn nhau, xưng "em"
# vì phần lớn giáo viên dùng app lớn tuổi hơn. Không dùng từ marketing.
def _tin_nhan(u) -> str:
    """Gọi tên MỘT lần ở câu chào, sau đó xưng hô trung tính.

    Nhắc lại tên ở mỗi câu ("Chào X ạ. X thử... X cần em chỉ không?") đọc lên
    thấy ngay là máy soạn, mà đây là tin nhắn giáo viên sẽ đọc. Cũng không đoán
    giới tính từ tên — đoán sai là mất thiện cảm ngay câu đầu.
    """
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


def _uu_tien(u) -> int:
    """Ai gọi trước. Xếp theo MẤT MÁT nếu không gọi, không theo mức độ dễ gọi."""
    dang_dung_tot = u.active_days >= 2 and u.days_quiet <= 3
    if u.days_quiet >= 7 and u.students:
        return 0        # đã dùng thật rồi im lặng — cấp cứu, mất là mất hẳn
    if dang_dung_tot:
        return 5        # người đang khoẻ: đây là mời dùng thêm, KHÔNG phải cứu hộ
    if u.students >= 10:
        return 1        # nhập cả chục em bằng tay rồi dừng — tiếc nhất
    if u.students:
        return 2
    if u.classes:
        return 3
    return 4


def viec_hom_nay(session_factory, bai_hom_nay: str = "", link_group: str = "",
                 kem_nut: bool = False):
    """Bản tin HTML cho Telegram. Ngắn, và mỗi dòng đều là một việc.

    kem_nut=True trả (text, reply_markup) để mỗi người có nút "Đã nhắn" /
    "Họ hỏi cách làm" — bấm một cái thay vì gõ lệnh.
    """
    hom_nay = datetime.now(_VN)
    d = user_list(session_factory)
    # Ai vừa nhắn trong 4 ngày, hoặc đã chốt, thì bỏ qua — nhắn lại là phiền họ
    # và làm bản tin mất tin cậy nên rồi cũng bị bỏ luôn.
    im = dang_im_lang(session_factory)
    can_goi = sorted([u for u in d["users"] if u.stuck and u.teacher_id not in im],
                     key=_uu_tien)

    L = [f"<b>🌿 {hom_nay:%d/%m}</b>", ""]

    if can_goi:
        L.append(f"<b>☎️ GỌI HÔM NAY ({len(can_goi)})</b>")
        for u in can_goi[:5]:
            L.append(f"• <b>{u.name}</b> · {u.phone} — {u.stuck.lower()}")
            L.append(f"<code>{_tin_nhan(u)}</code>")
            L.append("")
    else:
        L += ["<b>☎️ GỌI HÔM NAY:</b> không ai đang kẹt 🌿", ""]

    if bai_hom_nay:
        L.append("<b>📣 ĐĂNG HÔM NAY</b>")
        if link_group:
            L.append(f'👉 <a href="{link_group}">Mở group</a>')
        L.append(f"<code>{bai_hom_nay}</code>")
        L.append("")

    # Một dòng số duy nhất, và chỉ vì nó là thước đo sống còn.
    ns = d["real_active"]
    L.append(f"<i>{d['real_total']} giáo viên thật · {ns} đang dùng đều</i>")
    L.append("<i>Số chi tiết: gieochu.vn/admin/users</i>")
    text = '\n'.join(L)
    if not kem_nut:
        return text

    # Mỗi người 2 nút. callback_data giới hạn 64 byte nên chỉ nhét mã ngắn + id.
    rows = []
    for u in can_goi[:5]:
        ten = (u.name or "?")[:14]
        rows.append([
            {"text": f"✓ Đã nhắn {ten}", "callback_data": f"n:{u.teacher_id}"},
            {"text": "💬 Họ hỏi cách", "callback_data": f"h:{u.teacher_id}"},
        ])
    return text, {"inline_keyboard": rows}
