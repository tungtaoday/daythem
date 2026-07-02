import uuid
import random
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from pydantic import BaseModel


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _vn_now() -> datetime:
    """Current time in Vietnam local time (UTC+TZ_OFFSET_HOURS), naive."""
    return (datetime.now(timezone.utc) + timedelta(hours=settings.TZ_OFFSET_HOURS)).replace(tzinfo=None)


def _vn_month() -> str:
    return _vn_now().strftime("%Y-%m")


def _hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000)
    return f"{salt}:{key.hex()}"


def _verify_password(password: str, stored: str) -> bool:
    try:
        salt, key_hex = stored.split(":", 1)
        key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000)
        return secrets.compare_digest(key.hex(), key_hex)
    except Exception:
        return False
from sqlalchemy import delete, select
from daythem.adapters.orm import (
    TeacherORM, ClassORM, StudentORM, StudentFeeORM,
    AttendanceSessionORM, AttendanceRecordORM,
    TuitionORM, AnnouncementORM, MakeupORM, MakeupVoteORM,
    ReportORM, OTPORM, NotifEventORM,
)
from daythem.config import settings
from daythem.service.unit_of_work import SqlAlchemyUnitOfWork


# ── Commands ────────────────────────────────────────────────────────────────

class RequestOTPCommand(BaseModel):
    phone: str

class VerifyOTPCommand(BaseModel):
    phone: str
    code: str

class LoginWithPasswordCommand(BaseModel):
    phone: str
    password: str

class UpdateProfileCommand(BaseModel):
    teacher_id: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    push_token: Optional[str] = None
    notif_attendance: Optional[bool] = None
    notif_tuition: Optional[bool] = None
    notif_report: Optional[bool] = None
    dnd_start: Optional[str] = None
    dnd_end: Optional[str] = None
    tax_id: Optional[str] = None
    full_legal_name: Optional[str] = None
    id_number: Optional[str] = None
    date_of_birth: Optional[str] = None
    address: Optional[str] = None

class GetTaxSummaryCommand(BaseModel):
    teacher_id: str
    year: int

class GetTaxDeclarationCommand(BaseModel):
    teacher_id: str
    year: int

class CreateClassCommand(BaseModel):
    teacher_id: str
    name: str
    subject: str
    grade: str
    schedule: Optional[dict] = None
    default_fee: float = 0
    fee_type: str = "month"
    color: Optional[str] = None

class UpdateClassCommand(BaseModel):
    class_id: str
    teacher_id: str
    name: Optional[str] = None
    subject: Optional[str] = None
    grade: Optional[str] = None
    schedule: Optional[dict] = None
    default_fee: Optional[float] = None
    fee_type: Optional[str] = None
    zalo_group_id: Optional[str] = None
    color: Optional[str] = None
    archived: Optional[bool] = None

class AddStudentCommand(BaseModel):
    class_id: str
    name: str
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    note: Optional[str] = None

class UpdateStudentCommand(BaseModel):
    student_id: str
    name: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    note: Optional[str] = None

class RecordAttendanceCommand(BaseModel):
    class_id: str
    session_date: str
    records: list[dict]  # [{student_id, present, absence_reason?}]
    notes: Optional[str] = None

class RecordPaymentCommand(BaseModel):
    class_id: str
    student_id: str
    month: str
    paid: bool
    amount: Optional[float] = None

class SetStudentFeeCommand(BaseModel):
    student_id: str
    class_id: str
    fee_type: str  # default/discount/free/custom
    amount: Optional[float] = None
    note: Optional[str] = None

class CancelClassCommand(BaseModel):
    class_id: str
    session_date: str
    content: str
    propose_makeup: bool = False

class ProposeMakeupCommand(BaseModel):
    announcement_id: str
    options: list[dict]  # [{date, time, label}]

class VoteMakeupCommand(BaseModel):
    makeup_id: str
    option_index: int
    voter_name: str

class ConfirmMakeupCommand(BaseModel):
    makeup_id: str
    option_index: int

class GenerateReportCommand(BaseModel):
    class_id: str
    week_start: str


# ── Handlers ─────────────────────────────────────────────────────────────────

def handle_request_otp(cmd: RequestOTPCommand, uow: SqlAlchemyUnitOfWork) -> str:
    code = "123456" if settings.OTP_DEV_MODE else str(random.randint(100000, 999999))
    otp = OTPORM(
        id=str(uuid.uuid4()),
        phone=cmd.phone,
        code=code,
        expires_at=_now() + timedelta(minutes=10),
    )
    with uow:
        uow.otps.add(otp)
        uow.commit()
    return code


