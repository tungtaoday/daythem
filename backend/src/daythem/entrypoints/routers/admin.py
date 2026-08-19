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
from daythem.phone import normalize_phone
from daythem.entrypoints.security import create_token, decode_token
from daythem.entrypoints.ratelimit import rate_limit, _client_ip
from daythem.entrypoints.deps import get_uow
from daythem.service.unit_of_work import SqlAlchemyUnitOfWork
from daythem.service.activity import activation_funnel, north_star, attribution
from daythem.service.ops_digest import build_ops_digest
from daythem.service.weekly_report import build_weekly_report
from daythem.adapters.telegram import notify
from daythem.service.handlers import _hash_password
from daythem.adapters.orm import (
    TeacherORM, ClassORM, StudentORM, PasswordResetRequestORM,
    TrackedLinkORM, LinkClickORM, PostLogORM,
)
import uuid as _uuid

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


@router.get("/admin/north-star")
def admin_north_star(_: bool = Depends(require_admin), uow: SqlAlchemyUnitOfWork = Depends(get_uow)):
    """★ North Star: số GV dùng THẬT trong 7 ngày qua (WAT) + xu hướng 4 tuần."""
    return north_star(uow._session_factory)


@router.get("/admin/attribution")
def admin_attribution(_: bool = Depends(require_admin), uow: SqlAlchemyUnitOfWork = Depends(get_uow)):
    """★ Kênh nào ra người dùng THẬT: click → đăng ký → kích hoạt → còn dùng."""
    return attribution(uow._session_factory)


class SourceBody(BaseModel):
    source: str | None = None
    source_note: str | None = None


@router.put("/admin/teacher/{teacher_id}/source")
def admin_set_source(teacher_id: str, body: SourceBody, _: bool = Depends(require_admin),
                     uow: SqlAlchemyUnitOfWork = Depends(get_uow)):
    """Owner gán nguồn cho GV được onboard thủ công qua Zalo (app không tự biết)."""
    with uow:
        t = uow._session.get(TeacherORM, teacher_id)
        if not t:
            raise HTTPException(404, "Không tìm thấy giáo viên")
        t.source = (body.source or "").strip().lower().replace(" ", "_")[:40] or None
        t.source_note = (body.source_note or "").strip()[:200] or None
        uow.commit()
    return {"ok": True, "source": t.source}


@router.get("/admin/digest")
def admin_digest(_: bool = Depends(require_admin), uow: SqlAlchemyUnitOfWork = Depends(get_uow)):
    """Bản tin vận hành: KPI + hàng chờ + việc hôm nay + mốc store (cho Ops Cockpit)."""
    return build_ops_digest(uow._session_factory)


@router.post("/admin/digest/send")
def admin_digest_send(_: bool = Depends(require_admin), uow: SqlAlchemyUnitOfWork = Depends(get_uow)):
    """Gửi bản tin về Telegram của owner ngay bây giờ. Báo rõ nếu chưa cấu hình token."""
    if not settings.TELEGRAM_BOT_TOKEN or not settings.TELEGRAM_CHAT_ID:
        return {"ok": False, "configured": False,
                "detail": "Chưa cấu hình TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID trong .env"}
    digest = build_ops_digest(uow._session_factory)
    notify(digest["text"])
    return {"ok": True, "configured": True}


@router.get("/admin/weekly-report")
def admin_weekly_report(_: bool = Depends(require_admin), uow: SqlAlchemyUnitOfWork = Depends(get_uow)):
    """Báo cáo tuần: nhìn lại tuần qua bằng số thật + việc phải làm tuần này."""
    return build_weekly_report(uow._session_factory)


@router.post("/admin/weekly-report/send")
def admin_weekly_report_send(_: bool = Depends(require_admin), uow: SqlAlchemyUnitOfWork = Depends(get_uow)):
    """Gửi báo cáo tuần về Telegram ngay bây giờ (không chờ tới sáng Thứ 2)."""
    if not settings.TELEGRAM_BOT_TOKEN or not settings.TELEGRAM_CHAT_ID:
        return {"ok": False, "configured": False,
                "detail": "Chưa cấu hình TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID trong .env"}
    report = build_weekly_report(uow._session_factory)
    notify(report["text"])
    return {"ok": True, "configured": True}


