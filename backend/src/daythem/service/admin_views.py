"""Read model cho hệ admin thống nhất — CHỈ ĐỌC, tổng hợp từ bảng sẵn có.

Cố ý không sinh bảng mới: mọi nguồn sự thật (teachers, activity_events, outreach,
plan_tasks) đã tồn tại và đang được Telegram dùng. Sinh bảng tổng hợp là sinh
thêm chỗ lệch — vi phạm BR1 "một sổ nhiều cửa" của BUC-UNIFIED-ADMIN-OPERATIONS.
"""
from __future__ import annotations

import logging
from collections import Counter
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from daythem.adapters.orm import ActivityEventORM, ClassORM, TeacherORM
from daythem.service import crm
from daythem.service.activity import CORE_KINDS
from daythem.service.user_health import is_real

logger = logging.getLogger(__name__)
_VN = timedelta(hours=7)

# Thứ tự cố định để bảng phễu ổn định giữa các lần tải (không nhảy dòng).
NGUON_HOP_LE = ("fb_ads", "fb_group", "gioi_thieu", "store_search", "khac")


def _gv_that(s) -> list[TeacherORM]:
    return [t for t in s.scalars(select(TeacherORM)).all() if is_real(t)]


def overview_build(session_factory) -> dict:
    """Khu Tổng quan: 5 con số hành động + cờ yên ắng (BR4, BR7, AF3).

    Mỗi nhánh nguồn dữ liệu bọc riêng: nhánh nào gãy thì trường đó mang cờ lỗi,
    các trường khác vẫn về đích (AC6 — không sập cả màn vì một nguồn).
    """
    out: dict = {"loi": []}
    s = session_factory()
    try:
        gv = _gv_that(s)
        out["gv_that"] = len(gv)
        gv_ids = {t.id for t in gv}

        # Đang dùng đều = ≥1 hành động lõi trong 7 ngày (định nghĩa North Star).
        moc7 = datetime.utcnow() - timedelta(days=7)
        evs = s.scalars(select(ActivityEventORM)
                        .where(ActivityEventORM.created_at >= moc7)).all()
        out["dang_dung_deu"] = len({e.teacher_id for e in evs
                                    if e.kind in CORE_KINDS and e.teacher_id in gv_ids})

        # Đăng ký 7 ngày (ngày VN, cũ → mới) + nguồn của NGÀY HÔM NAY.
        hom_nay = (datetime.utcnow() + _VN).date()
        dem = Counter((t.created_at + _VN).date() for t in gv)
        out["dang_ky_7_ngay"] = [dem.get(hom_nay - timedelta(days=i), 0)
                                 for i in range(6, -1, -1)]
        out["nguon_hom_nay"] = dict(Counter(
            (t.source or "chua_khai") for t in gv
            if (t.created_at + _VN).date() == hom_nay))
    finally:
        s.close()

    try:
        out["cho_cham_soc"] = len(crm.queue(session_factory))
    except Exception as e:  # noqa: BLE001 — AC6: khu khác vẫn phải sống
        logger.warning("overview: hang doi CRM loi: %s", e)
        out["cho_cham_soc"] = 0
        out["loi"].append("crm")

    try:
        from daythem.service.gtm_plan import next_tasks, seed_tasks
        seed_tasks(session_factory)
        out["viec_ke_tiep"] = len(next_tasks(session_factory))
    except Exception as e:  # noqa: BLE001
        logger.warning("overview: ke hoach GTM loi: %s", e)
        out["viec_ke_tiep"] = 0
        out["loi"].append("gtm")

    # AF3 "ngày yên ắng": không ai chờ chăm sóc và hôm nay chưa có đăng ký mới.
    out["yen_ang"] = out["cho_cham_soc"] == 0 and out["dang_ky_7_ngay"][-1] == 0
    return out


def attribution_build(session_factory) -> dict:
    """Khu Marketing: phễu nguồn tự khai → đăng ký → tạo lớp → kích hoạt (BR5).

    CHỈ đọc teacher.source — tuyệt đối không suy diễn nguồn từ tín hiệu khác.
    Người chưa khai tách RIÊNG: trộn vào "khác" là thổi phồng một nguồn thật.
    """
    s = session_factory()
    try:
        gv = _gv_that(s)
        co_lop = {c.teacher_id for c in s.scalars(select(ClassORM)).all()}
        kich_hoat = {e.teacher_id for e in s.scalars(select(ActivityEventORM)).all()
                     if e.kind in CORE_KINDS}
    finally:
        s.close()

    rows = []
    for nguon in NGUON_HOP_LE:
        nhom = [t for t in gv if t.source == nguon]
        if not nhom:
            continue                      # BR7: không hiện dòng 0-0-0 vô nghĩa
        rows.append({
            "nguon": nguon,
            "dang_ky": len(nhom),
            "tao_lop": sum(1 for t in nhom if t.id in co_lop),
            "kich_hoat": sum(1 for t in nhom if t.id in kich_hoat),
        })
    return {"rows": rows,
            "chua_khai_nguon": sum(1 for t in gv if not t.source)}
