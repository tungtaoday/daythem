"""Ops digest — gom KPI + hàng chờ + mốc store thành 1 bản tin cho Ops Cockpit / Telegram.

Dùng chung giữa endpoint /admin/digest và script cron gửi hằng ngày. Không phụ thuộc
FastAPI để cron gọi được trực tiếp.
"""
from __future__ import annotations
from datetime import date, datetime, timezone, timedelta

from sqlalchemy import select, func

from daythem.service.activity import activation_funnel, north_star
from daythem.service.gtm_plan import digest_lines as gtm_lines
from daythem.service.seeding import seeding_lines
from daythem.service.user_health import digest_lines as user_health_lines
from daythem.service.weekly_report import TARGET_POSTS_PER_WEEK
from daythem.adapters.orm import PasswordResetRequestORM, TrackedLinkORM, LinkClickORM, PostLogORM

_VN_TZ = timezone(timedelta(hours=7))

# Nhịp tuần rút gọn từ docs/books/00 (T2..CN) → việc gợi ý theo thứ trong tuần.
_WEEKLY = {
    0: ["Đo KPI tuần + lên lịch nội dung", "Dọn hàng chờ reset/xoá tài khoản"],
    1: ["Đăng group #1–2 (bài giá trị)", "Trả lời inbox trong 24h"],
    2: ["Quay + đăng 1 TikTok", "Kèm tay GV vừa cài tới 1 aha"],
    3: ["Đăng group #3–4 (pháp lý/thuế)", "Gom câu hỏi lặp lại từ GV"],
    4: ["TikTok #2 + đăng group #5", "Build APK preview nếu có bản mới"],
    5: ["Viết 1 bài blog SEO", "Gom testimonial GV hài lòng"],
    6: ["Nghỉ / tổng hợp phản hồi GV → dev"],
}
_DOW_VN = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"]

# Mốc store (từ docs/store-launch-checklist.md) — đếm ngược.
_MILESTONES = [
    ("Build APK/iOS (quota EAS reset)", date(2026, 8, 1)),
    ("iOS dự kiến live", date(2026, 8, 4)),
    ("Xin production CH Play", date(2026, 8, 15)),
    ("CH Play dự kiến live", date(2026, 8, 18)),
]


def _today_vn() -> date:
    return datetime.now(_VN_TZ).date()