def handle_verify_otp(cmd: VerifyOTPCommand, uow: SqlAlchemyUnitOfWork) -> TeacherORM:
    with uow:
        otp = uow.otps.get_latest(cmd.phone)
        if not otp or otp.code != cmd.code or otp.expires_at < _now():
            raise ValueError("OTP không hợp lệ hoặc đã hết hạn")
        otp.used = True

        teacher = uow.teachers.get_by_phone(cmd.phone)
        if not teacher:
            teacher = TeacherORM(id=str(uuid.uuid4()), phone=cmd.phone)
            uow.teachers.add(teacher)

        uow.commit()
        uow._session.refresh(teacher)
        return teacher


def handle_login_with_password(cmd: LoginWithPasswordCommand, uow: SqlAlchemyUnitOfWork) -> TeacherORM:
    if len(cmd.password) < 6:
        raise ValueError("Mật khẩu phải có ít nhất 6 ký tự")
    with uow:
        teacher = uow.teachers.get_by_phone(cmd.phone)
        if not teacher:
            # New phone → register a new account with this password.
            teacher = TeacherORM(
                id=str(uuid.uuid4()),
                phone=cmd.phone,
                password_hash=_hash_password(cmd.password),
            )
            uow.teachers.add(teacher)
        elif teacher.password_hash is None:
            # Existing account created via OTP and has no password yet.
            # Do NOT silently claim it with an arbitrary password (account-takeover
            # vector). Require OTP verification to prove phone ownership instead.
            raise ValueError("Tài khoản này cần đăng nhập bằng mã OTP gửi qua điện thoại")
        else:
            if not _verify_password(cmd.password, teacher.password_hash):
                raise ValueError("Mật khẩu không đúng")
        uow.commit()
        uow._session.refresh(teacher)
        return teacher


def handle_update_profile(cmd: UpdateProfileCommand, uow: SqlAlchemyUnitOfWork) -> TeacherORM:
    with uow:
        teacher = uow.teachers.get(cmd.teacher_id)
        if not teacher:
            raise ValueError("Teacher not found")
        if cmd.name is not None: teacher.name = cmd.name
        if cmd.avatar_url is not None: teacher.avatar_url = cmd.avatar_url
        if cmd.push_token is not None: teacher.push_token = cmd.push_token
        if cmd.notif_attendance is not None: teacher.notif_attendance = cmd.notif_attendance
        if cmd.notif_tuition is not None: teacher.notif_tuition = cmd.notif_tuition
        if cmd.notif_report is not None: teacher.notif_report = cmd.notif_report
        if cmd.dnd_start is not None: teacher.dnd_start = cmd.dnd_start
        if cmd.dnd_end is not None: teacher.dnd_end = cmd.dnd_end
        if cmd.tax_id is not None: teacher.tax_id = cmd.tax_id
        if cmd.full_legal_name is not None: teacher.full_legal_name = cmd.full_legal_name
        if cmd.id_number is not None: teacher.id_number = cmd.id_number
        if cmd.date_of_birth is not None: teacher.date_of_birth = cmd.date_of_birth
        if cmd.address is not None: teacher.address = cmd.address
        uow.commit()
        uow._session.refresh(teacher)
        return teacher


_TAX_RATE = settings.TAX_RATE  # 2% thuế TNCN cá nhân kinh doanh


def _tax_threshold(year: int) -> float:
    if year == 2025:
        return settings.TAX_THRESHOLD_2025
    return settings.TAX_THRESHOLD_DEFAULT


def _compute_tax(total: float, threshold: float) -> tuple[float, float, str]:
    """VN cá nhân kinh doanh: doanh thu ≤ ngưỡng → miễn; TRÊN ngưỡng → tính thuế trên
    TOÀN BỘ doanh thu (ngưỡng là mốc miễn, không phải khoản được trừ).
    Returns (taxable_amount, tax_owed, status)."""
    if total > threshold:
        return total, total * _TAX_RATE, "taxable"
    return 0.0, 0.0, "exempt"


