from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, Any
from daythem.entrypoints.deps import get_uow, get_current_teacher
from daythem.service.unit_of_work import SqlAlchemyUnitOfWork
from daythem.adapters.orm import TeacherORM
from daythem.service import notify as notify_svc

router = APIRouter(prefix="/notify", tags=["notify"])


class PrefsBody(BaseModel):
    rules: Optional[dict[str, Any]] = None       # { class_reminder: {enabled, lead_minutes}, ... }
    quiet_hours: Optional[list[str]] = None       # ["22:00","07:00"]
    marketing_opt_in: Optional[bool] = None


class TokenBody(BaseModel):
    token: str


class EventBody(BaseModel):
    channel: str            # utility | marketing
    rule: Optional[str] = None
    event_type: str         # delivered | opened | dismissed


@router.get("/config")
def get_config(teacher: TeacherORM = Depends(get_current_teacher), uow: SqlAlchemyUnitOfWork = Depends(get_uow)):
    with uow:
        return notify_svc.resolve_config(teacher, uow._session)


@router.get("/campaigns")
def get_campaigns(teacher: TeacherORM = Depends(get_current_teacher), uow: SqlAlchemyUnitOfWork = Depends(get_uow)):
    with uow:
        return {"campaigns": notify_svc.active_campaigns(teacher, uow._session)}


@router.put("/prefs")
def update_prefs(body: PrefsBody, teacher: TeacherORM = Depends(get_current_teacher), uow: SqlAlchemyUnitOfWork = Depends(get_uow)):
    with uow:
        t = uow.teachers.get(teacher.id)
        prefs = dict(t.notif_prefs or {})
        if body.rules is not None:
            merged = dict(prefs.get("rules") or {})
            for k, v in body.rules.items():
                merged[k] = {**(merged.get(k) or {}), **(v or {})}
            prefs["rules"] = merged
        if body.quiet_hours is not None:
            prefs["quiet_hours"] = body.quiet_hours
        if body.marketing_opt_in is not None:
            prefs["marketing_opt_in"] = body.marketing_opt_in
        t.notif_prefs = prefs
        uow.commit()
        return notify_svc.resolve_config(t, uow._session)


@router.post("/register-token")
def register_token(body: TokenBody, teacher: TeacherORM = Depends(get_current_teacher), uow: SqlAlchemyUnitOfWork = Depends(get_uow)):
    with uow:
        t = uow.teachers.get(teacher.id)
        t.push_token = body.token
        uow.commit()
    return {"ok": True}


@router.post("/events", status_code=201)
def log_events(body: EventBody, teacher: TeacherORM = Depends(get_current_teacher), uow: SqlAlchemyUnitOfWork = Depends(get_uow)):
    with uow:
        notify_svc.log_event(uow._session, teacher.id, body.channel, body.rule, body.event_type)
        uow.commit()
    return {"ok": True}
