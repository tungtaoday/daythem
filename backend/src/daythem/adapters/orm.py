from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Integer, Boolean, Float, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Base(DeclarativeBase):
    pass


class TeacherORM(Base):
    __tablename__ = "teachers"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    name: Mapped[Optional[str]] = mapped_column(String(100))
    avatar_url: Mapped[Optional[str]] = mapped_column(Text)
    password_hash: Mapped[Optional[str]] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    classes: Mapped[list["ClassORM"]] = relationship(back_populates="teacher", lazy="select")


class ClassORM(Base):
    __tablename__ = "classes"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    teacher_id: Mapped[str] = mapped_column(String(36), ForeignKey("teachers.id"), index=True)
    name: Mapped[str] = mapped_column(String(100))
    subject: Mapped[str] = mapped_column(String(50))
    grade: Mapped[str] = mapped_column(String(20))
    schedule: Mapped[Optional[dict]] = mapped_column(JSON)
    default_fee: Mapped[float] = mapped_column(Float, default=0)
    fee_type: Mapped[str] = mapped_column(String(20), default="monthly")
    zalo_group_id: Mapped[Optional[str]] = mapped_column(String(100))
    archived: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    teacher: Mapped["TeacherORM"] = relationship(back_populates="classes")
    students: Mapped[list["StudentORM"]] = relationship(back_populates="class_", lazy="select")
    sessions: Mapped[list["AttendanceSessionORM"]] = relationship(back_populates="class_", lazy="select")
    tuitions: Mapped[list["TuitionORM"]] = relationship(back_populates="class_", lazy="select")
    announcements: Mapped[list["AnnouncementORM"]] = relationship(back_populates="class_", lazy="select")
    reports: Mapped[list["ReportORM"]] = relationship(back_populates="class_", lazy="select")


class StudentORM(Base):
    __tablename__ = "students"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    class_id: Mapped[str] = mapped_column(String(36), ForeignKey("classes.id"), index=True)
    name: Mapped[str] = mapped_column(String(100))
    parent_name: Mapped[Optional[str]] = mapped_column(String(100))
    parent_phone: Mapped[Optional[str]] = mapped_column(String(20))
    note: Mapped[Optional[str]] = mapped_column(Text)
    archived: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    class_: Mapped["ClassORM"] = relationship(back_populates="students")
    attendance_records: Mapped[list["AttendanceRecordORM"]] = relationship(back_populates="student", lazy="select")
    tuitions: Mapped[list["TuitionORM"]] = relationship(back_populates="student", lazy="select")
    fee_setting: Mapped[Optional["StudentFeeORM"]] = relationship(back_populates="student", uselist=False, lazy="select")


class StudentFeeORM(Base):
    __tablename__ = "student_fees"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    student_id: Mapped[str] = mapped_column(String(36), ForeignKey("students.id"), unique=True)
    fee_type: Mapped[str] = mapped_column(String(20), default="default")
    amount: Mapped[Optional[float]] = mapped_column(Float)
    note: Mapped[Optional[str]] = mapped_column(Text)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    student: Mapped["StudentORM"] = relationship(back_populates="fee_setting")


class AttendanceSessionORM(Base):
    __tablename__ = "attendance_sessions"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    class_id: Mapped[str] = mapped_column(String(36), ForeignKey("classes.id"), index=True)
    session_date: Mapped[str] = mapped_column(String(10))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    class_: Mapped["ClassORM"] = relationship(back_populates="sessions")
    records: Mapped[list["AttendanceRecordORM"]] = relationship(back_populates="session", lazy="select", cascade="all, delete-orphan")


class AttendanceRecordORM(Base):
    __tablename__ = "attendance_records"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    session_id: Mapped[str] = mapped_column(String(36), ForeignKey("attendance_sessions.id"), index=True)
    student_id: Mapped[str] = mapped_column(String(36), ForeignKey("students.id"))
    present: Mapped[bool] = mapped_column(Boolean, default=True)
    absence_reason: Mapped[Optional[str]] = mapped_column(String(200))

    session: Mapped["AttendanceSessionORM"] = relationship(back_populates="records")
    student: Mapped["StudentORM"] = relationship(back_populates="attendance_records")


class TuitionORM(Base):
    __tablename__ = "tuitions"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    class_id: Mapped[str] = mapped_column(String(36), ForeignKey("classes.id"), index=True)
    student_id: Mapped[str] = mapped_column(String(36), ForeignKey("students.id"))
    month: Mapped[str] = mapped_column(String(7))
    amount: Mapped[float] = mapped_column(Float)
    paid: Mapped[bool] = mapped_column(Boolean, default=False)
    paid_date: Mapped[Optional[str]] = mapped_column(String(10))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    class_: Mapped["ClassORM"] = relationship(back_populates="tuitions")
    student: Mapped["StudentORM"] = relationship(back_populates="tuitions")


class AnnouncementORM(Base):
    __tablename__ = "announcements"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    class_id: Mapped[str] = mapped_column(String(36), ForeignKey("classes.id"), index=True)
    type: Mapped[str] = mapped_column(String(20))
    content: Mapped[str] = mapped_column(Text)
    session_date: Mapped[Optional[str]] = mapped_column(String(10))
    status: Mapped[str] = mapped_column(String(20), default="sent")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    class_: Mapped["ClassORM"] = relationship(back_populates="announcements")
    makeup: Mapped[Optional["MakeupORM"]] = relationship(back_populates="announcement", uselist=False, lazy="select")


class MakeupORM(Base):
    __tablename__ = "makeups"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    announcement_id: Mapped[str] = mapped_column(String(36), ForeignKey("announcements.id"), unique=True)
    options: Mapped[list] = mapped_column(JSON)
    confirmed_option: Mapped[Optional[int]] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    announcement: Mapped["AnnouncementORM"] = relationship(back_populates="makeup")
    votes: Mapped[list["MakeupVoteORM"]] = relationship(back_populates="makeup", lazy="select", cascade="all, delete-orphan")


class MakeupVoteORM(Base):
    __tablename__ = "makeup_votes"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    makeup_id: Mapped[str] = mapped_column(String(36), ForeignKey("makeups.id"), index=True)
    option_index: Mapped[int] = mapped_column(Integer)
    voter_name: Mapped[str] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    makeup: Mapped["MakeupORM"] = relationship(back_populates="votes")


class ReportORM(Base):
    __tablename__ = "reports"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    class_id: Mapped[str] = mapped_column(String(36), ForeignKey("classes.id"), index=True)
    week_start: Mapped[str] = mapped_column(String(10))
    content: Mapped[dict] = mapped_column(JSON)
    generated_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    class_: Mapped["ClassORM"] = relationship(back_populates="reports")


class OTPORM(Base):
    __tablename__ = "otps"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    phone: Mapped[str] = mapped_column(String(20), index=True)
    code: Mapped[str] = mapped_column(String(6))
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    used: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
