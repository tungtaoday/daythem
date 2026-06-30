from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from daythem.entrypoints.deps import get_uow, get_current_teacher
from daythem.service.handlers import (
    CreateClassCommand, UpdateClassCommand,
    handle_create_class, handle_update_class,
)
from daythem.service.unit_of_work import SqlAlchemyUnitOfWork
from daythem.adapters.orm import TeacherORM, ClassORM

router = APIRouter(prefix="/classes", tags=["classes"])


def class_out(c: ClassORM, student_count: int = 0) -> dict:
    return {
        "id": c.id,
        "name": c.name,
        "subject": c.subject,
        "grade": c.grade,
        "schedule": c.schedule,
        "default_fee": c.default_fee,
        "fee_type": c.fee_type,
        "zalo_group_id": c.zalo_group_id,
        "color": c.color,
        "archived": c.archived,
        "student_count": student_count,
        "created_at": c.created_at.isoformat(),
    }


class CreateClassBody(BaseModel):
    name: str
    subject: str
    grade: str
    schedule: Optional[dict] = None
    default_fee: float = 0
    fee_type: str = "month"
    color: Optional[str] = None


class UpdateClassBody(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    grade: Optional[str] = None
    schedule: Optional[dict] = None
    default_fee: Optional[float] = None
    fee_type: Optional[str] = None
    zalo_group_id: Optional[str] = None
    color: Optional[str] = None
    archived: Optional[bool] = None


@router.get("")
def list_classes(
    archived: bool = False,
    teacher: TeacherORM = Depends(get_current_teacher),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
):
    with uow:
        classes = uow.classes.list_by_teacher(teacher.id, archived=archived)
        return [
            class_out(c, len(uow.students.list_by_class(c.id)))
            for c in classes
        ]


@router.post("", status_code=201)
def create_class(
    body: CreateClassBody,
    teacher: TeacherORM = Depends(get_current_teacher),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
):
    klass = handle_create_class(
        CreateClassCommand(teacher_id=teacher.id, **body.model_dump()),
        uow,
    )
    return class_out(klass, 0)


@router.get("/{class_id}")
def get_class(
    class_id: str,
    teacher: TeacherORM = Depends(get_current_teacher),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
):
    with uow:
        klass = uow.classes.get(class_id)
        if not klass or klass.teacher_id != teacher.id:
            raise HTTPException(404, "Class not found")
        count = len(uow.students.list_by_class(class_id))
        return class_out(klass, count)


@router.put("/{class_id}")
def update_class(
    class_id: str,
    body: UpdateClassBody,
    teacher: TeacherORM = Depends(get_current_teacher),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
):
    try:
        klass = handle_update_class(
            UpdateClassCommand(class_id=class_id, teacher_id=teacher.id, **body.model_dump()),
            uow,
        )
    except ValueError as e:
        raise HTTPException(404, str(e))
    with uow:
        count = len(uow.students.list_by_class(class_id))
    return class_out(klass, count)


@router.delete("/{class_id}", status_code=204)
def archive_class(
    class_id: str,
    teacher: TeacherORM = Depends(get_current_teacher),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
):
    with uow:
        klass = uow.classes.get(class_id)
        if not klass or klass.teacher_id != teacher.id:
            raise HTTPException(404, "Class not found")
        klass.archived = True
        uow.commit()
