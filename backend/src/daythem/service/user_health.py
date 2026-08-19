"""Theo dõi TỪNG giáo viên thật: họ dùng tính năng nào, đang kẹt ở đâu.

Vì sao cần riêng file này thay vì nhìn phễu tổng: ở quy mô vài người dùng, tỷ lệ
phần trăm vô nghĩa (1/2 = 50% nghe như tín hiệu, thật ra là một người). Cái cần
biết là **từng người tên gì, làm được tới đâu, kẹt chỗ nào** để gọi điện đúng lúc.

Cũng chính vì vậy có `is_real`: DB đang lẫn tài khoản thử của owner, dữ liệu seed
và tester đổi chéo. Đếm gộp tất cả vào là tự lừa mình (đã mắc lỗi này một lần).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select

from daythem.adapters.orm import (
    ActivityEventORM, AttendanceSessionORM, ClassORM, StudentORM, TeacherORM, TuitionORM,
)

_VN_TZ = timezone(timedelta(hours=7))

# SĐT của owner / seed / demo — loại khỏi thống kê "người dùng thật".
# Sửa danh sách này khi dọn dữ liệu, đừng sửa rải rác trong code.
EXCLUDE_PHONES = {
    "0972585990", "0972585991", "0672585990",   # tài khoản của owner
    "0901234567", "0905550001", "0905550002",   # seed + demo cho người duyệt store
    "0963153970", "0988823406", "0791619461",   # seed script sinh (trải < 60s)
    "0912345678", "0987654321",                 # gõ thử
}
# Tester đổi chéo của dịch vụ: tạo hàng loạt 05-07/08, tên dạng email/nick.
EXCLUDE_RANGE = (datetime(2026, 8, 4), datetime(2026, 8, 8))

# Chặng đường của một giáo viên — thứ tự CHÍNH LÀ thứ tự họ đi qua.
STAGES = [
    ("đăng ký", "Đã tạo tài khoản"),
    ("tạo lớp", "Đã tạo lớp đầu tiên"),
    ("thêm HS", "Đã thêm học sinh"),
    ("điểm danh", "Đã điểm danh buổi đầu ← AHA"),
    ("thu phí", "Đã tick thu học phí ← AHA"),
    ("báo cáo", "Đã gửi thiệp/báo cáo ← AHA"),
]

FEATURE_OF_EVENT = {
    "class_created": "tạo lớp",
    "students_bulk_added": "thêm HS",
    "attendance_submitted": "điểm danh",
    "tuition_paid": "thu phí",
    "report_generated": "báo cáo",
    "thiep_shared": "gửi thiệp",
}


@dataclass
class UserHealth:
    phone: str
    name: str
    joined: datetime
    days_since_join: int
    days_quiet: int              # bao lâu rồi không có hoạt động nào
    active_days: int             # số NGÀY khác nhau có hoạt động → thước đo "dùng thật"
    classes: int
    students: int
    events: int
    features: dict[str, int] = field(default_factory=dict)
    stage: str = "đăng ký"
    stuck: str = ""              # mô tả điểm kẹt, rỗng nếu đang chạy tốt
    action: str = ""             # việc nên làm với người này


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def is_real(t: TeacherORM) -> bool:
    """Có phải giáo viên thật không — loại owner, seed, demo, tester đổi chéo."""
    if t.phone in EXCLUDE_PHONES:
        return False
    if EXCLUDE_RANGE[0] <= t.created_at < EXCLUDE_RANGE[1]:
        return False
    return True


def _diagnose(u: UserHealth) -> tuple[str, str]:
    """Điểm kẹt + việc nên làm. Câu chữ viết để đọc xong là biết nhấc máy gọi ai."""
    if u.classes == 0:
        return ("Đăng ký xong chưa tạo lớp nào",
                "GỌI NGAY — kẹt ngay cửa đầu, nhiều khả năng không biết bắt đầu từ đâu")
    if u.students == 0:
        return ("Có lớp nhưng chưa thêm học sinh",
                "Gọi hỏi: nhập tên thủ công có nản không? Gợi ý quét ảnh danh sách")
    aha = u.features.get("điểm danh", 0) + u.features.get("thu phí", 0) + u.features.get("báo cáo", 0)
    if aha == 0:
        return ("Đã có lớp và HS nhưng chưa làm hành động lõi nào",
                "Gọi kèm 10 phút tới 1 trong 3 aha: điểm danh · thu phí · gửi thiệp")
    if u.days_quiet >= 7:
        return (f"Im lặng {u.days_quiet} ngày sau khi đã dùng thật",
                "Nhắn hỏi thăm — người đã chạm aha rồi bỏ là mất mát lớn nhất")
    if u.features.get("báo cáo", 0) == 0 and u.active_days >= 2:
        return ("Chưa từng gửi báo cáo/thiệp cho phụ huynh",
                "Đây là tính năng khiến phụ huynh khen — chỉ họ cách gửi thiệp đầu tiên")
    return ("", "Đang dùng tốt — hỏi xin nhận xét và giới thiệu đồng nghiệp")


def user_list(session_factory) -> dict:
    """Danh sách giáo viên THẬT kèm sức khoẻ từng người."""
    s = session_factory()
    try:
        teachers = s.scalars(select(TeacherORM).order_by(TeacherORM.created_at)).all()
        out: list[UserHealth] = []
        excluded = 0
        for t in teachers:
            if not is_real(t):
                excluded += 1
                continue
            cids = [c.id for c in s.scalars(
                select(ClassORM).where(ClassORM.teacher_id == t.id)).all()]
            n_stu = (s.scalar(select(func.count()).select_from(StudentORM)
                              .where(StudentORM.class_id.in_(cids))) or 0) if cids else 0
            evs = s.scalars(select(ActivityEventORM)
                            .where(ActivityEventORM.teacher_id == t.id)).all()
            feats: dict[str, int] = {}
            for e in evs:
                f = FEATURE_OF_EVENT.get(e.kind)
                if f:
                    feats[f] = feats.get(f, 0) + 1
            stamps = sorted([t.created_at] + [e.created_at for e in evs if e.created_at])
            u = UserHealth(
                phone=t.phone, name=t.name or "(chưa đặt tên)", joined=t.created_at,
                days_since_join=(_now() - t.created_at).days,
                days_quiet=(_now() - stamps[-1]).days,
                active_days=len({x.date() for x in stamps}),
                classes=len(cids), students=n_stu, events=len(evs), features=feats,
            )
            # chặng xa nhất đã đi tới
            if feats.get("báo cáo") or feats.get("gửi thiệp"):
                u.stage = "báo cáo"
            elif feats.get("thu phí"):
                u.stage = "thu phí"
            elif feats.get("điểm danh"):
                u.stage = "điểm danh"
            elif n_stu:
                u.stage = "thêm HS"
            elif cids:
                u.stage = "tạo lớp"
            u.stuck, u.action = _diagnose(u)
            out.append(u)
    finally:
        s.close()

    out.sort(key=lambda u: (-u.active_days, u.days_quiet))
    return {
        "users": out,
        "excluded": excluded,
        "real_total": len(out),
        "real_active": sum(1 for u in out if u.active_days >= 2 and u.days_quiet <= 7),
        "stuck": [u for u in out if u.stuck],
    }


def digest_lines(session_factory) -> list[str]:
    """Khối 'Người dùng thật' cho bản tin Telegram — ai đang kẹt, ai cần gọi."""
    d = user_list(session_factory)
    users, stuck = d["users"], d["stuck"]
    lines = ["", f"<b>👥 NGƯỜI DÙNG THẬT: {d['real_total']}</b>"
                 f"  <i>({d['real_active']} đang dùng đều · bỏ qua {d['excluded']} acc thử/seed)</i>"]
    if not users:
        lines.append("• Chưa có ai — mọi tài khoản hiện tại là acc thử, seed hoặc tester đổi chéo")
        return lines

    for u in users:
        feat = " · ".join(f"{k} {v}" for k, v in sorted(u.features.items(), key=lambda x: -x[1])) or "chưa dùng gì"
        quiet = "hôm nay" if u.days_quiet == 0 else f"{u.days_quiet}n trước"
        lines.append(f"• <b>{u.name}</b> ({u.phone}) — {u.classes} lớp · {u.students} HS · "
                     f"{u.active_days} ngày dùng · gần nhất {quiet}")
        lines.append(f"    <i>{feat}</i>")
    if stuck:
        lines.append("")
        lines.append("<b>⚠️ Cần gọi</b>")
        for u in stuck:
            lines.append(f"• <b>{u.name}</b>: {u.stuck}")
            lines.append(f"    → {u.action}")
    return lines
