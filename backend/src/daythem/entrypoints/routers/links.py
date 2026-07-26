"""Link theo dõi công khai: gieochu.vn/r/<code> → ghi 1 click → chuyển tới URL đích.

Dùng để đo bài đăng/kênh nào kéo click thật (group FB, TikTok, fanpage...) khi đăng tay.
"""
import uuid

from fastapi import APIRouter, Request, Depends
from fastapi.responses import RedirectResponse, PlainTextResponse
from sqlalchemy import select

from daythem.entrypoints.deps import get_uow
from daythem.service.unit_of_work import SqlAlchemyUnitOfWork
from daythem.adapters.orm import TrackedLinkORM, LinkClickORM

router = APIRouter(tags=["links"])


@router.get("/r/{code}")
def redirect(code: str, request: Request, uow: SqlAlchemyUnitOfWork = Depends(get_uow)):
    with uow:
        link = uow._session.get(TrackedLinkORM, code)
        if not link:
            return PlainTextResponse("Link không tồn tại", status_code=404)
        ref = request.headers.get("referer") or request.headers.get("user-agent") or ""
        uow._session.add(LinkClickORM(id=str(uuid.uuid4()), code=code, referer=ref[:300]))
        uow.commit()
        target = link.target
    # 302 để trình duyệt không cache vĩnh viễn (đếm được click lần sau).
    return RedirectResponse(url=target, status_code=302)
