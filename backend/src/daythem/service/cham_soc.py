"""Chăm sóc giáo viên: ghi nhận đã nhắn ai, và bài hướng dẫn khi họ hỏi lại.

Vá đúng mắt xích còn thiếu: bản tin sáng đưa ra danh sách cần gọi, nhưng không có
đường ghi "đã nhắn rồi" nên hôm sau vẫn hiện y nguyên người đó. Nhắn lại lần hai
là phiền giáo viên, và bản tin mất tin cậy nên rồi cũng bị bỏ qua.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta

from sqlalchemy import desc, select

from daythem.adapters.orm import OutreachORM, TeacherORM

logger = logging.getLogger(__name__)

# Đã nhắn thì im trong 4 ngày. Ngắn hơn thì thành giục, dài hơn thì nguội mất.
IM_LANG_NGAY = 4

KIND_NHAN, KIND_HUONG, KIND_XONG, KIND_BO = "nhan", "huong", "xong", "bo"


def ghi(session_factory, teacher_id: str, kind: str, note: str = "") -> bool:
    """Ghi một lần chăm sóc. Nuốt lỗi — không được làm chết bot."""
    if kind not in (KIND_NHAN, KIND_HUONG, KIND_XONG, KIND_BO):
        return False
    try:
        s = session_factory()
        try:
            s.add(OutreachORM(id=str(uuid.uuid4()), teacher_id=teacher_id,
                              kind=kind, note=(note or "")[:200] or None))
            s.commit()
        finally:
            s.close()
        return True
    except Exception:
        logger.warning("ghi chăm sóc bỏ qua (kind=%s)", kind)
        return False


def dang_im_lang(session_factory) -> set[str]:
    """teacher_id đã nhắn gần đây hoặc đã chốt — bản tin bỏ qua."""
    moc = datetime.utcnow() - timedelta(days=IM_LANG_NGAY)
    s = session_factory()
    try:
        rows = s.scalars(select(OutreachORM).order_by(OutreachORM.created_at)).all()
    finally:
        s.close()
    ra: set[str] = set()
    for r in rows:
        if r.kind in (KIND_XONG, KIND_BO):
            ra.add(r.teacher_id)              # chốt rồi thì thôi hẳn
        elif r.kind in (KIND_NHAN, KIND_HUONG) and r.created_at >= moc:
            ra.add(r.teacher_id)              # vừa nhắn, chờ họ trả lời
        elif r.teacher_id in ra and r.kind in (KIND_NHAN, KIND_HUONG):
            pass
    return ra


def lich_su(session_factory, teacher_id: str, n: int = 5) -> list[OutreachORM]:
    s = session_factory()
    try:
        return s.scalars(
            select(OutreachORM).where(OutreachORM.teacher_id == teacher_id)
            .order_by(desc(OutreachORM.created_at)).limit(n)
        ).all()
    finally:
        s.close()


# ── Bài hướng dẫn: viết như nhắn Zalo cho đồng nghiệp, không phải tài liệu ──
# Mỗi bài phải làm được ngay trên điện thoại trong lúc đang nhắn, nên đánh số
# bước ngắn, mỗi bước một hành động, không giải thích dài.

HUONG_DAN = {
    "diem_danh": (
        "Điểm danh (khoảng 30 giây ạ):\n"
        "1. Mở app, bấm tab <b>Lớp học</b> ở dưới\n"
        "2. Chạm vào lớp cần điểm danh\n"
        "3. Bấm nút <b>Điểm danh</b>\n"
        "4. App để sẵn <b>cả lớp có mặt</b> — mình chỉ chạm vào tên bạn nào NGHỈ\n"
        "5. Bấm <b>Hoàn tất điểm danh</b>\n\n"
        "Xong là app tự nhớ, cuối tuần gộp thành báo cáo cho phụ huynh luôn ạ."
    ),
    "them_hs": (
        "Thêm học sinh (nhanh nhất là nhập cả lớp một lút ạ):\n"
        "1. Mở app, tab <b>Lớp học</b>, chạm vào lớp\n"
        "2. Bấm <b>Học sinh</b> rồi bấm <b>Nhập nhanh</b>\n"
        "3. Nếu mình có sẵn danh sách trong ảnh hoặc file, chọn <b>Chọn ảnh</b> / "
        "<b>Chọn file</b> — app tự đọc tên ra\n"
        "4. Không có sẵn thì gõ mỗi dòng một tên cũng được\n"
        "5. Bấm <b>Lưu</b>\n\n"
        "Mình cứ gửi em ảnh danh sách, em nhập giúp cho nhanh cũng được ạ."
    ),
    "tao_lop": (
        "Tạo lớp đầu tiên (khoảng 1 phút ạ):\n"
        "1. Mở app, tab <b>Lớp học</b> ở dưới\n"
        "2. Bấm dấu <b>+</b> góc trên bên phải\n"
        "3. Điền tên lớp (vd <i>Toán 9 Tối</i>), chọn môn và khối\n"
        "4. Chọn buổi học trong tuần và giờ học\n"
        "5. Điền học phí — để mặc định cũng được, sửa sau vẫn kịp\n"
        "6. Bấm <b>Tạo lớp</b>\n\n"
        "Xong bước này là thêm học sinh vào rồi dùng được ngay ạ."
    ),
    "thu_phi": (
        "Thu học phí (tick một cái là xong ạ):\n"
        "1. Mở app, tab <b>Học phí</b> ở dưới\n"
        "2. Chọn tháng cần thu\n"
        "3. Danh sách hiện <b>ai đã nộp, ai chưa</b>\n"
        "4. Em nào vừa đưa tiền thì bấm <b>Tick đã thu</b>\n"
        "5. Ai chưa nộp, bấm <b>Gửi nhắc</b> — app soạn sẵn tin, mình mở Zalo gửi riêng\n\n"
        "Tin nhắc có tên con và số tiền, gửi riêng nên phụ huynh không ngại ạ."
    ),
    "bao_cao": (
        "Gửi thiệp báo cáo riêng cho phụ huynh:\n"
        "1. Mở app, tab <b>Báo cáo</b> ở dưới\n"
        "2. Bấm <b>Gửi báo cáo riêng từng bé</b>\n"
        "3. Chọn bé cần gửi\n"
        "4. App làm sẵn tấm thiệp có <b>tên con, số buổi học, chuyên cần</b>\n"
        "5. Bấm <b>Chia sẻ</b> rồi chọn Zalo, gửi riêng cho phụ huynh bé đó\n\n"
        "Cái này phụ huynh thích lắm ạ, vì có tên con chứ không phải tin chung cả nhóm."
    ),
}

# Điểm kẹt → bài hướng dẫn tương ứng. Khớp với chẩn đoán trong user_health.
def huong_dan_cho(u) -> tuple[str, str]:
    """Trả (mã, nội dung) bài hướng dẫn hợp với chỗ giáo viên đang kẹt."""
    if u.classes == 0:
        return "tao_lop", HUONG_DAN["tao_lop"]
    if u.students == 0:
        return "them_hs", HUONG_DAN["them_hs"]
    f = u.features
    if f.get("điểm danh", 0) == 0:
        return "diem_danh", HUONG_DAN["diem_danh"]
    if f.get("thu phí", 0) == 0:
        return "thu_phi", HUONG_DAN["thu_phi"]
    return "bao_cao", HUONG_DAN["bao_cao"]
