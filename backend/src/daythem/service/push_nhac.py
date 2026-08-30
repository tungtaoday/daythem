"""Push nhắc buổi dạy — mảnh còn thiếu của vòng giữ chân.

Bối cảnh: app đã thu push token (8/11 GV thật có), có màn cài đặt thông báo,
có bảng notif_events — nhưng chưa từng có mã nào GỬI push. Giáo viên tạo lớp
có lịch hẳn hoi mà không bao giờ được nhắc "sắp tới giờ dạy", nên app không có
lý do gì để họ mở lại. Trong khi kênh chăm sóc ngoài (Zalo) thì tin từ người
lạ rơi vào hộp ẩn, không ai thấy.

Nguyên tắc:
- CHỈ nhắc tiện ích gắn với dữ liệu của chính họ (buổi dạy theo lịch họ tự đặt),
  không push quảng cáo.
- Tôn trọng cài đặt: notif_attendance tắt là không gửi; giờ DND không gửi;
  ngoài 06:00–21:30 VN không gửi bất kể cấu hình.
- Chống dội: mỗi lớp mỗi ngày nhắc đúng 1 lần (dedupe qua notif_events);
  mỗi GV tối đa 3 push/ngày.
- Mọi lần gửi ghi vào notif_events — nền cho mô hình chống mệt mỏi sau này.
"""
from __future__ import annotations

import json
import logging
import urllib.request
import uuid
from datetime import datetime, timedelta, timezone
from typing import Callable

from sqlalchemy import select

from daythem.adapters.orm import ClassORM, NotifEventORM, TeacherORM

logger = logging.getLogger(__name__)

_VN = timezone(timedelta(hours=7))
_EXPO_URL = "https://exp.host/--/api/v2/push/send"

# Nhắc trong cửa sổ [0, 120] phút trước giờ dạy. Cron chạy mỗi giờ nên mỗi buổi
# rơi vào cửa sổ 1–2 lần; dedupe đảm bảo chỉ gửi 1.
_CUA_SO_PHUT = 120
_TOI_DA_MOI_NGAY = 3


def _gui_expo(token: str, title: str, body: str) -> bool:
    """Gửi 1 push qua Expo. Trả False nếu lỗi — không ném ra ngoài."""
    data = json.dumps({"to": token, "title": title, "body": body,
                       "sound": "default"}).encode()
    req = urllib.request.Request(
        _EXPO_URL, data=data,
        headers={"Content-Type": "application/json", "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            out = json.loads(r.read().decode())
        st = (out.get("data") or {}).get("status")
        return st == "ok"
    except Exception as e:  # noqa: BLE001
        logger.warning("expo push lỗi: %s", e)
        return False


def _trong_dnd(t: TeacherORM, gio_phut: str) -> bool:
    """Giờ hiện tại (HH:MM) có nằm trong khung im lặng của GV không."""
    if not t.dnd_start or not t.dnd_end:
        return False
    a, b = t.dnd_start, t.dnd_end
    if a <= b:
        return a <= gio_phut < b
    return gio_phut >= a or gio_phut < b     # khung vắt qua nửa đêm (vd 22:00–06:00)


def _rule_key(class_id: str, ngay: str) -> str:
    # NotifEventORM.rule tối đa 40 ký tự → nén: nb:8-ký-tự-đầu-id:MMDD
    return f"nb:{class_id[:8]}:{ngay[5:7]}{ngay[8:10]}"


def nhac_buoi_day(session_factory, now: datetime | None = None,
                  sender: Callable[[str, str, str], bool] = _gui_expo) -> dict:
    """Quét lịch mọi lớp, gửi nhắc cho buổi sắp diễn ra. Trả thống kê.

    `now`/`sender` tách ra để test được — test không bao giờ gọi Expo thật.
    """
    now = now or datetime.now(_VN)
    if now.tzinfo is None:
        now = now.replace(tzinfo=_VN)
    gio_phut = now.strftime("%H:%M")
    ngay = now.strftime("%Y-%m-%d")
    thu = now.isoweekday()                    # 1=T2 … 7=CN — trùng quy ước app

    kq = {"xet": 0, "gui": 0, "bo_qua": []}
    if not ("06:00" <= gio_phut <= "21:30"):
        kq["bo_qua"].append("ngoai gio cho phep")
        return kq

    s = session_factory()
    try:
        teachers = s.scalars(select(TeacherORM).where(TeacherORM.push_token.isnot(None))).all()
        for t in teachers:
            if not t.notif_attendance or _trong_dnd(t, gio_phut):
                continue
            so_hom_nay = len(s.scalars(
                select(NotifEventORM).where(NotifEventORM.teacher_id == t.id)
                .where(NotifEventORM.rule.like(f"nb:%:{ngay[5:7]}{ngay[8:10]}"))
            ).all())
            for c in s.scalars(select(ClassORM).where(ClassORM.teacher_id == t.id)
                               .where(ClassORM.archived == False)).all():   # noqa: E712
                sch = c.schedule or {}
                days = sch.get("days") or ([sch.get("day")] if sch.get("day") else [])
                start = sch.get("start_time")
                if thu not in days or not start:
                    continue
                kq["xet"] += 1
                try:
                    gio_hoc = now.replace(hour=int(start[:2]), minute=int(start[3:5]),
                                          second=0, microsecond=0)
                except (ValueError, TypeError):
                    continue
                delta = (gio_hoc - now).total_seconds() / 60
                if not (0 <= delta <= _CUA_SO_PHUT):
                    continue
                rule = _rule_key(c.id, ngay)
                if s.scalar(select(NotifEventORM)
                            .where(NotifEventORM.teacher_id == t.id)
                            .where(NotifEventORM.rule == rule)):
                    continue                   # buổi này hôm nay đã nhắc rồi
                if so_hom_nay >= _TOI_DA_MOI_NGAY:
                    continue
                ok = sender(t.push_token,
                            f"Buổi {c.name} lúc {start}",
                            "Sắp tới giờ dạy — điểm danh chỉ một chạm 🌿")
                if ok:
                    s.add(NotifEventORM(id=str(uuid.uuid4()), teacher_id=t.id,
                                        channel="utility", rule=rule,
                                        event_type="delivered"))
                    s.commit()
                    so_hom_nay += 1
                    kq["gui"] += 1
    finally:
        s.close()
    return kq