class TrackedLinkBody(BaseModel):
    code: str
    label: str
    target: str


@router.get("/admin/links")
def admin_links(_: bool = Depends(require_admin), uow: SqlAlchemyUnitOfWork = Depends(get_uow)):
    """Danh sách link theo dõi + tổng click + click 7 ngày qua (đo attribution kênh)."""
    since = datetime.utcnow() - timedelta(days=7)
    with uow:
        s = uow._session
        links = s.scalars(select(TrackedLinkORM).order_by(desc(TrackedLinkORM.created_at))).all()
        out = []
        for lk in links:
            total = s.scalar(select(func.count()).select_from(LinkClickORM).where(LinkClickORM.code == lk.code)) or 0
            wk = s.scalar(
                select(func.count()).select_from(LinkClickORM)
                .where(LinkClickORM.code == lk.code).where(LinkClickORM.created_at >= since)
            ) or 0
            out.append({
                "code": lk.code, "label": lk.label, "target": lk.target,
                "url": f"https://gieochu.vn/r/{lk.code}", "clicks": total, "clicks_7d": wk,
            })
    return {"items": out, "total": len(out)}


@router.post("/admin/links")
def admin_create_link(body: TrackedLinkBody, _: bool = Depends(require_admin),
                      uow: SqlAlchemyUnitOfWork = Depends(get_uow)):
    """Tạo/cập nhật 1 link theo dõi. code = mã kênh (vd g1, tiktok, fanpage)."""
    code = (body.code or "").strip().lower().replace(" ", "-")
    if not code:
        raise HTTPException(422, "Thiếu mã link")
    with uow:
        lk = uow._session.get(TrackedLinkORM, code)
        if lk:
            lk.label = body.label; lk.target = body.target
        else:
            uow._session.add(TrackedLinkORM(code=code, label=body.label, target=body.target))
        uow.commit()
    return {"ok": True, "url": f"https://gieochu.vn/r/{code}"}


class PostLogBody(BaseModel):
    post_date: str
    channel: str
    pillar: str | None = None
    reach: int = 0
    comments: int = 0
    shares: int = 0
    link_code: str | None = None
    note: str | None = None


@router.post("/admin/postlog")
def admin_create_postlog(body: PostLogBody, _: bool = Depends(require_admin),
                         uow: SqlAlchemyUnitOfWork = Depends(get_uow)):
    """Ghi 1 bài đăng thủ công (reach/comment/share nhìn tay từ FB/TikTok)."""
    if not (body.channel or "").strip():
        raise HTTPException(422, "Thiếu kênh")
    with uow:
        uow._session.add(PostLogORM(
            id=str(_uuid.uuid4()), post_date=body.post_date, channel=body.channel.strip(),
            pillar=body.pillar, reach=body.reach, comments=body.comments, shares=body.shares,
            link_code=body.link_code, note=body.note,
        ))
        uow.commit()
    return {"ok": True}


@router.get("/admin/postlog")
def admin_postlog(limit: int = 30, _: bool = Depends(require_admin),
                  uow: SqlAlchemyUnitOfWork = Depends(get_uow)):
    """Danh sách bài đăng gần đây + tổng reach/comment/share 7 ngày qua."""
    limit = max(1, min(limit, 100))
    since = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d")
    with uow:
        s = uow._session
        rows = s.scalars(select(PostLogORM).order_by(desc(PostLogORM.post_date), desc(PostLogORM.created_at)).limit(limit)).all()
        items = [{
            "id": r.id, "post_date": r.post_date, "channel": r.channel, "pillar": r.pillar,
            "reach": r.reach, "comments": r.comments, "shares": r.shares,
            "link_code": r.link_code, "note": r.note,
        } for r in rows]
        wk = [r for r in rows if r.post_date >= since]
        week = {
            "posts": len(wk),
            "reach": sum(r.reach for r in wk),
            "comments": sum(r.comments for r in wk),
            "shares": sum(r.shares for r in wk),
        }
    return {"items": items, "week": week}