def handle_get_tax_summary(cmd: GetTaxSummaryCommand, uow: SqlAlchemyUnitOfWork) -> dict:
    with uow:
        tuitions = uow.tuitions.list_paid_by_teacher_year(cmd.teacher_id, cmd.year)
        threshold = _tax_threshold(cmd.year)

        by_month: dict[str, float] = {}
        by_class: dict[str, dict] = {}
        for t in tuitions:
            by_month[t.month] = by_month.get(t.month, 0) + t.amount
            if t.class_id not in by_class:
                by_class[t.class_id] = {"class_name": t.class_.name, "amount": 0.0}
            by_class[t.class_id]["amount"] += t.amount

        total = sum(by_month.values())
        taxable, tax_owed, status = _compute_tax(total, threshold)

        by_month_list = [{"month": m, "amount": a} for m, a in sorted(by_month.items())]
        by_class_list = sorted(by_class.values(), key=lambda x: x["amount"], reverse=True)

        if status == "exempt":
            summary_text = (
                f"Tổng thu {total:,.0f}đ — chưa cần nộp thuế TNCN"
                f" (ngưỡng {threshold:,.0f}đ/năm)"
            )
        else:
            summary_text = (
                f"Thuế TNCN cần nộp: {tax_owed:,.0f}đ"
                f" (2% × toàn bộ doanh thu {total:,.0f}đ do vượt ngưỡng {threshold:,.0f}đ)"
            )

        return {
            "year": cmd.year,
            "total_collected": total,
            "threshold": threshold,
            "taxable_amount": taxable,
            "tax_owed": tax_owed,
            "status": status,
            "by_month": by_month_list,
            "by_class": by_class_list,
            "summary_text": summary_text,
        }


def handle_get_tax_declaration(cmd: GetTaxDeclarationCommand, uow: SqlAlchemyUnitOfWork) -> dict:
    with uow:
        teacher = uow.teachers.get(cmd.teacher_id)
        if not teacher or not teacher.tax_id:
            raise ValueError("Cần nhập MST (Mã số thuế) trước khi tạo tờ khai")

        tuitions = uow.tuitions.list_paid_by_teacher_year(cmd.teacher_id, cmd.year)
        threshold = _tax_threshold(cmd.year)
        total = sum(t.amount for t in tuitions)
        taxable, tax_owed, _status = _compute_tax(total, threshold)

        fields = {
            "mst": teacher.tax_id,
            "full_name": teacher.full_legal_name or teacher.name or "",
            "id_number": teacher.id_number or "",
            "date_of_birth": teacher.date_of_birth or "",
            "address": teacher.address or "",
            "year": cmd.year,
            "tong_thu_nhap": total,
            "nguong_mien_thue": threshold,
            "thu_nhap_chiu_thue": taxable,
            "thue_suat": _TAX_RATE,
            "so_thue_phai_nop": tax_owed,
        }

        status_text = (
            "Không phát sinh nghĩa vụ thuế" if tax_owed == 0
            else f"Cần nộp thuế: {tax_owed:,.0f}đ"
        )

        declaration_text = (
            f"TỜ KHAI THUẾ THU NHẬP CÁ NHÂN\n"
            f"Mẫu 09/KK-TNCN (Dành cho cá nhân có thu nhập từ kinh doanh)\n\n"
            f"Kỳ tính thuế: Năm {cmd.year}\n"
            f"Họ và tên: {fields['full_name']}\n"
            f"MST: {teacher.tax_id}\n"
            f"CMND/CCCD: {fields['id_number'] or '...'}\n"
            f"Ngày sinh: {fields['date_of_birth'] or '...'}\n"
            f"Địa chỉ: {fields['address'] or '...'}\n\n"
            f"Tổng doanh thu: {total:,.0f}đ\n"
            f"Ngưỡng miễn thuế: {threshold:,.0f}đ\n"
            f"Thu nhập chịu thuế: {taxable:,.0f}đ\n"
            f"Thuế suất: {_TAX_RATE*100:.0f}%\n"
            f"Số thuế phải nộp: {tax_owed:,.0f}đ\n\n"
            f"{status_text}"
        )

        return {"year": cmd.year, "fields": fields, "declaration_text": declaration_text}


def handle_create_class(cmd: CreateClassCommand, uow: SqlAlchemyUnitOfWork) -> ClassORM:
    klass = ClassORM(
        id=str(uuid.uuid4()),
        teacher_id=cmd.teacher_id,
        name=cmd.name,
        subject=cmd.subject,
        grade=cmd.grade,
        schedule=cmd.schedule,
        default_fee=cmd.default_fee,
        fee_type=cmd.fee_type,
        color=cmd.color,
    )
    with uow:
        uow.classes.add(klass)
        uow.commit()
        uow._session.refresh(klass)
        return klass


