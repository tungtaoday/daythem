"""Báo cáo TUẦN — nhìn lại tuần qua bằng số thật + việc phải làm tuần này.

Khác bản tin ngày (`ops_digest.py`): bản ngày trả lời "hôm nay làm gì", bản tuần
trả lời **"tuần qua có làm được không, và tuần này phải làm gì"**.

Nguyên tắc: **TẤT ĐỊNH, không gọi AI.** Việc tuần lấy từ lộ trình cứng trong
`_PHASES` (chép từ docs thật), cộng thêm việc phát sinh từ dữ liệu sống
(hàng chờ reset, GV chưa rõ nguồn...). Sinh bằng LLM từng gây lỗi lặp lại nên
không dùng ở đây.

Phần "nhìn lại" chỉ chấm điểm những thứ **đo được từ DB**. Việc không đo được
thì liệt kê ra chứ không tự nhận là đã xong — báo cáo sai còn tệ hơn không có.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func, select

from daythem.adapters.orm import (
    LinkClickORM, PasswordResetRequestORM, PostLogORM, TeacherORM,
)
from daythem.service.activity import north_star

_VN_TZ = timezone(timedelta(hours=7))

# Mục tiêu tuần — dùng để chấm ✅/⚠️/❌ ở phần nhìn lại.
TARGET_POSTS_PER_WEEK = 5
TARGET_NEW_TEACHERS_PER_WEEK = 5
MAX_QUEUE_AGE_DAYS = 2      # yêu cầu reset tồn quá số ngày này là đang tắc


@dataclass
class Task:
    """Một việc phải làm. `source` để lần ngược về tài liệu gốc."""
    block: str
    text: str
    source: str = ""
    owner: str = "anh"      # "anh" = chủ tài khoản tự làm · "claude" = tôi làm được


@dataclass
class Phase:
    start: date
    end: date
    name: str
    tasks: list[Task] = field(default_factory=list)


# ── Lộ trình cứng, chép từ docs/ ────────────────────────────────────────────
# Sửa ở đây khi đổi kế hoạch. Không sinh động bằng AI — cố ý.
_PHASES: list[Phase] = [
    Phase(date(2026, 8, 3), date(2026, 8, 9), "Nộp hồ sơ & mở closed testing", [
        Task("Store", "Theo dõi duyệt Google Play Console (đã trả $25)",
             "docs/store-launch-checklist.md"),
        Task("Store", "Đăng ký Apple Developer $99/năm — iOS không vướng luật 14 ngày",
             "docs/store-launch-checklist.md"),
        Task("Store", "Build AAB production + tạo app trên Play Console",
             "docs/store-launch-checklist.md", owner="claude"),
        Task("Store", "Upload AAB vào Closed testing, mời 12+ tester",
             "docs/store-launch-checklist.md"),
        Task("Zalo OA", "Tạo OA loại Doanh nghiệp + NỘP XÁC THỰC (chờ 3–7 ngày, làm sớm)",
             "docs/zalo-oa-setup.md"),
        Task("Zalo OA", "Tạo app trên developers.zalo.me, lấy App ID + Secret",
             "docs/zalo-oa-setup.md"),
        Task("Kiếm khách", "Lọc danh bạ ra 40 tên, chia N1/N2/N3 — nhắn hết N1 trước",
             "docs/books/05 §A1"),
        Task("Kiếm khách", "Nhắn riêng 18–20 GV beta (dư 50% so với mức 12 bắt buộc). "
             "Nhóm lạ tối đa 10–15 người/ngày kẻo Zalo khoá", "docs/books/05 §A2"),
        Task("Kiếm khách", "Mỗi ngày trả lời 2 câu hỏi trong nhóm FB — chủ đề và mẫu trả lời "
             "có trong bản tin Telegram sáng", "docs/books/05 §B2"),
        Task("Kiếm khách", "Đăng bài XIN GIÚP (không phải bài bán hàng) vào 5 nhóm",
             "docs/books/05 §A-BIS"),
        Task("Kiếm khách", "Gọi kèm tay từng người vừa cài tới 'aha' đầu trong 24h",
             "docs/books/05 §A6"),
        Task("Bảo mật", "Vá: token không thu hồi khi đổi mật khẩu + OTP dùng `random`",
             "review 02/08", owner="claude"),
    ]),
    Phase(date(2026, 8, 10), date(2026, 8, 16), "Giữ tester & chuẩn bị bung kênh", [
        Task("Store", "Giữ đủ 12 tester opt-in LIÊN TỤC — ai gỡ app là đồng hồ reset",
             "docs/store-launch-checklist.md"),
        Task("Store", "Đủ 14 ngày → Apply for production trong Play Console",
             "docs/store-launch-checklist.md"),
        Task("Zalo OA", "Xác thực xong → tạo template ZNS loại OTP + nạp tiền",
             "docs/zalo-oa-setup.md"),
        Task("Sản phẩm", "Nối ZNS vào backend + đường lui SMS khi GV không dùng Zalo",
             "docs/zalo-oa-setup.md", owner="claude"),
        Task("Marketing", "Gom testimonial + video màn hình thật từ GV beta",
             "docs/store-launch-checklist.md"),
    ]),
    Phase(date(2026, 8, 17), date(2026, 8, 31), "Bung kênh 0đ", [
        Task("Store", "Play review → CH Play live; đổi landing sang badge 2 store thật",
             "docs/store-launch-checklist.md"),
        Task("Marketing", "Bung 5 group + nội dung pháp lý/thuế + TikTok, CTA = link store",
             "docs/marketing-daily-playbook.md"),
        Task("Sản phẩm", "Build referral 'Mời đồng nghiệp' đặt sau khoảnh khắc gửi thiệp",
             "docs/store-launch-checklist.md", owner="claude"),
    ]),
]

# Việc lặp mỗi tuần, không phụ thuộc giai đoạn.
_RECURRING: list[Task] = [
    Task("Vận hành", "Dọn hàng chờ reset/xoá tài khoản", "docs/books/02"),
    Task("Vận hành", "Kèm tay GV mới cài tới 'aha' đầu tiên", "docs/books/02"),
    Task("Marketing", f"Đăng đủ {TARGET_POSTS_PER_WEEK} bài group + ghi số vào /admin",
         "docs/marketing-daily-playbook.md"),
]

_DOW_VN = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"]


def _today_vn() -> date:
    return datetime.now(_VN_TZ).date()


def _week_bounds(today: date) -> tuple[date, date]:
    """Tuần hiện tại theo lịch VN: Thứ 2 → Chủ nhật."""
    monday = today - timedelta(days=today.weekday())
    return monday, monday + timedelta(days=6)


def _mark(actual: int, target: int) -> str:
    if actual >= target:
        return "✅"
    return "⚠️" if actual >= target * 0.5 else "❌"


def _lookback(session_factory, week_start: date) -> dict:
    """Đo tuần TRƯỚC bằng dữ liệu thật. Chỉ đo cái đo được."""
    prev_start = week_start - timedelta(days=7)
    prev_end = week_start - timedelta(days=1)
    s = session_factory()
    try:
        new_teachers = s.scalar(
            select(func.count()).select_from(TeacherORM)
            .where(TeacherORM.created_at >= datetime.combine(prev_start, datetime.min.time()))
            .where(TeacherORM.created_at < datetime.combine(week_start, datetime.min.time()))
        ) or 0
        posts = s.scalars(
            select(PostLogORM)
            .where(PostLogORM.post_date >= prev_start.isoformat())
            .where(PostLogORM.post_date <= prev_end.isoformat())
        ).all()
        clicks = s.scalar(
            select(func.count()).select_from(LinkClickORM)
            .where(LinkClickORM.created_at >= datetime.combine(prev_start, datetime.min.time()))
            .where(LinkClickORM.created_at < datetime.combine(week_start, datetime.min.time()))
        ) or 0
        stale = s.scalars(
            select(PasswordResetRequestORM)
            .where(PasswordResetRequestORM.status == "pending")
        ).all()
    finally:
        s.close()

    cutoff = datetime.now(_VN_TZ).replace(tzinfo=None) - timedelta(days=MAX_QUEUE_AGE_DAYS)
    return {
        "range": f"{prev_start.strftime('%d/%m')}–{prev_end.strftime('%d/%m')}",
        "new_teachers": new_teachers,
        "posts": len(posts),
        "reach": sum(p.reach for p in posts),
        "clicks": clicks,
        "queue_pending": len(stale),
        "queue_stale": sum(1 for r in stale if r.created_at < cutoff),
    }


def _dynamic_tasks(look: dict, ns: dict) -> list[Task]:
    """Việc phát sinh từ dữ liệu sống — chỉ hiện khi thật sự có vấn đề."""
    out: list[Task] = []
    if look["queue_stale"]:
        out.append(Task("⚠️ Đang tắc",
                        f"{look['queue_stale']} yêu cầu reset tồn quá {MAX_QUEUE_AGE_DAYS} ngày "
                        f"— GV đang chờ mà không biết bao giờ được", "hàng chờ"))
    if ns["wat"] < ns["target_min"]:
        out.append(Task("⚠️ Đang tắc",
                        f"North Star {ns['wat']}/{ns['target_min']} — chưa đủ GV dùng thật. "
                        f"Ưu tiên KÈM TAY người đã cài hơn là kéo thêm người mới", "north star"))
    if look["posts"] == 0:
        out.append(Task("⚠️ Đang tắc",
                        "Tuần qua KHÔNG đăng bài nào — phễu đầu vào đang đứng", "post log"))
    return out


def current_phase(today: date) -> Phase | None:
    for p in _PHASES:
        if p.start <= today <= p.end:
            return p
    return None


def build_weekly_report(session_factory) -> dict:
    """Trả dict {week, lookback, tasks, text} — `text` là HTML gọn cho Telegram."""
    today = _today_vn()
    week_start, week_end = _week_bounds(today)
    ns = north_star(session_factory)
    look = _lookback(session_factory, week_start)
    phase = current_phase(today)

    tasks = list(phase.tasks) if phase else []
    tasks += _RECURRING
    dynamic = _dynamic_tasks(look, ns)

    arrow = "▲" if ns["delta"] > 0 else ("▼" if ns["delta"] < 0 else "—")
    lines = [
        f"<b>📅 GieoChữ · BÁO CÁO TUẦN</b>",
        f"<i>{week_start.strftime('%d/%m')} – {week_end.strftime('%d/%m/%Y')}</i>",
    ]
    if phase:
        lines.append(f"<i>Giai đoạn: {phase.name}</i>")

    lines += [
        "",
        f"<b>★ NORTH STAR: {ns['wat']} GV dùng thật</b>",
        f"   {arrow} {abs(ns['delta'])} so với tuần trước · mục tiêu {ns['target_min']}–{ns['target_max']}",
        "",
        f"<b>🔍 NHÌN LẠI TUẦN QUA ({look['range']})</b>",
        f"{_mark(look['new_teachers'], TARGET_NEW_TEACHERS_PER_WEEK)} GV mới: "
        f"<b>{look['new_teachers']}</b>/{TARGET_NEW_TEACHERS_PER_WEEK}",
        f"{_mark(look['posts'], TARGET_POSTS_PER_WEEK)} Bài đăng: "
        f"<b>{look['posts']}</b>/{TARGET_POSTS_PER_WEEK} · {look['reach']} reach",
        f"{'✅' if look['clicks'] else '❌'} Click vào link: <b>{look['clicks']}</b>",
        f"{'✅' if not look['queue_stale'] else '❌'} Hàng chờ: {look['queue_pending']} chờ "
        f"({look['queue_stale']} quá hạn)",
    ]

    if dynamic:
        lines += ["", "<b>🚨 ĐANG TẮC — xử lý trước</b>"]
        lines += [f"• {t.text}" for t in dynamic]

    lines += ["", "<b>📋 VIỆC TUẦN NÀY</b>"]
    for block in dict.fromkeys(t.block for t in tasks):
        lines.append(f"\n<b>{block}</b>")
        for t in tasks:
            if t.block != block:
                continue
            who = "" if t.owner == "anh" else "  <i>(Claude làm được)</i>"
            lines.append(f"• {t.text}{who}")

    lines += ["", "<i>Việc lấy từ lộ trình cứng trong docs/ — không sinh bằng AI.</i>"]

    return {
        "week_start": week_start.isoformat(),
        "week_end": week_end.isoformat(),
        "phase": phase.name if phase else None,
        "north_star": ns,
        "lookback": look,
        "blocked": [{"block": t.block, "text": t.text} for t in dynamic],
        "tasks": [{"block": t.block, "text": t.text, "source": t.source, "owner": t.owner}
                  for t in tasks],
        "text": "\n".join(lines),
    }
