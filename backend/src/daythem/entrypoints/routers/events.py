"""Event kích hoạt do CLIENT báo — chỉ nhận các event xảy ra trên máy GV
(server không quan sát được), vd chia sẻ thiệp qua Zalo."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from daythem.entrypoints.deps import get_current_teacher, get_uow
from daythem.service.unit_of_work import SqlAlchemyUnitOfWork
from daythem.adapters.orm import TeacherORM
from daythem.service.activity import record_event
from daythem.service import journey

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


class Step(BaseModel):
    screen: str
    action: str | None = None
    session_id: str | None = None
    at: str | None = None          # ISO time trên máy GV; thiếu thì lấy giờ server


class StepsBody(BaseModel):
    steps: list[Step] = []
    platform: str = ""
    app_version: str = ""


@router.post("/steps")
def track_steps(
    body: StepsBody,
    teacher: TeacherORM = Depends(get_current_teacher),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
):
    """Nhận 1 LÔ bước chân (mở màn / bấm nút) — app gửi gộp, không gửi từng cái.

    Gửi gộp vì màn hình đổi liên tục: bắn 1 request mỗi lần đổi màn sẽ tốn pin và
    4G của giáo viên, mà họ phần lớn dùng gói dữ liệu hạn chế.
    """
    n = journey.record_steps(
        uow._session_factory, teacher.id,
        [s.model_dump() for s in body.steps],
        platform=body.platform, app_version=body.app_version,
    )
    return {"ok": True, "saved": n}
