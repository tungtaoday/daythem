from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from daythem.entrypoints.deps import get_uow, get_current_teacher
from daythem.service.handlers import RecordAttendanceCommand, handle_record_attendance
from daythem.service.unit_of_work import SqlAlchemyUnitOfWork
from daythem.adapters.orm import TeacherORM

router = APIRouter(prefix="/classes/{class_id}/attendance", tags=["attendance"])


def session_out(s) -> dict:
    return {
        "id": s.id,
        "class_id": s.class_id,
        "session_date": s.session_date,
        "notes": s.notes,
        "records": [
            {
                "student_id": r.student_id,
                "student_name": r.student.name if r.student else None,
                "present": r.present,
                "absence_reason": r.absence_reason,
            }
            for r in s.records
        ],
        "absent_count": sum(1 for r in s.records if not r.present),
        "created_at": s.created_at.isoformat(),
    }


class AttendanceRecordBody(BaseModel):
    student_id: str
    present: bool = True
    absence_reason: Optional[str] = None


class RecordAttendanceBody(BaseModel):
    session_date: str
    records: list[AttendanceRecordBody]
    notes: Optional[str] = None


@router.get("")
def list_sessions(
    class_id: str,
    teacher: TeacherORM = Depends(get_current_teacher),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
):
    with uow:
        klass = uow.classes.get(class_id)
        if not klass or klass.teacher_id != teacher.id:
            raise HTTPException(404, "Class not found")
        sessions = uow.attendance.list_sessions(class_id)
        return [session_out(s) for s in sessions]


@router.post("", status_code=201)
def record_attendance(
    class_id: str,
    body: RecordAttendanceBody,
    teacher: TeacherORM = Depends(get_current_teacher),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
):
    with uow:
        klass = uow.classes.get(class_id)
        if not klass or klass.teacher_id != teacher.id:
            raise HTTPException(404, "Class not found")

    session = handle_record_attendance(
        RecordAttendanceCommand(
            class_id=class_id,
            session_date=body.session_date,
            records=[r.model_dump() for r in body.records],
            notes=body.notes,
        ),
        uow,
    )
    return session_out(session)


@router.get("/{session_id}")
def get_session(
    class_id: str,
    session_id: str,
    teacher: TeacherORM = Depends(get_current_teacher),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
):
    with uow:
        klass = uow.classes.get(class_id)
        if not klass or klass.teacher_id != teacher.id:
            raise HTTPException(404, "Class not found")
        session = uow.attendance.get_session(session_id)
        if not session or session.class_id != class_id:
            raise HTTPException(404, "Session not found")
        return session_out(session)
