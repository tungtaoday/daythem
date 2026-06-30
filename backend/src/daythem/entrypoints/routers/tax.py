from fastapi import APIRouter, HTTPException, Depends, Query
from daythem.entrypoints.deps import get_uow, get_current_teacher
from daythem.service.handlers import (
    GetTaxSummaryCommand, GetTaxDeclarationCommand,
    handle_get_tax_summary, handle_get_tax_declaration,
)
from daythem.service.unit_of_work import SqlAlchemyUnitOfWork
from daythem.adapters.orm import TeacherORM

router = APIRouter(prefix="/tax", tags=["tax"])


@router.get("/summary")
def get_tax_summary(
    year: int = Query(..., ge=2020, le=2100),
    teacher: TeacherORM = Depends(get_current_teacher),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
):
    return handle_get_tax_summary(GetTaxSummaryCommand(teacher_id=teacher.id, year=year), uow)


@router.get("/declaration")
def get_tax_declaration(
    year: int = Query(..., ge=2020, le=2100),
    teacher: TeacherORM = Depends(get_current_teacher),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
):
    try:
        return handle_get_tax_declaration(
            GetTaxDeclarationCommand(teacher_id=teacher.id, year=year), uow
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
