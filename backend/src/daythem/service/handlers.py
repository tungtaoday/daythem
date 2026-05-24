import uuid
import random
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from pydantic import BaseModel


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


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
from daythem.adapters.orm import (
    TeacherORM, ClassORM, StudentORM, StudentFeeORM,
    AttendanceSessionORM, AttendanceRecordORM,
    TuitionORM, AnnouncementORM, MakeupORM, MakeupVoteORM,
    ReportORM, OTPORM,
)
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
    name: str
    avatar_url: Optional[str] = None

class CreateClassCommand(BaseModel):
    teacher_id: str
    name: str
    subject: str
    grade: str
    schedule: Optional[dict] = None
    default_fee: float = 0
    fee_type: str = "monthly"

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
    code = "123456" if True else str(random.randint(100000, 999999))
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
    with uow:
        teacher = uow.teachers.get_by_phone(cmd.phone)
        if not teacher:
            teacher = TeacherORM(
                id=str(uuid.uuid4()),
                phone=cmd.phone,
                password_hash=_hash_password(cmd.password),
            )
            uow.teachers.add(teacher)
        elif teacher.password_hash is None:
            teacher.password_hash = _hash_password(cmd.password)
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
        teacher.name = cmd.name
        if cmd.avatar_url:
            teacher.avatar_url = cmd.avatar_url
        uow.commit()
        uow._session.refresh(teacher)
        return teacher


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
            fee = student.fee_setting
            amount = cmd.amount
            if amount is None:
                if fee and fee.fee_type == "free":
                    amount = 0
                elif fee and fee.fee_type in ("discount", "custom") and fee.amount is not None:
                    amount = fee.amount
                else:
                    klass = uow.classes.get(cmd.class_id)
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
        tuition.paid_date = _now().date().isoformat() if cmd.paid else None
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
        makeup.confirmed_option = cmd.option_index
        ann = uow.announcements.get(makeup.announcement_id)
        if ann:
            ann.status = "confirmed"
        uow.commit()
        return uow.makeups.get(cmd.makeup_id)


def handle_generate_report(cmd: GenerateReportCommand, uow: SqlAlchemyUnitOfWork) -> ReportORM:
    with uow:
        klass = uow.classes.get(cmd.class_id)
        students = uow.students.list_by_class(cmd.class_id)

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
            tuition = uow.tuitions.get_by_student_month(student.id, cmd.week_start[:7])
            student_data.append({
                "student_id": student.id,
                "name": student.name,
                "parent_name": student.parent_name,
                "parent_phone": student.parent_phone,
                "sessions_attended": attended,
                "sessions_total": len(sessions),
                "tuition_paid": tuition.paid if tuition else False,
                "tuition_amount": tuition.amount if tuition else klass.default_fee,
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