def handle_update_class(cmd: UpdateClassCommand, uow: SqlAlchemyUnitOfWork) -> ClassORM:
    with uow:
        klass = uow.classes.get(cmd.class_id)
        if not klass or klass.teacher_id != cmd.teacher_id:
            raise ValueError("Class not found")
        if cmd.name is not None: klass.name = cmd.name
        if cmd.subject is not None: klass.subject = cmd.subject
        if cmd.grade is not None: klass.grade = cmd.grade
        if cmd.schedule is not None: klass.schedule = cmd.schedule
        if cmd.default_fee is not None: klass.default_fee = cmd.default_fee
        if cmd.fee_type is not None: klass.fee_type = cmd.fee_type
        if cmd.zalo_group_id is not None: klass.zalo_group_id = cmd.zalo_group_id
        if cmd.color is not None: klass.color = cmd.color
        if cmd.archived is not None: klass.archived = cmd.archived
        uow.commit()
        uow._session.refresh(klass)
        return klass


def handle_add_student(cmd: AddStudentCommand, uow: SqlAlchemyUnitOfWork) -> StudentORM:
    student = StudentORM(
        id=str(uuid.uuid4()),
        class_id=cmd.class_id,
        name=cmd.name,
        parent_name=cmd.parent_name,
        parent_phone=cmd.parent_phone,
        note=cmd.note,
    )
    with uow:
        uow.students.add(student)
        uow.commit()
        student = uow.students.get(student.id)  # reload with eager-loaded fee_setting
        return student


def handle_update_student(cmd: UpdateStudentCommand, uow: SqlAlchemyUnitOfWork) -> StudentORM:
    with uow:
        student = uow.students.get(cmd.student_id)
        if not student:
            raise ValueError("Student not found")
        if cmd.name is not None: student.name = cmd.name
        if cmd.parent_name is not None: student.parent_name = cmd.parent_name
        if cmd.parent_phone is not None: student.parent_phone = cmd.parent_phone
        if cmd.note is not None: student.note = cmd.note
        uow.commit()
        return uow.students.get(cmd.student_id)


def handle_record_attendance(cmd: RecordAttendanceCommand, uow: SqlAlchemyUnitOfWork) -> AttendanceSessionORM:
    with uow:
        existing = uow.attendance.get_session_by_date(cmd.class_id, cmd.session_date)
        if existing:
            existing.records.clear()
            session = existing
        else:
            session = AttendanceSessionORM(
                id=str(uuid.uuid4()),
                class_id=cmd.class_id,
                session_date=cmd.session_date,
                notes=cmd.notes,
            )
            uow.attendance.add_session(session)

        for r in cmd.records:
            record = AttendanceRecordORM(
                id=str(uuid.uuid4()),
                session_id=session.id,
                student_id=r["student_id"],
                present=r.get("present", True),
                absence_reason=r.get("absence_reason"),
            )
            uow._session.add(record)

        uow.commit()
        return uow.attendance.get_session(session.id)


def handle_record_payment(cmd: RecordPaymentCommand, uow: SqlAlchemyUnitOfWork) -> TuitionORM:
    with uow:
        tuition = uow.tuitions.get_by_student_month(cmd.student_id, cmd.month)
        if not tuition:
            student = uow.students.get(cmd.student_id)
            if not student:
                raise ValueError("Không tìm thấy học sinh")
            fee = student.fee_setting
            amount = cmd.amount
            if amount is None:
                if fee and fee.fee_type == "free":
                    amount = 0
                elif fee and fee.fee_type in ("discount", "custom") and fee.amount is not None:
                    amount = fee.amount
                else:
                    klass = uow.classes.get(cmd.class_id)
                    if not klass:
                        raise ValueError("Không tìm thấy lớp")
                    amount = klass.default_fee
            tuition = TuitionORM(
                id=str(uuid.uuid4()),
                class_id=cmd.class_id,
                student_id=cmd.student_id,
                month=cmd.month,
                amount=amount,
            )
            uow.tuitions.add(tuition)

        tuition.paid = cmd.paid
        tuition.paid_date = _vn_now().date().isoformat() if cmd.paid else None
        uow.commit()
        return uow.tuitions.get_by_student_month(cmd.student_id, tuition.month)


def handle_set_student_fee(cmd: SetStudentFeeCommand, uow: SqlAlchemyUnitOfWork) -> StudentFeeORM:
    with uow:
        fee = uow.fees.get_by_student(cmd.student_id)
        if not fee:
            fee = StudentFeeORM(id=str(uuid.uuid4()), student_id=cmd.student_id)
            uow.fees.add(fee)
        fee.fee_type = cmd.fee_type
        fee.amount = cmd.amount
        fee.note = cmd.note
        fee.updated_at = _now()
        uow.commit()
        uow._session.refresh(fee)
        return fee


