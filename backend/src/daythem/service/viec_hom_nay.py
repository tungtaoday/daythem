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

# Tin soạn sẵn + xếp hạng đã CHUYỂN NHÀ sang crm.py (dùng chung với admin
# suite — BR1 một sổ nhiều cửa). Import lại dưới tên cũ cho thân quen.
from daythem.service.crm import tin_nhan as _tin_nhan, uu_tien as _uu_tien  # noqa: E402


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
        # Bài học 29/08: nhắn Zalo từ tài khoản lạ rơi vào hộp "người lạ",
        # không ai thấy — chủ app đã nhắn cả loạt mà im re vì đúng lỗi này.
        L.append("<i>Zalo người lạ rơi vào hộp ẩn — GỌI trước, hoặc kết bạn kèm ghi chú rồi mới nhắn.</i>")
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
