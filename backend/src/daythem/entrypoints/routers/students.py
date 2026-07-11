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


class OcrBody(BaseModel):
    image_base64: str
    mime_type: str = "image/jpeg"


class ImportBody(BaseModel):
    file_base64: str
    mime_type: str = ""
    filename: str = ""


class BulkAddBody(BaseModel):
    names: list[str]


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


@router.post("/students/import")
def import_student_names(
    body: ImportBody,
    teacher: TeacherORM = Depends(get_current_teacher),
):
    """Nhập từ FILE bất kỳ (ảnh/pdf/docx/xlsx/csv/txt) → trả danh sách tên.

    KHÔNG tạo học sinh — app cho GV sửa rồi mới bulk create. Không lưu file.
    """
    from daythem.adapters.gemini import extract_student_names
    try:
        names = extract_student_names(body.file_base64, body.mime_type, body.filename)
    except ValueError as e:
        raise HTTPException(400, str(e))
    return {"names": names}


@router.post("/students/ocr")
def ocr_student_names(
    body: OcrBody,
    teacher: TeacherORM = Depends(get_current_teacher),
):
    """Alias tương thích: quét ẢNH danh sách → trả danh sách tên."""
    from daythem.adapters.gemini import extract_student_names
    try:
        names = extract_student_names(body.image_base64, body.mime_type, "")
    except ValueError as e:
        raise HTTPException(400, str(e))
    return {"names": names}


@router.post("/classes/{class_id}/students/bulk", status_code=201)
def bulk_add_students(
    class_id: str,
    body: BulkAddBody,
    teacher: TeacherORM = Depends(get_current_teacher),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
):
    """Tạo hàng loạt học sinh từ danh sách tên (dán text hoặc kết quả OCR)."""
    with uow:
        klass = uow.classes.get(class_id)
        if not klass or klass.teacher_id != teacher.id:
            raise HTTPException(404, "Class not found")

    created = []
    for raw in body.names:
        name = " ".join((raw or "").split())
        if not name:
            continue
        student = handle_add_student(AddStudentCommand(class_id=class_id, name=name), uow)
        created.append(student_out(student))
    return {"items": created, "total": len(created)}


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
