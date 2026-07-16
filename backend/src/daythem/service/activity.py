"""Activation event log — đo phễu kích hoạt GV (mục tiêu đo lường BƯỚC 1 GTM).

Nguyên tắc an toàn: ghi event bằng SESSION RIÊNG và NUỐT MỌI LỖI. Việc log tuyệt đối
không được làm hỏng action lõi (tạo lớp, điểm danh, thu phí...) dù DB event trục trặc.
"""
from __future__ import annotations

import uuid
import logging
from datetime import timedelta
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