def build_ops_digest(session_factory) -> dict:
    """Trả dict {kpi, queue, tasks, milestones, text} — text là bản HTML gọn cho Telegram."""
    today = _today_vn()
    funnel = activation_funnel(session_factory)
    ns = north_star(session_factory)

    # Hàng chờ đang chờ xử lý (reset + xoá tài khoản).
    session = session_factory()
    try:
        pending = session.scalar(
            select(func.count()).select_from(PasswordResetRequestORM)
            .where(PasswordResetRequestORM.status == "pending")
        ) or 0
        del_pending = session.scalar(
            select(func.count()).select_from(PasswordResetRequestORM)
            .where(PasswordResetRequestORM.status == "pending")
            .where(PasswordResetRequestORM.note.like("%[XOÁ TÀI KHOẢN]%"))
        ) or 0
    finally:
        session.close()

    # Click theo kênh trong 7 ngày qua (đo bài đăng nào kéo click).
    session = session_factory()
    try:
        since = datetime.now(_VN_TZ).replace(tzinfo=None) - timedelta(days=7)
        links = session.scalars(select(TrackedLinkORM)).all()
        link_rows = []
        for lk in links:
            wk = session.scalar(
                select(func.count()).select_from(LinkClickORM)
                .where(LinkClickORM.code == lk.code).where(LinkClickORM.created_at >= since)
            ) or 0
            link_rows.append({"code": lk.code, "label": lk.label, "clicks_7d": wk})
        link_rows.sort(key=lambda x: x["clicks_7d"], reverse=True)
        # Bài đăng thủ công 7 ngày (reach/comment/share nhìn tay).
        since_ymd = (datetime.now(_VN_TZ).replace(tzinfo=None) - timedelta(days=7)).strftime("%Y-%m-%d")
        plogs = session.scalars(select(PostLogORM).where(PostLogORM.post_date >= since_ymd)).all()
        post_week = {
            "posts": len(plogs),
            "reach": sum(p.reach for p in plogs),
            "comments": sum(p.comments for p in plogs),
            "shares": sum(p.shares for p in plogs),
        }
    finally:
        session.close()

    tasks = _WEEKLY.get(today.weekday(), [])
    milestones = [
        {"label": label, "date": d.isoformat(), "days": (d - today).days}
        for label, d in _MILESTONES if (d - today).days >= 0
    ]

    # Bản tin Telegram (HTML).
    arrow = "▲" if ns["delta"] > 0 else ("▼" if ns["delta"] < 0 else "—")
    lines = [
        f"<b>🌿 GieoChữ · Ops {_DOW_VN[today.weekday()]} {today.strftime('%d/%m')}</b>",
    ]

    # Việc hôm nay đặt TRÊN CÙNG, trên cả số liệu — đọc bản tin là biết ngay
    # phải làm gì, không phải cuộn qua bốn khối chỉ số mới thấy.
    lines += gtm_lines(session_factory)

    # Người dùng THẬT đặt ngay sau việc: ở quy mô vài người, biết đích danh ai
    # đang kẹt quan trọng hơn mọi biểu đồ phần trăm.
    lines += user_health_lines(session_factory)

    lines += [
        "",
        f"<b>★ NORTH STAR: {ns['wat']} GV dùng thật (7 ngày)</b>",
        f"   {arrow} {abs(ns['delta'])} so với tuần trước · mục tiêu {ns['target_min']}–{ns['target_max']}",
        "",
        "<b>📊 Kích hoạt (cộng dồn)</b>",
        f"• Giáo viên: <b>{funnel.get('total_teachers', 0)}</b>",
        f"• Tạo lớp: {funnel.get('created_class', 0)} ({funnel.get('created_class_pct', 0)}%)",
        f"• Làm hành động lõi: {funnel.get('did_core_action', 0)} ({funnel.get('did_core_action_pct', 0)}%)",
        f"• Kích hoạt 24h: {funnel.get('activated_24h', 0)} ({funnel.get('activated_24h_pct', 0)}%)",
        "",
        "<b>🔔 Hàng chờ xử lý</b>",
        f"• Reset mật khẩu: {pending - del_pending}",
        f"• Xoá tài khoản: {del_pending}",
        "",
        "<b>📋 Việc hôm nay</b>",
    ]
    lines += [f"• {t}" for t in tasks] or ["• (không có)"]

    # Seeding: việc kiếm khách hằng ngày ở giai đoạn 0 người dùng.
    monday = today - timedelta(days=today.weekday())
    posts_week = sum(1 for p in plogs if p.post_date >= monday.isoformat())
    lines += seeding_lines(today, posts_week, TARGET_POSTS_PER_WEEK)

    # Bài đã đăng gần đây — để biết đã seeding chỗ nào, khỏi đăng trùng nhóm.
    if plogs:
        lines += ["", "<b>📋 Bài đã đăng (7 ngày)</b>"]
        for p in sorted(plogs, key=lambda x: x.post_date, reverse=True)[:5]:
            d = "/".join(reversed(p.post_date.split("-")[1:]))
            lines.append(
                f"• {d} · {p.channel} · <i>{p.pillar}</i> — "
                f"{p.reach} reach · {p.comments} bl · {p.shares} chia sẻ"
            )
    else:
        lines += ["", "<b>📋 Bài đã đăng (7 ngày):</b> <b>chưa có bài nào</b> — phễu đầu vào đang đứng"]

    if link_rows:
        lines += ["", "<b>🔗 Click theo kênh (7 ngày)</b>"]
        lines += [f"• {r['label']}: <b>{r['clicks_7d']}</b>" for r in link_rows[:6]]
    if post_week["posts"]:
        lines += ["", "<b>📣 Bài đăng 7 ngày (nhập tay)</b>",
                  f"• {post_week['posts']} bài · {post_week['reach']} reach · "
                  f"{post_week['comments']} bình luận · {post_week['shares']} chia sẻ"]
    if milestones:
        m = milestones[0]
        lines += ["", f"<b>📅 Mốc gần nhất:</b> {m['label']} — còn <b>{m['days']}</b> ngày"]
    text = "\n".join(lines)

    return {
        "date": today.isoformat(),
        "dow": _DOW_VN[today.weekday()],
        "kpi": funnel,
        "north_star": ns,
        "queue": {"reset": pending - del_pending, "delete": del_pending, "total": pending},
        "tasks": tasks,
        "links": link_rows,
        "post_week": post_week,
        "milestones": milestones,
        "text": text,
    }
