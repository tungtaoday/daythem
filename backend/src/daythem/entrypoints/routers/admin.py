"""Owner admin dashboard — xem user/thống kê, phục vụ trang web quản trị.

Auth tách biệt tài khoản GV: đăng nhập bằng ADMIN_PASSWORD → JWT sub="__admin__".
"""
from pathlib import Path
from datetime import datetime, timedelta

import jwt
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import HTMLResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy import select, func, desc

from daythem.config import settings
from daythem.entrypoints.security import create_token, decode_token
from daythem.entrypoints.ratelimit import rate_limit, _client_ip
from daythem.entrypoints.deps import get_uow
from daythem.service.unit_of_work import SqlAlchemyUnitOfWork
from daythem.service.activity import activation_funnel
from daythem.service.handlers import _hash_password
from daythem.adapters.orm import TeacherORM, ClassORM, StudentORM, PasswordResetRequestORM

router = APIRouter(tags=["admin"])
_bearer = HTTPBearer()
_ADMIN_SUB = "__admin__"
_WEB = Path(__file__).resolve().parent.parent.parent / "web"


def require_admin(creds: HTTPAuthorizationCredentials = Depends(_bearer)) -> bool:
    try:
        sub = decode_token(creds.credentials)
    except jwt.PyJWTError:
        raise HTTPException(401, "Token không hợp lệ")
    if sub != _ADMIN_SUB:
        raise HTTPException(403, "Không có quyền quản trị")
    return True


class AdminLogin(BaseModel):
    password: str


@router.post("/admin/login")
def admin_login(body: AdminLogin, request: Request):
    rate_limit("admin_login", _client_ip(request), limit=10, window_seconds=300)
    if not settings.ADMIN_PASSWORD or body.password != settings.ADMIN_PASSWORD:
        raise HTTPException(401, "Sai mật khẩu")
    return {"token": create_token(_ADMIN_SUB)}


@router.get("/admin/stats")
def admin_stats(_: bool = Depends(require_admin), uow: SqlAlchemyUnitOfWork = Depends(get_uow)):
    with uow:
        s = uow._session
        week_ago = datetime.utcnow() - timedelta(days=7)
        today = datetime.utcnow() - timedelta(days=1)
        return {
            "teachers": s.scalar(select(func.count(TeacherORM.id))) or 0,
            "classes": s.scalar(select(func.count(ClassORM.id))) or 0,
            "students": s.scalar(select(func.count(StudentORM.id)).where(StudentORM.archived == False)) or 0,
            "new_today": s.scalar(select(func.count(TeacherORM.id)).where(TeacherORM.created_at >= today)) or 0,
            "new_this_week": s.scalar(select(func.count(TeacherORM.id)).where(TeacherORM.created_at >= week_ago)) or 0,
        }


@router.get("/admin/activation")
def admin_activation(_: bool = Depends(require_admin), uow: SqlAlchemyUnitOfWork = Depends(get_uow)):
    """Phễu kích hoạt GV (BƯỚC 1 GTM): % tạo lớp, % làm hành động lõi, % kích hoạt trong 24h."""
    return activation_funnel(uow._session_factory)


@router.get("/admin/teachers")
def admin_teachers(limit: int = 50, _: bool = Depends(require_admin), uow: SqlAlchemyUnitOfWork = Depends(get_uow)):
    limit = max(1, min(limit, 200))
    with uow:
        s = uow._session
        rows = s.scalars(select(TeacherORM).order_by(desc(TeacherORM.created_at)).limit(limit)).all()
        items = []
        for t in rows:
            cc = s.scalar(select(func.count(ClassORM.id)).where(ClassORM.teacher_id == t.id)) or 0
            items.append({
                "name": t.name,
                "phone": t.phone,
                "classes": cc,
                "created_at": t.created_at.isoformat(),
            })
        return {"items": items, "total": len(items)}


@router.get("/admin/reset-requests")
def admin_reset_requests(_: bool = Depends(require_admin), uow: SqlAlchemyUnitOfWork = Depends(get_uow)):
    """Hàng chờ yêu cầu đặt lại mật khẩu (GV gửi từ app)."""
    with uow:
        s = uow._session
        rows = s.scalars(
            select(PasswordResetRequestORM)
            .where(PasswordResetRequestORM.status == "pending")
            .order_by(desc(PasswordResetRequestORM.created_at))
            .limit(50)
        ).all()
        items = []
        for r in rows:
            t = s.scalar(select(TeacherORM).where(TeacherORM.phone == r.phone))
            items.append({
                "id": r.id,
                "phone": r.phone,
                "note": r.note,
                "name": t.name if t else None,
                "exists": t is not None,
                "created_at": r.created_at.isoformat(),
            })
        return {"items": items, "total": len(items)}


class AdminResetBody(BaseModel):
    phone: str
    new_password: str


@router.post("/admin/reset-password")
def admin_reset_password(
    body: AdminResetBody,
    _: bool = Depends(require_admin),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
):
    """Owner đặt lại mật khẩu cho GV (không cần OTP) + đánh dấu yêu cầu đã xử lý."""
    if len(body.new_password) < 6:
        raise HTTPException(422, "Mật khẩu mới phải có ít nhất 6 ký tự")
    phone = (body.phone or "").strip()
    with uow:
        s = uow._session
        teacher = s.scalar(select(TeacherORM).where(TeacherORM.phone == phone))
        if not teacher:
            raise HTTPException(404, f"Không tìm thấy giáo viên với SĐT {phone}")
        teacher.password_hash = _hash_password(body.new_password)
        reqs = s.scalars(
            select(PasswordResetRequestORM).where(
                PasswordResetRequestORM.phone == phone,
                PasswordResetRequestORM.status == "pending",
            )
        ).all()
        for r in reqs:
            r.status = "done"
            r.handled_at = datetime.utcnow()
        uow.commit()
        return {"ok": True, "name": teacher.name or ""}


@router.get("/admin", response_class=HTMLResponse)
def admin_page() -> str:
    try:
        return (_WEB / "admin.html").read_text(encoding="utf-8")
    except FileNotFoundError:
        return "<h1>Admin</h1><p>Thiếu admin.html</p>"
