"""Activation event log — đo phễu kích hoạt GV (mục tiêu đo lường BƯỚC 1 GTM).

Nguyên tắc an toàn: ghi event bằng SESSION RIÊNG và NUỐT MỌI LỖI. Việc log tuyệt đối
không được làm hỏng action lõi (tạo lớp, điểm danh, thu phí...) dù DB event trục trặc.
"""
from __future__ import annotations

import uuid
import logging
from datetime import datetime, timedelta
from typing import Callable

from sqlalchemy.orm import Session
from sqlalchemy import select, func, distinct

from daythem.adapters.orm import ActivityEventORM, TeacherORM

logger = logging.getLogger("daythem.activity")

SessionFactory = Callable[[], Session]

# Hành động "lõi" = GV đã chạm vào giá trị thật của app.
CORE_KINDS = (
    "attendance_submitted",
    "tuition_paid",
    "report_generated",
    "students_bulk_added",
    "thiep_shared",
)

# Toàn bộ event hợp lệ (server-observed + client-reported).
ALLOWED_KINDS = ("class_created",) + CORE_KINDS + ("report_zalo_opened",)


def record_event(session_factory: SessionFactory, teacher_id: str, kind: str) -> None:
    """Ghi 1 event kích hoạt. An toàn tuyệt đối: lỗi được nuốt, không ném ra ngoài."""
    if not teacher_id or kind not in ALLOWED_KINDS:
        return
    try:
        session = session_factory()
        try:
            session.add(ActivityEventORM(id=str(uuid.uuid4()), teacher_id=teacher_id, kind=kind))
            session.commit()
        finally:
            session.close()
    except Exception:
        logger.warning("record_event bỏ qua (kind=%s) — không chặn action lõi", kind)


def north_star(session_factory: SessionFactory, weeks: int = 4) -> dict:
    """★ NORTH STAR — số GV làm ít nhất 1 việc LÕI trong 7 ngày qua (WAT).

    Khác `activation_funnel` (số cộng dồn từ trước tới nay): đây là số ĐANG SỐNG —
    trả lời câu sinh tử của beta: GV thật có tiếp tục dùng trong tuần dạy thật không?
    Trả thêm chuỗi mấy tuần gần đây để thấy xu hướng, và tên GV đang hoạt động.
    """
    session = session_factory()
    try:
        now = datetime.utcnow()

        def wat_between(start, end) -> set[str]:
            rows = session.scalars(
                select(distinct(ActivityEventORM.teacher_id)).where(
                    ActivityEventORM.kind.in_(CORE_KINDS),
                    ActivityEventORM.created_at >= start,
                    ActivityEventORM.created_at < end,
                )
            ).all()
            return set(rows)

        cur = wat_between(now - timedelta(days=7), now)
        prev = wat_between(now - timedelta(days=14), now - timedelta(days=7))

        # Chuỗi N tuần gần nhất (cũ → mới) để nhìn xu hướng.
        series = []
        for i in range(weeks - 1, -1, -1):
            s = now - timedelta(days=7 * (i + 1))
            e = now - timedelta(days=7 * i)
            series.append({"weeks_ago": i, "wat": len(wat_between(s, e))})

        # Tên GV đang hoạt động (để biết đang kèm ai, ai vừa rớt).
        names = []
        if cur:
            names = [
                n or "(chưa đặt tên)"
                for n in session.scalars(
                    select(TeacherORM.name).where(TeacherORM.id.in_(cur))
                ).all()
            ]

        return {
            "wat": len(cur),
            "wat_prev": len(prev),
            "delta": len(cur) - len(prev),
            "target_min": 10,
            "target_max": 15,
            "series": series,
            "active_names": names,
            "definition": "Số GV làm ≥1 việc lõi (điểm danh · thu phí · báo cáo · thêm HS · gửi thiệp) trong 7 ngày qua",
        }
    finally:
        session.close()


def activation_funnel(session_factory: SessionFactory) -> dict:
    """Phễu kích hoạt: % GV tạo lớp, làm hành động lõi, và kích hoạt trong 24h đầu."""
    session = session_factory()
    try:
        total = session.scalar(select(func.count(TeacherORM.id))) or 0

        def teachers_with(kinds: tuple[str, ...]) -> set[str]:
            rows = session.scalars(
                select(distinct(ActivityEventORM.teacher_id)).where(ActivityEventORM.kind.in_(kinds))
            ).all()
            return set(rows)

        created = teachers_with(("class_created",))
        core = teachers_with(CORE_KINDS)

        # Thời điểm đăng ký của từng GV.
        signups = {tid: ts for tid, ts in session.execute(
            select(TeacherORM.id, TeacherORM.created_at)
        ).all()}

        activated_24h = 0
        for tid in core:
            first_core = session.scalar(
                select(func.min(ActivityEventORM.created_at)).where(
                    ActivityEventORM.teacher_id == tid,
                    ActivityEventORM.kind.in_(CORE_KINDS),
                )
            )
            su = signups.get(tid)
            if first_core and su and first_core <= su + timedelta(hours=24):
                activated_24h += 1

        # Đếm số event theo loại (để nhìn hành vi nào đang được dùng).
        by_kind = {
            k: (session.scalar(select(func.count(ActivityEventORM.id)).where(ActivityEventORM.kind == k)) or 0)
            for k in ALLOWED_KINDS
        }

        def pct(n: int) -> float:
            return round(100 * n / total, 1) if total else 0.0

        return {
            "total_teachers": total,
            "created_class": len(created),
            "created_class_pct": pct(len(created)),
            "did_core_action": len(core),
            "did_core_action_pct": pct(len(core)),
            "activated_24h": activated_24h,
            "activated_24h_pct": pct(activated_24h),
            "events_by_kind": by_kind,
        }
    finally:
        session.close()
