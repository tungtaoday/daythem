"""Event kích hoạt do CLIENT báo — chỉ nhận các event xảy ra trên máy GV
(server không quan sát được), vd chia sẻ thiệp qua Zalo."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from daythem.entrypoints.deps import get_current_teacher, get_uow
from daythem.service.unit_of_work import SqlAlchemyUnitOfWork
from daythem.adapters.orm import TeacherORM
from daythem.service.activity import record_event

router = APIRouter(prefix="/events", tags=["events"])

# Chỉ cho phép các event phía client; các event lõi khác được ghi server-side.
_CLIENT_KINDS = {"thiep_shared", "report_zalo_opened"}


class TrackBody(BaseModel):
    kind: str


@router.post("/track")
def track_event(
    body: TrackBody,
    teacher: TeacherORM = Depends(get_current_teacher),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
):
    if body.kind in _CLIENT_KINDS:
        record_event(uow._session_factory, teacher.id, body.kind)
    return {"ok": True}
