"""Bước chân của giáo viên trong app: đi qua màn nào, bấm gì, bỏ ở đâu.

Vì sao cần, khi đã có `activity.py`: bảng activity_events chỉ ghi 8 việc LÕI đã
làm xong (tạo lớp, điểm danh, thu phí...). Nó trả lời "ai làm được gì", nhưng câm
trước câu quan trọng hơn ở giai đoạn này — **người bỏ cuộc đã đi tới đâu rồi quay
đầu**. Cô Quỳnh không sinh ra một event lõi nào, nên trong hệ cũ cô ấy chỉ là một
dòng trống; phải mò log Apache mới dựng lại được 67 giây của cô ấy.

Bảng ui_events lấp đúng khoảng đó, và CỐ Ý tách riêng để không làm bẩn phễu.
"""
from __future__ import annotations

import logging
import uuid
from collections import Counter
from dataclasses import dataclass, field
from datetime import datetime, timedelta

from sqlalchemy import func, select

from daythem.adapters.orm import UiEventORM

logger = logging.getLogger(__name__)

# Chặn rác/độc: chỉ nhận màn hình app thật sự có. Client báo tên lạ → bỏ qua,
# khỏi để một bản client lỗi (hoặc ai đó gọi tay API) bơm rác vào bảng.
# Lấy ĐÚNG theo tên route trong mobile/src/navigation/index.tsx. Danh sách này
# phải khớp tuyệt đối — tên không khớp là bước chân ở màn đó bị bỏ im lặng, lỗi
# không ai thấy cho tới lúc đọc báo cáo và tưởng màn đó không ai vào.
# test_journey.py có bài kiểm tự đối chiếu với file navigation để chặn lệch.
KNOWN_SCREENS = {
    "Welcome", "Password", "ForgotPassword", "Setup", "Legal", "MainTabs",
    "Home", "Classes", "Students", "Tuition", "Reports",
    "CreateClass", "ClassDetail", "ClassStudents", "ClassSettings",
    "ClassTuition", "ClassReport", "ArchivedClasses",
    "Attendance", "CancelClass", "MakeupPoll",
    "Profile", "Calendar", "Tax", "NotificationSettings",
}

MAX_BATCH = 50          # 1 lần gửi tối đa 50 bước, chống bơm rác
_MAX_ACTION_LEN = 60


def record_steps(session_factory, teacher_id: str, steps: list[dict],
                 platform: str = "", app_version: str = "") -> int:
    """Ghi 1 lô bước chân. Nuốt mọi lỗi — đo đạc KHÔNG được làm hỏng app của GV."""
    if not teacher_id or not steps:
        return 0
    saved = 0
    try:
        s = session_factory()
        try:
            for st in steps[:MAX_BATCH]:
                screen = (st.get("screen") or "").strip()
                if screen not in KNOWN_SCREENS:
                    continue
                action = (st.get("action") or "").strip()[:_MAX_ACTION_LEN] or None
                ts = st.get("at")
                created = None
                if ts:
                    try:
                        created = datetime.fromisoformat(str(ts).replace("Z", "+00:00")).replace(tzinfo=None)
                    except ValueError:
                        created = None
                s.add(UiEventORM(
                    id=str(uuid.uuid4()), teacher_id=teacher_id, screen=screen,
                    action=action, session_id=(st.get("session_id") or None),
                    platform=platform[:12] or None, app_version=app_version[:20] or None,
                    created_at=created or datetime.utcnow(),
                ))
                saved += 1
            s.commit()
        finally:
            s.close()
    except Exception:
        logger.warning("record_steps bỏ qua — không chặn thao tác của GV")
        return 0
    return saved


@dataclass
class Session:
    """Một phiên mở app, đã ghép lại thành đường đi đọc được."""
    session_id: str
    started: datetime
    ended: datetime
    steps: list[str] = field(default_factory=list)   # "Home", "Classes · bấm tạo lớp"
    screens: int = 0
    actions: int = 0

    @property
    def seconds(self) -> int:
        return max(0, int((self.ended - self.started).total_seconds()))

    @property
    def bounced(self) -> bool:
        """Mở app rồi thoát mà không bấm gì — dấu hiệu lạc đường, không phải lười."""
        return self.actions == 0


def sessions_of(session_factory, teacher_id: str, limit: int = 12) -> list[Session]:
    """Các phiên gần nhất của một GV, mới nhất trước."""
    s = session_factory()
    try:
        rows = s.scalars(
            select(UiEventORM).where(UiEventORM.teacher_id == teacher_id)
            .order_by(UiEventORM.created_at)
        ).all()
    finally:
        s.close()

    buckets: dict[str, list[UiEventORM]] = {}
    for e in rows:
        buckets.setdefault(e.session_id or f"_{e.created_at:%Y%m%d%H}", []).append(e)

    out: list[Session] = []
    for sid, evs in buckets.items():
        evs.sort(key=lambda x: x.created_at)
        sess = Session(session_id=sid, started=evs[0].created_at, ended=evs[-1].created_at)
        last = None
        for e in evs:
            label = f"{e.screen} · {e.action}" if e.action else e.screen
            if e.action:
                sess.actions += 1
            else:
                sess.screens += 1
                if last == e.screen:      # gộp lần mở lại liên tiếp cùng màn
                    continue
            sess.steps.append(label)
            last = e.screen if not e.action else last
        out.append(sess)

    out.sort(key=lambda x: x.started, reverse=True)
    return out[:limit]


def drop_off(session_factory, days: int = 30) -> list[dict]:
    """Màn hình nào hay là ĐIỂM DỪNG CUỐI của một phiên — nơi người ta bỏ đi.

    Đây là con số đáng nhìn nhất của cả file: không phải "màn nào xem nhiều"
    (màn nào cũng nhiều), mà "màn nào người ta nhìn xong rồi thoát".
    """
    since = datetime.utcnow() - timedelta(days=days)
    s = session_factory()
    try:
        rows = s.scalars(
            select(UiEventORM).where(UiEventORM.created_at >= since)
            .order_by(UiEventORM.created_at)
        ).all()
    finally:
        s.close()

    last_of: dict[str, UiEventORM] = {}
    seen: Counter[str] = Counter()
    for e in rows:
        key = e.session_id or f"{e.teacher_id}_{e.created_at:%Y%m%d%H}"
        last_of[key] = e
        seen[e.screen] += 1

    ends: Counter[str] = Counter(e.screen for e in last_of.values())
    out = [
        {"screen": scr, "ends": n, "views": seen[scr],
         "end_rate": round(100 * n / seen[scr]) if seen[scr] else 0}
        for scr, n in ends.items()
    ]
    out.sort(key=lambda r: (-r["ends"], -r["end_rate"]))
    return out


def digest_lines(session_factory, days: int = 7) -> list[str]:
    """Khối 'Bước chân' cho bản tin Telegram — chỉ nói điều đáng hành động."""
    rows = drop_off(session_factory, days=days)
    if not rows:
        return ["", "<b>👣 BƯỚC CHÂN:</b> chưa có dữ liệu — app chưa gửi hoặc chưa ai mở"]
    lines = ["", f"<b>👣 BƯỚC CHÂN ({days} ngày)</b>"]
    for r in rows[:5]:
        lines.append(f"• <b>{r['screen']}</b> — {r['ends']} phiên kết thúc tại đây "
                     f"({r['end_rate']}% lượt mở màn này)")
    worst = rows[0]
    if worst["end_rate"] >= 50 and worst["ends"] >= 3:
        lines.append(f"    ⚠️ <i>{worst['screen']} đang là ngõ cụt — quá nửa người mở màn này rồi thoát</i>")
    return lines
