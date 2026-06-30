from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional
from daythem.entrypoints.deps import get_uow, get_current_teacher
from daythem.service.handlers import RecordPaymentCommand, handle_record_payment, _vn_month
from daythem.service.unit_of_work import SqlAlchemyUnitOfWork
from daythem.adapters.orm import TeacherORM

router = APIRouter(tags=["tuition"])


def tuition_out(t) -> dict:
    return {
        "id": t.id,
        "student_id": t.student_id,
        "student_name": t.student.name if t.student else None,
        "month": t.month,
        "amount": t.amount,
        "paid": t.paid,
        "paid_date": t.paid_date,
    }


class RecordPaymentBody(BaseModel):
    student_id: str
    paid: bool
    amount: Optional[float] = Field(default=None, ge=0)
    month: Optional[str] = Field(default=None, pattern=r"^\d{4}-\d{2}$")  # "YYYY-MM"; defaults to current month (VN time)


@router.get("/classes/{class_id}/tuition/{month}")
def get_tuition(
    class_id: str,
    month: str,
    teacher: TeacherORM = Depends(get_current_teacher),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
):
    with uow:
        klass = uow.classes.get(class_id)
        if not klass or klass.teacher_id != teacher.id:
            raise HTTPException(404, "Class not found")

        students = uow.students.list_by_class(class_id)
        result = []
        for student in students:
            tuition = uow.tuitions.get_by_student_month(student.id, month)
            fee = student.fee_setting
            if fee and fee.fee_type == "free":
                amount = 0
            elif fee and fee.fee_type in ("discount", "custom") and fee.amount is not None:
                amount = fee.amount
            else:
                amount = klass.default_fee

            result.append({
                "student_id": student.id,
                "student_name": student.name,
                "parent_phone": student.parent_phone,
                "amount": tuition.amount if tuition else amount,
                "paid": tuition.paid if tuition else False,
                "paid_date": tuition.paid_date if tuition else None,
                "fee_type": fee.fee_type if fee else "default",
            })
        return result


@router.post("/classes/{class_id}/tuition/payment")
def record_payment(
    class_id: str,
    body: RecordPaymentBody,
    teacher: TeacherORM = Depends(get_current_teacher),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
):
    with uow:
        klass = uow.classes.get(class_id)
        if not klass or klass.teacher_id != teacher.id:
            raise HTTPException(404, "Class not found")

    month = body.month or _vn_month()
    tuition = handle_record_payment(
        RecordPaymentCommand(
            class_id=class_id,
            student_id=body.student_id,
            month=month,
            paid=body.paid,
            amount=body.amount,
        ),
        uow,
    )
    return tuition_out(tuition)
