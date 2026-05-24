from __future__ import annotations
from typing import Callable
from sqlalchemy.orm import Session, sessionmaker
from daythem.adapters.repository import (
    TeacherRepository, ClassRepository, StudentRepository, StudentFeeRepository,
    AttendanceRepository, TuitionRepository, AnnouncementRepository,
    MakeupRepository, ReportRepository, OTPRepository,
)


class SqlAlchemyUnitOfWork:
    def __init__(self, session_factory: Callable[[], Session]):
        self._session_factory = session_factory

    def __enter__(self) -> SqlAlchemyUnitOfWork:
        self._session = self._session_factory()
        self.teachers = TeacherRepository(self._session)
        self.classes = ClassRepository(self._session)
        self.students = StudentRepository(self._session)
        self.fees = StudentFeeRepository(self._session)
        self.attendance = AttendanceRepository(self._session)
        self.tuitions = TuitionRepository(self._session)
        self.announcements = AnnouncementRepository(self._session)
        self.makeups = MakeupRepository(self._session)
        self.reports = ReportRepository(self._session)
        self.otps = OTPRepository(self._session)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            self._session.rollback()
        self._session.close()

    def commit(self) -> None:
        self._session.commit()

    def rollback(self) -> None:
        self._session.rollback()
