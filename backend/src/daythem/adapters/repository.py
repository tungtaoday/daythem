from typing import Optional
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select, and_
from daythem.adapters.orm import (
    TeacherORM, ClassORM, StudentORM, StudentFeeORM,
    AttendanceSessionORM, AttendanceRecordORM,
    TuitionORM, AnnouncementORM, MakeupORM, MakeupVoteORM,
    ReportORM, OTPORM,
)


class TeacherRepository:
    def __init__(self, session: Session):
        self.session = session

    def add(self, teacher: TeacherORM) -> None:
        self.session.add(teacher)

    def get(self, id: str) -> Optional[TeacherORM]:
        return self.session.get(TeacherORM, id)

    def get_by_phone(self, phone: str) -> Optional[TeacherORM]:
        return self.session.scalar(select(TeacherORM).where(TeacherORM.phone == phone))


class ClassRepository:
    def __init__(self, session: Session):
        self.session = session

    def add(self, klass: ClassORM) -> None:
        self.session.add(klass)

    def get(self, id: str) -> Optional[ClassORM]:
        return self.session.get(ClassORM, id)

    def list_by_teacher(self, teacher_id: str) -> list[ClassORM]:
        return list(self.session.scalars(
            select(ClassORM)
            .where(and_(ClassORM.teacher_id == teacher_id, ClassORM.archived == False))
            .order_by(ClassORM.created_at)
        ))


class StudentRepository:
    def __init__(self, session: Session):
        self.session = session

    def add(self, student: StudentORM) -> None:
        self.session.add(student)

    def get(self, id: str) -> Optional[StudentORM]:
        return self.session.scalar(
            select(StudentORM)
            .options(selectinload(StudentORM.fee_setting))
            .where(StudentORM.id == id)
        )

    def list_by_class(self, class_id: str) -> list[StudentORM]:
        return list(self.session.scalars(
            select(StudentORM)
            .options(selectinload(StudentORM.fee_setting))
            .where(and_(StudentORM.class_id == class_id, StudentORM.archived == False))
            .order_by(StudentORM.name)
        ))


class StudentFeeRepository:
    def __init__(self, session: Session):
        self.session = session

    def add(self, fee: StudentFeeORM) -> None:
        self.session.add(fee)

    def get_by_student(self, student_id: str) -> Optional[StudentFeeORM]:
        return self.session.scalar(select(StudentFeeORM).where(StudentFeeORM.student_id == student_id))


class AttendanceRepository:
    def __init__(self, session: Session):
        self.session = session

    def add_session(self, sess: AttendanceSessionORM) -> None:
        self.session.add(sess)

    def _session_opts(self):
        return selectinload(AttendanceSessionORM.records).selectinload(AttendanceRecordORM.student)

    def get_session(self, id: str) -> Optional[AttendanceSessionORM]:
        return self.session.scalar(
            select(AttendanceSessionORM).options(self._session_opts()).where(AttendanceSessionORM.id == id)
        )

    def get_session_by_date(self, class_id: str, date: str) -> Optional[AttendanceSessionORM]:
        return self.session.scalar(
            select(AttendanceSessionORM)
            .options(self._session_opts())
            .where(and_(AttendanceSessionORM.class_id == class_id, AttendanceSessionORM.session_date == date))
        )

    def list_sessions(self, class_id: str) -> list[AttendanceSessionORM]:
        return list(self.session.scalars(
            select(AttendanceSessionORM)
            .options(self._session_opts())
            .where(AttendanceSessionORM.class_id == class_id)
            .order_by(AttendanceSessionORM.session_date.desc())
        ))


class TuitionRepository:
    def __init__(self, session: Session):
        self.session = session

    def add(self, tuition: TuitionORM) -> None:
        self.session.add(tuition)

    def get(self, id: str) -> Optional[TuitionORM]:
        return self.session.get(TuitionORM, id)

    def get_by_student_month(self, student_id: str, month: str) -> Optional[TuitionORM]:
        return self.session.scalar(
            select(TuitionORM)
            .options(selectinload(TuitionORM.student))
            .where(and_(TuitionORM.student_id == student_id, TuitionORM.month == month))
        )

    def list_by_class_month(self, class_id: str, month: str) -> list[TuitionORM]:
        return list(self.session.scalars(
            select(TuitionORM)
            .options(selectinload(TuitionORM.student))
            .where(and_(TuitionORM.class_id == class_id, TuitionORM.month == month))
        ))


class AnnouncementRepository:
    def __init__(self, session: Session):
        self.session = session

    def add(self, ann: AnnouncementORM) -> None:
        self.session.add(ann)

    def _ann_opts(self):
        return selectinload(AnnouncementORM.makeup).selectinload(MakeupORM.votes)

    def get(self, id: str) -> Optional[AnnouncementORM]:
        return self.session.scalar(
            select(AnnouncementORM).options(self._ann_opts()).where(AnnouncementORM.id == id)
        )

    def list_by_class(self, class_id: str) -> list[AnnouncementORM]:
        return list(self.session.scalars(
            select(AnnouncementORM)
            .options(self._ann_opts())
            .where(AnnouncementORM.class_id == class_id)
            .order_by(AnnouncementORM.created_at.desc())
        ))


class MakeupRepository:
    def __init__(self, session: Session):
        self.session = session

    def add(self, makeup: MakeupORM) -> None:
        self.session.add(makeup)

    def add_vote(self, vote: MakeupVoteORM) -> None:
        self.session.add(vote)

    def get(self, id: str) -> Optional[MakeupORM]:
        return self.session.scalar(
            select(MakeupORM).options(selectinload(MakeupORM.votes)).where(MakeupORM.id == id)
        )

    def count_votes(self, makeup_id: str, option_index: int) -> int:
        from sqlalchemy import func
        return self.session.scalar(
            select(func.count(MakeupVoteORM.id))
            .where(and_(MakeupVoteORM.makeup_id == makeup_id, MakeupVoteORM.option_index == option_index))
        ) or 0


class ReportRepository:
    def __init__(self, session: Session):
        self.session = session

    def add(self, report: ReportORM) -> None:
        self.session.add(report)

    def get(self, id: str) -> Optional[ReportORM]:
        return self.session.get(ReportORM, id)

    def list_by_class(self, class_id: str) -> list[ReportORM]:
        return list(self.session.scalars(
            select(ReportORM)
            .where(ReportORM.class_id == class_id)
            .order_by(ReportORM.generated_at.desc())
        ))


class OTPRepository:
    def __init__(self, session: Session):
        self.session = session

    def add(self, otp: OTPORM) -> None:
        self.session.add(otp)

    def get_latest(self, phone: str) -> Optional[OTPORM]:
        return self.session.scalar(
            select(OTPORM)
            .where(and_(OTPORM.phone == phone, OTPORM.used == False))
            .order_by(OTPORM.created_at.desc())
        )