def handle_cancel_class(cmd: CancelClassCommand, uow: SqlAlchemyUnitOfWork) -> AnnouncementORM:
    ann = AnnouncementORM(
        id=str(uuid.uuid4()),
        class_id=cmd.class_id,
        type="cancel",
        content=cmd.content,
        session_date=cmd.session_date,
        status="sent",
    )
    with uow:
        uow.announcements.add(ann)
        uow.commit()
        return uow.announcements.get(ann.id)


def handle_propose_makeup(cmd: ProposeMakeupCommand, uow: SqlAlchemyUnitOfWork) -> MakeupORM:
    makeup = MakeupORM(
        id=str(uuid.uuid4()),
        announcement_id=cmd.announcement_id,
        options=cmd.options,
    )
    with uow:
        uow.makeups.add(makeup)
        ann = uow.announcements.get(cmd.announcement_id)
        if ann:
            ann.status = "pending_makeup"
        uow.commit()
        return uow.makeups.get(makeup.id)


def handle_vote_makeup(cmd: VoteMakeupCommand, uow: SqlAlchemyUnitOfWork) -> MakeupORM:
    with uow:
        makeup = uow.makeups.get(cmd.makeup_id)
        if not makeup:
            raise ValueError("Makeup not found")
        if not (0 <= cmd.option_index < len(makeup.options)):
            raise ValueError("Lựa chọn không hợp lệ")
        vote = MakeupVoteORM(
            id=str(uuid.uuid4()),
            makeup_id=cmd.makeup_id,
            option_index=cmd.option_index,
            voter_name=cmd.voter_name,
        )
        uow.makeups.add_vote(vote)
        uow.commit()
        return uow.makeups.get(cmd.makeup_id)


def handle_confirm_makeup(cmd: ConfirmMakeupCommand, uow: SqlAlchemyUnitOfWork) -> MakeupORM:
    with uow:
        makeup = uow.makeups.get(cmd.makeup_id)
        if not makeup:
            raise ValueError("Makeup not found")
        if not (0 <= cmd.option_index < len(makeup.options)):
            raise ValueError("Lựa chọn không hợp lệ")
        makeup.confirmed_option = cmd.option_index
        ann = uow.announcements.get(makeup.announcement_id)
        if ann:
            ann.status = "confirmed"
        uow.commit()
        return uow.makeups.get(cmd.makeup_id)


def _expected_fee(student: StudentORM, klass: ClassORM) -> float:
    """Resolve a student's monthly fee from their per-student override, else class default."""
    fee = student.fee_setting
    if fee and fee.fee_type == "free":
        return 0
    if fee and fee.fee_type in ("discount", "custom") and fee.amount is not None:
        return fee.amount
    return klass.default_fee


def _report_month(week_start: str) -> str:
    """The month most of the report week falls in (handles weeks spanning two months)."""
    try:
        start = datetime.fromisoformat(week_start).date()
    except ValueError:
        raise ValueError("week_start không hợp lệ (định dạng YYYY-MM-DD)")
    days = [start + timedelta(days=i) for i in range(7)]
    months = [d.strftime("%Y-%m") for d in days]
    # pick the month that owns the majority of the 7 days
    return max(set(months), key=months.count)


def handle_generate_report(cmd: GenerateReportCommand, uow: SqlAlchemyUnitOfWork) -> ReportORM:
    with uow:
        klass = uow.classes.get(cmd.class_id)
        if not klass:
            raise ValueError("Không tìm thấy lớp")
        students = uow.students.list_by_class(cmd.class_id)

        report_month = _report_month(cmd.week_start)
        week_end = (datetime.fromisoformat(cmd.week_start) + timedelta(days=6)).date().isoformat()
        sessions = [
            s for s in uow.attendance.list_sessions(cmd.class_id)
            if cmd.week_start <= s.session_date <= week_end
        ]

        student_data = []
        for student in students:
            attended = sum(
                1 for s in sessions
                for r in s.records
                if r.student_id == student.id and r.present
            )
            tuition = uow.tuitions.get_by_student_month(student.id, report_month)
            student_data.append({
                "student_id": student.id,
                "name": student.name,
                "parent_name": student.parent_name,
                "parent_phone": student.parent_phone,
                "sessions_attended": attended,
                "sessions_total": len(sessions),
                "tuition_paid": tuition.paid if tuition else False,
                "tuition_amount": tuition.amount if tuition else _expected_fee(student, klass),
            })

        report = ReportORM(
            id=str(uuid.uuid4()),
            class_id=cmd.class_id,
            week_start=cmd.week_start,
            content={"students": student_data, "class_name": klass.name, "week_end": week_end},
        )
        uow.reports.add(report)
        uow.commit()
        uow._session.refresh(report)
        return report


