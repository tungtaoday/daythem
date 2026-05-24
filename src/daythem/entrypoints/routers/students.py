from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from daythem.entrypoints.deps import get_uow, get_current_teacher
from daythem.service.handlers import (
    AddStudentCommand, UpdateStudentCommand, SetStudentFeeCommand,
    handle_add_student, handle_update_student, handle_set_student_fee,
)
from daythem.service.unit_of_work import SqlAlchemyUnitOfWork
from daythem.adapters.orm import TeacherORM

router = APIRouter(tags=["students"])


def student_out(s) -> dict:
    fee = s.fee_setting
    return {
        "id": s.id,
        "class_id": s.class_id,
        "name": s.name,
        "parent_name": s.parent_name,
        "parent_phone": s.parent_phone,
        "note": s.note,
        "fee_setting": {
            "fee_type": fee.fee_type,
            "amount": fee.amount,
            "note": fee.note,
        } if fee else None,
        "created_at": s.created_at.isoformat(),
    }


class AddStudentBody(BaseModel):
    name: str
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    note: Optional[str] = None


class UpdateStudentBody(BaseModel):
    name: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    note: Optional[str] = None


class SetFeeBody(BaseModel):
    fee_type: str
    amount: Optional[float] = None
    note: Optional[str] = None


@router.get("/classes/{class_id}/students")
def list_students(
    class_id: str,
    teacher: TeacherORM = Depends(get_current_teacher),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
):
    with uow:
        klass = uow.classes.get(class_id)
        if not klass or klass.teacher_id != teacher.id:
            raise HTTPException(404, "Class not found")
        students = uow.students.list_by_class(class_id)
        return [student_out(s) for s in students]


@router.post("/classes/{class_id}/students", status_code=201)
def add_student(
    class_id: str,
    body: AddStudentBody,
    teacher: TeacherORM = Depends(get_current_teacher),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
):
    with uow:
        klass = uow.classes.get(class_id)
        if not klass or klass.teacher_id != teacher.id:
            raise HTTPException(404, "Class not found")

    student = handle_add_student(AddStudentCommand(class_id=class_id, **body.model_dump()), uow)
    return student_out(student)


@router.get("/students/{student_id}")
def get_student(
    student_id: str,
    teacher: TeacherORM = Depends(get_current_teacher),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
):
    with uow:
        student = uow.students.get(student_id)
        if not student:
            raise HTTPException(404, "Student not found")
        klass = uow.classes.get(student.class_id)
        if klass.teacher_id != teacher.id:
            raise HTTPException(403, "Forbidden")
        return student_out(student)


@router.put("/students/{student_id}")
def update_student(
    student_id: str,
    body: UpdateStudentBody,
    teacher: TeacherORM = Depends(get_current_teacher),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
):
    with uow:
        student = uow.students.get(student_id)
        if not student:
            raise HTTPException(404, "Student not found")
        klass = uow.classes.get(student.class_id)
        if klass.teacher_id != teacher.id:
            raise HTTPException(403, "Forbidden")

    student = handle_update_student(UpdateStudentCommand(student_id=student_id, **body.model_dump()), uow)
    return student_out(student)


@router.delete("/students/{student_id}", status_code=204)
def remove_student(
    student_id: str,
    teacher: TeacherORM = Depends(get_current_teacher),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
):
    with uow:
        student = uow.students.get(student_id)
        if not student:
            raise HTTPException(404, "Student not found")
        klass = uow.classes.get(student.class_id)
        if klass.teacher_id != teacher.id:
            raise HTTPException(403, "Forbidden")
        student.archived = True
        uow.commit()


@router.put("/students/{student_id}/fee")
def set_student_fee(
    student_id: str,
    body: SetFeeBody,
    teacher: TeacherORM = Depends(get_current_teacher),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
):
    with uow:
        student = uow.students.get(student_id)
        if not student:
            raise HTTPException(404, "Student not found")
        klass = uow.classes.get(student.class_id)
        if klass.teacher_id != teacher.id:
            raise HTTPException(403, "Forbidden")

    fee = handle_set_student_fee(
        SetStudentFeeCommand(student_id=student_id, class_id=student.class_id, **body.model_dump()),
        uow,
    )
    return {"fee_type": fee.fee_type, "amount": fee.amount, "note": fee.note}
