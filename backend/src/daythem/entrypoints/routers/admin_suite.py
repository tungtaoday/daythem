"""Hệ admin thống nhất — router cho 5 khu (BUC-UNIFIED-ADMIN-OPERATIONS).

Router CHỈ làm việc HTTP: parse, gọi service, trả JSON. Toàn bộ nghiệp vụ nằm ở
service (crm, admin_views, journey, gtm_plan) — đúng luật tầng của DayThem.
"""
from __future__ import annotations

import logging
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from daythem.config import settings
from daythem.entrypoints.deps import get_uow
from daythem.entrypoints.routers.admin import require_admin
from daythem.service import crm
from daythem.service.admin_views import attribution_build, overview_build

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin/suite", tags=["admin-suite"])

_KIND_HOP_LE = {"nhan", "huong", "xong", "bo"}


@router.get("/overview")
def suite_overview(_: bool = Depends(require_admin), uow=Depends(get_uow)):
    return overview_build(uow._session_factory)


@router.get("/crm")
def suite_crm(_: bool = Depends(require_admin), uow=Depends(get_uow)):
    return {"items": crm.queue(uow._session_factory)}


class ActBody(BaseModel):
    teacher_id: str
    kind: str


@router.post("/crm/act")
def suite_crm_act(body: ActBody, _: bool = Depends(require_admin), uow=Depends(get_uow)):
    if body.kind not in _KIND_HOP_LE:
        raise HTTPException(422, "kind phải là: nhan | huong | xong | bo")
    ok = crm.act(uow._session_factory, body.teacher_id, body.kind)
    if not ok:
        # EF2: KHÔNG giả vờ thành công — nút phía frontend giữ nguyên trạng thái.
        raise HTTPException(500, "Ghi chăm sóc thất bại, bấm lại giúp tôi")
    return {"ok": True}


@router.get("/attribution")
def suite_attribution(_: bool = Depends(require_admin), uow=Depends(get_uow)):
    return attribution_build(uow._session_factory)


def _fetch_intel() -> dict[str, Any]:
    """Kho lắng nghe nằm ở hệ marketing (DB riêng) → proxy HTTP nội bộ.

    Không nối chéo hai DB — cùng nguyên tắc với funnel_bridge chiều ngược lại.
    """
    base = getattr(settings, "MARKETING_API_BASE", "") or "http://127.0.0.1:8002"
    r = httpx.get(f"{base}/api/marketing/intel/dashboard", timeout=5)
    r.raise_for_status()
    return r.json()


@router.get("/strategy")
def suite_strategy(_: bool = Depends(require_admin), uow=Depends(get_uow)):
    """Khu Chiến lược & Lắng nghe. Kho lắng nghe chết KHÔNG kéo sập việc GTM (EF1)."""
    from daythem.service.gtm_plan import next_tasks, seed_tasks
    seed_tasks(uow._session_factory)
    viec = [{"key": t.key, "title": t.title, "why": t.why, "status": t.status}
            for t in next_tasks(uow._session_factory)]
    try:
        intel: dict[str, Any] = {"ok": True, **_fetch_intel()}
    except Exception as e:  # noqa: BLE001 — EF1: lỗi tại chỗ, khu vẫn sống
        logger.warning("suite: kho lang nghe loi: %s", e)
        intel = {"ok": False, "error": f"{type(e).__name__}: {str(e)[:120]}"}
    return {"viec": viec, "intel": intel}

class MarkBody(BaseModel):
    key: str
    status: str


@router.post("/strategy/mark")
def suite_strategy_mark(body: MarkBody, _: bool = Depends(require_admin), uow=Depends(get_uow)):
    """Đánh dấu tiến độ việc GTM — cùng nghiệp vụ với lệnh /xong của bot (BR1)."""
    if body.status not in ("done", "doing", "skip", "todo"):
        raise HTTPException(422, "status phải là: done | doing | skip | todo")
    from daythem.service.gtm_plan import mark
    try:
        kq = mark(uow._session_factory, body.key, body.status)
    except ValueError as e:            # mã việc không tồn tại
        raise HTTPException(404, str(e))
    return {"ok": True, **kq}


@router.get("/page")
def suite_page():
    """Trang một-cửa: 5 khu, mỗi khu tải độc lập (AC6)."""
    from pathlib import Path
    from fastapi.responses import HTMLResponse
    web = Path(__file__).resolve().parent.parent.parent / "web"
    try:
        return HTMLResponse((web / "suite.html").read_text(encoding="utf-8"))
    except FileNotFoundError:
        return HTMLResponse("<h1>Admin</h1><p>Thiếu suite.html</p>")