@router.delete("/admin/postlog/{log_id}")
def admin_delete_postlog(log_id: str, _: bool = Depends(require_admin),
                         uow: SqlAlchemyUnitOfWork = Depends(get_uow)):
    with uow:
        row = uow._session.get(PostLogORM, log_id)
        if row:
            uow._session.delete(row)
            uow.commit()
    return {"ok": True}


@router.get("/admin/ops", response_class=HTMLResponse)
def ops_page() -> str:
    try:
        return (_WEB / "ops.html").read_text(encoding="utf-8")
    except FileNotFoundError:
        return "<h1>Ops Cockpit</h1><p>Thiếu ops.html</p>"


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


@router.get("/admin/users")
def admin_users(_: bool = Depends(require_admin), uow: SqlAlchemyUnitOfWork = Depends(get_uow)):
    """Sức khoẻ từng giáo viên THẬT: dùng tính năng nào, kẹt ở đâu, nên làm gì.

    Khác /admin/activation (đo tỷ lệ trên toàn bộ tài khoản): endpoint này LOẠI
    tài khoản thử/seed/tester đổi chéo, và trả về theo từng người — vì ở quy mô
    vài người dùng thì tên riêng có ích hơn phần trăm.
    """
    from dataclasses import asdict

    from daythem.service.user_health import user_list
    d = user_list(uow._session_factory)
    return {
        "real_total": d["real_total"],
        "real_active": d["real_active"],
        "excluded": d["excluded"],
        "users": [asdict(u) for u in d["users"]],
    }


@router.get("/admin/journey")
def admin_journey(
    teacher_id: str = "",
    days: int = 30,
    _: bool = Depends(require_admin),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
):
    """Bước chân trong app: đường đi từng phiên + màn nào hay là ngõ cụt.

    Không có teacher_id → chỉ trả bảng ngõ cụt (nhìn toàn cục).
    Có teacher_id → trả thêm các phiên gần nhất của đúng người đó.
    """
    from dataclasses import asdict

    from daythem.service.journey import drop_off, sessions_of

    out: dict = {"drop_off": drop_off(uow._session_factory, days=days)}
    if teacher_id:
        out["sessions"] = [
            {**asdict(s), "seconds": s.seconds, "bounced": s.bounced}
            for s in sessions_of(uow._session_factory, teacher_id)
        ]
    return out


@router.get("/admin/users/page", response_class=HTMLResponse)
def admin_users_page() -> str:
    # Trang tự gọi /admin/users bằng token trong localStorage (như ops.html).
    try:
        return (_WEB / "users.html").read_text(encoding="utf-8")
    except FileNotFoundError:
        return "<h1>Người dùng</h1><p>Thiếu users.html</p>"


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
            # Yêu cầu cũ có thể lưu SĐT dạng thô ("+8490...") → chuẩn hoá khi đối chiếu,
            # nếu không owner sẽ thấy "chưa có tài khoản" cho GV thật sự đã đăng ký.
            t = s.scalar(select(TeacherORM).where(
                TeacherORM.phone == normalize_phone(r.phone)))
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
    phone = normalize_phone(body.phone)
    with uow:
        s = uow._session
        teacher = s.scalar(select(TeacherORM).where(TeacherORM.phone == phone))
        if not teacher:
            raise HTTPException(404, f"Không tìm thấy giáo viên với SĐT {phone}")
        teacher.password_hash = _hash_password(body.new_password)
        # Đóng cả yêu cầu lưu dạng thô lẫn dạng chuẩn (dữ liệu cũ trước khi chuẩn hoá).
        reqs = [
            r for r in s.scalars(
                select(PasswordResetRequestORM).where(
                    PasswordResetRequestORM.status == "pending")
            ).all()
            if normalize_phone(r.phone) == phone
        ]
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