def handle_delete_account(teacher_id: str, uow: SqlAlchemyUnitOfWork) -> None:
    """Permanently delete a teacher and ALL their data (store-required account deletion).

    Children are removed before parents to satisfy foreign-key constraints.
    """
    s = uow._session
    teacher = s.get(TeacherORM, teacher_id)
    if teacher is None:
        return

    class_ids = list(s.scalars(select(ClassORM.id).where(ClassORM.teacher_id == teacher_id)))
    student_ids = list(s.scalars(select(StudentORM.id).where(StudentORM.class_id.in_(class_ids)))) if class_ids else []
    session_ids = list(s.scalars(select(AttendanceSessionORM.id).where(AttendanceSessionORM.class_id.in_(class_ids)))) if class_ids else []
    ann_ids = list(s.scalars(select(AnnouncementORM.id).where(AnnouncementORM.class_id.in_(class_ids)))) if class_ids else []
    makeup_ids = list(s.scalars(select(MakeupORM.id).where(MakeupORM.announcement_id.in_(ann_ids)))) if ann_ids else []

    if makeup_ids:
        s.execute(delete(MakeupVoteORM).where(MakeupVoteORM.makeup_id.in_(makeup_ids)))
        s.execute(delete(MakeupORM).where(MakeupORM.id.in_(makeup_ids)))
    if ann_ids:
        s.execute(delete(AnnouncementORM).where(AnnouncementORM.id.in_(ann_ids)))
    if session_ids or student_ids:
        s.execute(delete(AttendanceRecordORM).where(
            (AttendanceRecordORM.session_id.in_(session_ids)) | (AttendanceRecordORM.student_id.in_(student_ids))
        ))
    if class_ids:
        s.execute(delete(AttendanceSessionORM).where(AttendanceSessionORM.class_id.in_(class_ids)))
        s.execute(delete(TuitionORM).where(TuitionORM.class_id.in_(class_ids)))
        s.execute(delete(ReportORM).where(ReportORM.class_id.in_(class_ids)))
    if student_ids:
        s.execute(delete(StudentFeeORM).where(StudentFeeORM.student_id.in_(student_ids)))
        s.execute(delete(StudentORM).where(StudentORM.id.in_(student_ids)))
    if class_ids:
        s.execute(delete(ClassORM).where(ClassORM.id.in_(class_ids)))
    s.execute(delete(NotifEventORM).where(NotifEventORM.teacher_id == teacher_id))
    s.execute(delete(OTPORM).where(OTPORM.phone == teacher.phone))
    s.delete(teacher)
    uow.commit()


def handle_change_password(teacher_id: str, current: str, new: str, uow: SqlAlchemyUnitOfWork) -> None:
    """Change the teacher's password after verifying the current one."""
    if len(new) < 6:
        raise ValueError("Mật khẩu mới phải có ít nhất 6 ký tự")
    with uow:
        teacher = uow.teachers.get(teacher_id)
        if not teacher:
            raise ValueError("Không tìm thấy tài khoản")
        if teacher.password_hash and not _verify_password(current, teacher.password_hash):
            raise ValueError("Mật khẩu hiện tại không đúng")
        teacher.password_hash = _hash_password(new)
        uow.commit()


def handle_reset_password(phone: str, code: str, new_password: str, uow: SqlAlchemyUnitOfWork) -> None:
    """Reset password after verifying an OTP sent to the phone (forgot-password flow)."""
    if len(new_password) < 6:
        raise ValueError("Mật khẩu mới phải có ít nhất 6 ký tự")
    with uow:
        otp = uow.otps.get_latest(phone)
        if not otp or otp.code != code or otp.expires_at < _now():
            raise ValueError("Mã OTP không hợp lệ hoặc đã hết hạn")
        otp.used = True
        teacher = uow.teachers.get_by_phone(phone)
        if not teacher:
            teacher = TeacherORM(id=str(uuid.uuid4()), phone=phone)
            uow.teachers.add(teacher)
        teacher.password_hash = _hash_password(new_password)
        uow.commit()
