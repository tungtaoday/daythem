"""Vòng lặp growth hacking: ghi thử nghiệm → bảng điểm tuần → khối dán cho Claude.

Ba khâu của vòng lặp và ai làm gì:
  1. THỬ    — anh Tùng đăng bài, ghi lại bằng /post trong Telegram (10 giây)
  2. ĐO     — hệ thống tự: click theo mã link, đăng ký theo source, WAT
  3. CHỈNH  — Thứ 2 dán "khối cho Claude" vào chat; Claude sửa trọng số chủ đề,
              thứ tự bài, kế hoạch — RỒI DEPLOY. Con người + Claude quyết,
              không để LLM tự chỉnh chiến lược (nguyên tắc tất định của dự án).

Không có khâu 1 thì khâu 2-3 đói dữ liệu — vì vậy /post phải RẺ nhất có thể:
gõ được một tay trên điện thoại, ngay sau khi bấm Đăng trên Facebook.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select

from daythem.adapters.orm import LinkClickORM, PostLogORM, TeacherORM
from daythem.service.activity import north_star
from daythem.service.seeding import GROUPS, TOPICS

_VN_TZ = timezone(timedelta(hours=7))

# Kênh gõ tắt được từ điện thoại. g1..g5 theo đúng thứ tự GROUPS trong seeding.py.
CHANNELS: dict[str, str] = {
    **{f"g{i+1}": g.name for i, g in enumerate(GROUPS)},
    "fb": "Fanpage GieoChuVN",
    "tt": "TikTok",
    "zl": "Zalo",
}

# Trụ nội dung = các chủ đề seeding + hai loại riêng của fanpage.
PILLARS: dict[str, str] = {
    **{k: t.name for k, t in TOPICS.items()},
    "gioithieu": "Giới thiệu app",
    "khac": "Khác",
}


def _now_vn() -> datetime:
    return datetime.now(_VN_TZ).replace(tzinfo=None)


def log_post(session_factory, channel_key: str, pillar_key: str,
             link_code: str | None = None, note: str | None = None) -> dict:
    """Ghi một bài vừa đăng. Raise ValueError với thông điệp chỉ đường khi gõ sai."""
    ch = channel_key.strip().lower()
    pi = pillar_key.strip().lower()
    if ch not in CHANNELS:
        raise ValueError(
            f"Kênh {ch!r} không có. Dùng: " + " ".join(sorted(CHANNELS)))
    if pi not in PILLARS:
        raise ValueError(
            f"Trụ {pi!r} không có. Dùng: " + " ".join(sorted(PILLARS)))
    s = session_factory()
    try:
        s.add(PostLogORM(
            id=str(uuid.uuid4()),
            post_date=_now_vn().strftime("%Y-%m-%d"),
            channel=CHANNELS[ch],
            pillar=PILLARS[pi],
            link_code=(link_code or "").strip() or None,
            note=(note or "").strip() or None,
        ))
        s.commit()
    finally:
        s.close()
    return {"channel": CHANNELS[ch], "pillar": PILLARS[pi], "link_code": link_code}


def set_last_post_metrics(session_factory, reach: int, comments: int, shares: int) -> dict:
    """Cập nhật số đo (nhìn tay từ FB) cho BÀI GHI GẦN NHẤT — tối ưu cho điện thoại."""
    s = session_factory()
    try:
        row = s.scalars(
            select(PostLogORM).order_by(PostLogORM.created_at.desc()).limit(1)
        ).first()
        if not row:
            raise ValueError("Chưa có bài nào được ghi. Ghi bài trước bằng /post.")
        row.reach, row.comments, row.shares = int(reach), int(comments), int(shares)
        s.commit()
        return {"channel": row.channel, "pillar": row.pillar, "post_date": row.post_date,
                "reach": row.reach, "comments": row.comments, "shares": row.shares}
    finally:
        s.close()


def scoreboard(session_factory, days: int = 7) -> dict:
    """Bảng điểm thử nghiệm N ngày: bài × trụ × kênh, click theo mã, đăng ký theo source.

    Trả về:
      lines        — HTML cho Telegram
      claude_block — text thuần, TẤT ĐỊNH, để dán vào chat cho Claude chỉnh chiến lược
    """
    now = _now_vn()
    since = now - timedelta(days=days)
    since_ymd = since.strftime("%Y-%m-%d")
    s = session_factory()
    try:
        posts = s.scalars(
            select(PostLogORM).where(PostLogORM.post_date >= since_ymd)
            .order_by(PostLogORM.post_date)
        ).all()
        clicks = dict(s.execute(
            select(LinkClickORM.code, func.count())
            .where(LinkClickORM.created_at >= since)
            .group_by(LinkClickORM.code)
        ).all())
        signups = dict(s.execute(
            select(func.coalesce(TeacherORM.source, "(không rõ)"), func.count())
            .where(TeacherORM.created_at >= since)
            .group_by(TeacherORM.source)
        ).all())
    finally:
        s.close()

    ns = north_star(session_factory)

    # gộp bài theo (kênh, trụ)
    agg: dict[tuple[str, str], dict] = {}
    for p in posts:
        k = (p.channel, p.pillar)
        a = agg.setdefault(k, {"n": 0, "reach": 0, "cmt": 0, "share": 0, "codes": set()})
        a["n"] += 1
        a["reach"] += p.reach or 0
        a["cmt"] += p.comments or 0
        a["share"] += p.shares or 0
        if p.link_code:
            a["codes"].add(p.link_code)

    # ── HTML cho Telegram ──
    lines = ["", f"<b>🧪 BẢNG ĐIỂM THỬ NGHIỆM ({days} ngày)</b>"]
    if not posts:
        lines.append("• Chưa ghi bài nào — đăng xong gõ <code>/post g1 hocphi</code>")
    for (ch, pi), a in sorted(agg.items(), key=lambda x: -x[1]["n"]):
        cl = sum(clicks.get(c, 0) for c in a["codes"])
        lines.append(
            f"• {ch} · <i>{pi}</i>: {a['n']} bài · {a['reach']} reach · "
            f"{a['cmt']} bl · {cl} click")
    if clicks:
        lines.append("🔗 Click theo mã: " + " · ".join(
            f"{c}={n}" for c, n in sorted(clicks.items(), key=lambda x: -x[1])))
    if signups:
        lines.append("🌱 Đăng ký theo nguồn: " + " · ".join(
            f"{src}={n}" for src, n in sorted(signups.items(), key=lambda x: -x[1])))

    # ── Khối dán cho Claude — text thuần, đủ ngữ cảnh để ra quyết định ──
    cb = [
        f"GROWTH {now.strftime('%d/%m/%Y')} (cửa sổ {days} ngày)",
        f"WAT={ns['wat']} (tuần trước {ns['wat_prev']}) · mục tiêu {ns['target_min']}-{ns['target_max']}",
        f"Bài đăng: {len(posts)}",
    ]
    for (ch, pi), a in sorted(agg.items(), key=lambda x: -x[1]["n"]):
        cl = sum(clicks.get(c, 0) for c in a["codes"])
        cb.append(f"- {ch} | {pi} | {a['n']} bài | reach={a['reach']} bl={a['cmt']} "
                  f"share={a['share']} click={cl}")
    cb.append("Click theo mã: " + (
        ", ".join(f"{c}={n}" for c, n in sorted(clicks.items(), key=lambda x: -x[1])) or "0"))
    cb.append("Đăng ký theo nguồn: " + (
        ", ".join(f"{s0}={n}" for s0, n in sorted(signups.items(), key=lambda x: -x[1])) or "0"))
    cb.append("---")
    cb.append("Claude: dựa vào số trên, đề xuất TỐI ĐA 3 điều chỉnh cho tuần tới "
              "(trọng số chủ đề seeding, thứ tự bài fanpage, kế hoạch /viec). "
              "Chỉ đề xuất điều có dữ liệu chống lưng; thiếu dữ liệu thì nói thiếu gì.")

    lines += ["", "<b>📋 Khối dán cho Claude (giữ tin nhắn → Copy):</b>",
              "<code>" + "\n".join(cb) + "</code>"]
    return {"posts": len(posts), "lines": lines, "claude_block": "\n".join(cb)}
