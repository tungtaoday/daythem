from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from daythem.entrypoints.deps import get_uow, get_current_teacher
from daythem.service.handlers import (
    CancelClassCommand, ProposeMakeupCommand, VoteMakeupCommand, ConfirmMakeupCommand,
    handle_cancel_class, handle_propose_makeup, handle_vote_makeup, handle_confirm_makeup,
)
from daythem.service.unit_of_work import SqlAlchemyUnitOfWork
from daythem.adapters.orm import TeacherORM

router = APIRouter(tags=["announcements"])


def ann_out(a) -> dict:
    result = {
        "id": a.id,
        "class_id": a.class_id,
        "type": a.type,
        "content": a.content,
        "session_date": a.session_date,
        "status": a.status,
        "created_at": a.created_at.isoformat(),
        "makeup": None,
    }
    if a.makeup:
        result["makeup"] = makeup_out(a.makeup)
    return result


def makeup_out(m) -> dict:
    vote_counts = {}
    for v in m.votes:
        vote_counts[v.option_index] = vote_counts.get(v.option_index, 0) + 1
    return {
        "id": m.id,
        "options": [
            {**opt, "votes": vote_counts.get(i, 0)}
            for i, opt in enumerate(m.options)
        ],
        "confirmed_option": m.confirmed_option,
        "created_at": m.created_at.isoformat(),
    }


class CancelClassBody(BaseModel):
    session_date: str
    content: str
    propose_makeup: bool = False


class MakeupOptionBody(BaseModel):
    date: str
    time: str
    label: str


class ProposeMakeupBody(BaseModel):
    options: list[MakeupOptionBody]


class VoteBody(BaseModel):
    option_index: int
    voter_name: str


class ConfirmBody(BaseModel):
    option_index: int


@router.get("/classes/{class_id}/announcements")
def list_announcements(
    class_id: str,
    teacher: TeacherORM = Depends(get_current_teacher),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
):
    with uow:
        klass = uow.classes.get(class_id)
        if not klass or klass.teacher_id != teacher.id:
            raise HTTPException(404, "Class not found")
        anns = uow.announcements.list_by_class(class_id)
        return [ann_out(a) for a in anns]


@router.post("/classes/{class_id}/cancel", status_code=201)
def cancel_class(
    class_id: str,
    body: CancelClassBody,
    teacher: TeacherORM = Depends(get_current_teacher),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
):
    with uow:
        klass = uow.classes.get(class_id)
        if not klass or klass.teacher_id != teacher.id:
            raise HTTPException(404, "Class not found")

    ann = handle_cancel_class(
        CancelClassCommand(
            class_id=class_id,
            session_date=body.session_date,
            content=body.content,
            propose_makeup=body.propose_makeup,
        ),
        uow,
    )
    return ann_out(ann)


@router.post("/announcements/{announcement_id}/makeup", status_code=201)
def propose_makeup(
    announcement_id: str,
    body: ProposeMakeupBody,
    teacher: TeacherORM = Depends(get_current_teacher),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
):
    with uow:
        ann = uow.announcements.get(announcement_id)
        if not ann:
            raise HTTPException(404, "Announcement not found")
        klass = uow.classes.get(ann.class_id)
        if klass.teacher_id != teacher.id:
            raise HTTPException(403, "Forbidden")

    makeup = handle_propose_makeup(
        ProposeMakeupCommand(
            announcement_id=announcement_id,
            options=[o.model_dump() for o in body.options],
        ),
        uow,
    )
    return makeup_out(makeup)


@router.get("/makeups/{makeup_id}")
def get_makeup_poll(
    makeup_id: str,
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
):
    with uow:
        makeup = uow.makeups.get(makeup_id)
        if not makeup:
            raise HTTPException(404, "Makeup not found")
        return makeup_out(makeup)


@router.post("/makeups/{makeup_id}/vote")
def vote_makeup(
    makeup_id: str,
    body: VoteBody,
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
):
    try:
        makeup = handle_vote_makeup(
            VoteMakeupCommand(makeup_id=makeup_id, option_index=body.option_index, voter_name=body.voter_name),
            uow,
        )
    except ValueError as e:
        raise HTTPException(400, str(e))
    return makeup_out(makeup)


@router.post("/makeups/{makeup_id}/confirm")
def confirm_makeup(
    makeup_id: str,
    body: ConfirmBody,
    teacher: TeacherORM = Depends(get_current_teacher),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
):
    with uow:
        makeup = uow.makeups.get(makeup_id)
        if not makeup:
            raise HTTPException(404, "Makeup not found")
        ann = uow.announcements.get(makeup.announcement_id)
        klass = uow.classes.get(ann.class_id) if ann else None
        if not klass or klass.teacher_id != teacher.id:
            raise HTTPException(403, "Forbidden")

    try:
        makeup = handle_confirm_makeup(
            ConfirmMakeupCommand(makeup_id=makeup_id, option_index=body.option_index),
            uow,
        )
    except ValueError as e:
        raise HTTPException(400, str(e))
    return makeup_out(makeup)
