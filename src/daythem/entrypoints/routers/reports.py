from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from daythem.entrypoints.deps import get_uow, get_current_teacher
from daythem.service.handlers import GenerateReportCommand, handle_generate_report
from daythem.service.unit_of_work import SqlAlchemyUnitOfWork
from daythem.adapters.orm import TeacherORM

router = APIRouter(tags=["reports"])


def report_out(r) -> dict:
    return {
        "id": r.id,
        "class_id": r.class_id,
        "week_start": r.week_start,
        "content": r.content,
        "generated_at": r.generated_at.isoformat(),
    }


class GenerateReportBody(BaseModel):
    week_start: str


@router.get("/classes/{class_id}/reports")
def list_reports(
    class_id: str,
    teacher: TeacherORM = Depends(get_current_teacher),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
):
    with uow:
        klass = uow.classes.get(class_id)
        if not klass or klass.teacher_id != teacher.id:
            raise HTTPException(404, "Class not found")
        reports = uow.reports.list_by_class(class_id)
        return [report_out(r) for r in reports]


@router.post("/classes/{class_id}/reports/generate", status_code=201)
def generate_report(
    class_id: str,
    body: GenerateReportBody,
    teacher: TeacherORM = Depends(get_current_teacher),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
):
    with uow:
        klass = uow.classes.get(class_id)
        if not klass or klass.teacher_id != teacher.id:
            raise HTTPException(404, "Class not found")

    report = handle_generate_report(
        GenerateReportCommand(class_id=class_id, week_start=body.week_start),
        uow,
    )
    return report_out(report)


@router.get("/reports/{report_id}")
def get_report(
    report_id: str,
    teacher: TeacherORM = Depends(get_current_teacher),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
):
    with uow:
        report = uow.reports.get(report_id)
        if not report:
            raise HTTPException(404, "Report not found")
        klass = uow.classes.get(report.class_id)
        if klass.teacher_id != teacher.id:
            raise HTTPException(403, "Forbidden")
        return report_out(report)
