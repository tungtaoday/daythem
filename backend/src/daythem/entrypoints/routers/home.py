"""Home assistant summary — gộp số liệu để feed Home hiển thị việc cụ thể.

Một lần gọi trả về:
- unpaid: số phụ huynh CHƯA nộp học phí tháng này + tổng còn thiếu
- at_risk: học sinh vắng LIÊN TIẾP gần đây (nguy cơ bỏ học)

Tránh để mobile gọi tuition/attendance từng lớp (N+1) mỗi lần mở Home.
"""
from fastapi import APIRouter, Depends
from daythem.entrypoints.deps import get_uow, get_current_teacher
from daythem.service.handlers import _vn_month
from daythem.service.unit_of_work import SqlAlchemyUnitOfWork
from daythem.adapters.orm import TeacherORM

router = APIRouter(tags=["home"])

# Số buổi gần nhất còn được coi là "liên tiếp"; vắng >= ngưỡng này thì cảnh báo.
RISK_STREAK = 2
# Giới hạn danh sách trả về để feed gọn.
MAX_AT_RISK = 5


def _fee_amount(student, klass) -> float:
    """Học phí phải nộp của 1 học sinh (theo fee_setting, fallback default_fee)."""
    fee = student.fee_setting
    if fee and fee.fee_type == "free":
        return 0
    if fee and fee.fee_type in ("discount", "custom") and fee.amount is not None:
        return fee.amount
    return klass.default_fee


def _absent_streak(student_id: str, sessions_desc: list) -> int:
    """Đếm số buổi vắng liên tiếp tính từ buổi gần nhất trở về trước.

    Dừng ngay khi gặp buổi có mặt HOẶC buổi không có bản ghi cho học sinh
    (học sinh có thể mới vào lớp) — chỉ tính chuỗi vắng đang tiếp diễn.
    """
    streak = 0
    for sess in sessions_desc:
        rec = next((r for r in sess.records if r.student_id == student_id), None)
        if rec is None:
            break
        if rec.present:
            break
        streak += 1
    return streak


@router.get("/home/summary")
def home_summary(
    teacher: TeacherORM = Depends(get_current_teacher),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
):
    month = _vn_month()
    with uow:
        classes = uow.classes.list_by_teacher(teacher.id)  # chỉ lớp đang hoạt động

        unpaid_count = 0
        unpaid_amount = 0.0
        at_risk: list[dict] = []

        for klass in classes:
            students = uow.students.list_by_class(klass.id)
            if not students:
                continue

            # ── Học phí chưa nộp tháng này ──
            tuitions = uow.tuitions.list_by_class_month(klass.id, month)
            paid_by_student = {t.student_id: t for t in tuitions}
            for stu in students:
                amount = _fee_amount(stu, klass)
                if amount <= 0:  # miễn phí → bỏ qua
                    continue
                t = paid_by_student.get(stu.id)
                if t is not None and t.paid:
                    continue
                unpaid_count += 1
                unpaid_amount += t.amount if t is not None else amount

            # ── Vắng liên tiếp (nguy cơ bỏ học) ──
            sessions = uow.attendance.list_sessions(klass.id)  # DESC theo ngày
            if len(sessions) < RISK_STREAK:
                continue
            for stu in students:
                streak = _absent_streak(stu.id, sessions)
                if streak >= RISK_STREAK:
                    at_risk.append({
                        "student_id": stu.id,
                        "name": stu.name,
                        "class_id": klass.id,
                        "class_name": klass.name,
                        "absent_streak": streak,
                    })

        at_risk.sort(key=lambda x: -x["absent_streak"])

        return {
            "month": month,
            "unpaid": {"count": unpaid_count, "amount": unpaid_amount},
            "at_risk": at_risk[:MAX_AT_RISK],
            "at_risk_total": len(at_risk),
        }
