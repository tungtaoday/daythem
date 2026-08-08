"""KẾ HOẠCH GTM — một danh sách duy nhất, xếp theo thứ tự phải làm.

Vì sao có file này: tới 08/08/2026 dự án có 29 tài liệu trong `docs/`. Mỗi tài liệu
đúng ở phạm vi của nó, nhưng gộp lại thì **không ai biết sáng mai làm gì trước**.

File này là **nguồn sự thật duy nhất cho câu hỏi "hôm nay làm gì"**. Các tài liệu kia
tụt xuống vai trò TRA CỨU — mở ra khi đã biết mình đang làm việc nào.

Nguyên tắc:
  - Xếp theo **cái gì mở khoá cái gì**, không phải theo cảm giác việc nào quan trọng.
  - Mỗi việc có `why` một dòng: làm xong thì mở khoá được gì.
  - Mỗi việc trỏ về `source` để lần ngược khi cần chi tiết.
  - **TẤT ĐỊNH** — không gọi AI. Sửa kế hoạch là sửa file này.

Trạng thái lưu ở bảng `gtm_tasks` (xem `adapters/orm.py`). File này chỉ định nghĩa
danh sách; `seed_tasks()` gieo vào DB mà không tạo trùng, `auto_verify()` tự đánh dấu
xong những việc kiểm được bằng dữ liệu.
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from daythem.adapters.orm import GtmTaskORM, TeacherORM

_VN_TZ = timezone(timedelta(hours=7))


@dataclass(frozen=True)
class PlanItem:
    key: str
    title: str
    why: str
    block: str
    source: str = ""
    owner: str = "anh"          # anh | claude
    repeats: bool = False       # việc lặp hằng ngày, không bao giờ "xong" hẳn


# ── KẾ HOẠCH — thứ tự trong danh sách CHÍNH LÀ thứ tự phải làm ──────────────
PLAN: list[PlanItem] = [
    PlanItem(
        "ios-submit",
        "Điền nốt 5 mục App Store Connect rồi bấm Submit for Review",
        "Mở khoá: có app THẬT trên store để đưa thầy cô xem. iOS không vướng luật 12 tester nên đây là đường nhanh nhất.",
        "Store", "docs/store-launch-checklist.md",
    ),
    PlanItem(
        "fanpage-8-posts",
        "Đăng 8 bài nền lên fanpage GieoChuVN (rải 2 tuần, ghim bài giới thiệu)",
        "Chặn rò rỉ: người thấy anh trong nhóm bấm sang trang, thấy trống là mất luôn người đó.",
        "Kiếm khách", "docs/fanpage-content-pack.md",
    ),
    PlanItem(
        "contact-list-40",
        "Ngồi lọc danh bạ ra 40 tên, chia nhóm N1/N2/N3",
        "Mở khoá toàn bộ việc tuyển tester. Chưa có danh sách thì không nhắn được ai.",
        "Kiếm khách", "docs/books/05 §A1",
    ),
    PlanItem(
        "msg-n1",
        "Nhắn riêng hết nhóm N1 (người thân quen, đang dạy thêm)",
        "Nhóm này trả lời nhanh nhất, và cho phản hồi thật để sửa kịch bản trước khi nhắn người lạ hơn.",
        "Kiếm khách", "docs/books/05 §A2",
    ),
    PlanItem(
        "sec-fixes",
        "Vá 2 lỗi bảo mật: token không thu hồi khi đổi mật khẩu · OTP dùng random",
        "Phải xong TRƯỚC khi có người dùng thật. Sau đó vá là phải xử lý dữ liệu đang chạy.",
        "Sản phẩm", "review 02/08", owner="claude",
    ),
    PlanItem(
        "delete-test-accounts",
        "Chạy lệnh xoá 2 tài khoản test (0672585990 và 0901234567)",
        "Số liệu North Star đang bị thổi phồng. Xoá xong mới biết người thật đầu tiên là ai.",
        "Vận hành", "backend/scripts/delete_test_accounts.py",
    ),
    PlanItem(
        "testers-12",
        "Gom đủ 12 tester BẤM OPT-IN cho closed testing CH Play",
        "Mở khoá đồng hồ 14 ngày. Chưa đủ 12 thì đồng hồ chưa chạy, Android chưa lên được.",
        "Store", "docs/store-launch-checklist.md",
    ),
    PlanItem(
        "seeding-daily",
        "Vào 5 nhóm FB, trả lời 2 câu hỏi — KHÔNG nhắc app",
        "Nguồn khách hàng thật duy nhất đang chạy được ở giai đoạn 0. Chủ đề và mẫu trả lời có trong bản tin sáng.",
        "Kiếm khách", "docs/books/05 §B2", repeats=True,
    ),
    PlanItem(
        "onboard-calls",
        "Gọi kèm tay từng người vừa cài, trong 24h, tới 'aha' đầu tiên",
        "Người cài mà không dùng sẽ gỡ trong 3 ngày — và đồng hồ 14 ngày reset theo.",
        "Kiếm khách", "docs/books/02", repeats=True,
    ),
    PlanItem(
        "fanpage-weekly",
        "Đăng 1–2 bài fanpage mỗi tuần (ưu tiên bài hậu trường 'tuần này sửa gì')",
        "Người ghé thăm nhìn ngày đăng cuối để đoán trang còn sống hay đã bỏ.",
        "Kiếm khách", "docs/fanpage-content-pack.md §E", repeats=True,
    ),
    PlanItem(
        "zalo-oa",
        "Tạo Zalo OA loại Doanh nghiệp và NỘP XÁC THỰC",
        "Xác thực chờ 3–7 ngày. Nộp tuần này để kịp dùng ở giai đoạn bung kênh.",
        "Zalo OA", "docs/zalo-oa-setup.md",
    ),
    PlanItem(
        "play-production",
        "Đủ 14 ngày → Apply for production trong Play Console",
        "Bước cuối để Android lên store công khai.",
        "Store", "docs/store-launch-checklist.md",
    ),
    PlanItem(
        "interview-3",
        "Gọi hỏi 3 người dùng nhiều nhất: 'vì sao cô ở lại?'",
        "Câu trả lời của họ chính là thông điệp bán hàng cho 1.000 người tiếp theo. Không nghĩ ra được bằng cách ngồi suy luận.",
        "Kiếm khách", "docs/books/05 nhịp ngày 7",
    ),
]

PLAN_BY_KEY = {p.key: p for p in PLAN}


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def seed_tasks(session_factory) -> dict:
    """Gieo kế hoạch vào DB. Chạy lại nhiều lần cũng không tạo trùng.

    Việc đã có thì CHỈ cập nhật phần mô tả (title/why/source/priority) — giữ nguyên
    trạng thái, để sửa câu chữ trong kế hoạch không làm mất tiến độ đã ghi.
    """
    s = session_factory()
    added = updated = 0
    try:
        existing = {t.key: t for t in s.scalars(select(GtmTaskORM)).all()}
        for i, p in enumerate(PLAN):
            prio = (i + 1) * 10
            t = existing.get(p.key)
            if t is None:
                s.add(GtmTaskORM(
                    id=str(uuid.uuid4()), key=p.key, title=p.title, block=p.block,
                    why=p.why, source=p.source, priority=prio, owner=p.owner,
                ))
                added += 1
            else:
                t.title, t.why, t.source, t.priority, t.block, t.owner = (
                    p.title, p.why, p.source, prio, p.block, p.owner)
                updated += 1
        s.commit()
    finally:
        s.close()
    return {"added": added, "updated": updated, "total": len(PLAN)}


def auto_verify(session_factory) -> list[str]:
    """Tự đánh dấu xong những việc KIỂM ĐƯỢC bằng dữ liệu.

    Chỉ làm với việc có bằng chứng chắc chắn trong DB. Việc còn lại phải đánh dấu tay —
    thà để 'chưa xong' còn hơn tự nhận xong rồi bỏ sót thật.
    """
    done: list[str] = []
    s = session_factory()
    try:
        # Xoá tài khoản test: xong khi cả hai SĐT đều biến mất.
        rac = ["0672585990", "0901234567"]
        con = s.scalars(select(TeacherORM).where(TeacherORM.phone.in_(rac))).all()
        if not con:
            t = s.scalar(select(GtmTaskORM).where(GtmTaskORM.key == "delete-test-accounts"))
            if t and t.status != "done":
                t.status, t.done_at = "done", _now()
                t.note = "tự xác nhận: hai SĐT rác không còn trong DB"
                done.append(t.key)
        s.commit()
    finally:
        s.close()
    return done


def next_tasks(session_factory, limit: int = 3) -> list[GtmTaskORM]:
    """N việc tiếp theo phải làm — đã bỏ việc xong, xếp theo thứ tự mở khoá."""
    s = session_factory()
    try:
        return list(s.scalars(
            select(GtmTaskORM)
            .where(GtmTaskORM.status.in_(["todo", "doing"]))
            .order_by(GtmTaskORM.priority)
            .limit(limit)
        ).all())
    finally:
        s.close()


def recently_done(session_factory, hours: int = 24) -> list[GtmTaskORM]:
    """Việc vừa xong — phần 'traceback' của bản tin."""
    since = _now() - timedelta(hours=hours)
    s = session_factory()
    try:
        return list(s.scalars(
            select(GtmTaskORM)
            .where(GtmTaskORM.status == "done", GtmTaskORM.done_at >= since)
            .order_by(GtmTaskORM.done_at.desc())
        ).all())
    finally:
        s.close()


def progress(session_factory) -> dict:
    s = session_factory()
    try:
        rows = s.scalars(select(GtmTaskORM)).all()
        one_off = [t for t in rows if t.key not in {p.key for p in PLAN if p.repeats}]
        return {
            "total": len(one_off),
            "done": sum(1 for t in one_off if t.status == "done"),
            "doing": sum(1 for t in one_off if t.status == "doing"),
        }
    finally:
        s.close()


def mark(session_factory, key: str, status: str, note: str | None = None) -> dict:
    """Đánh dấu trạng thái một việc. status: todo | doing | done | skip."""
    if status not in ("todo", "doing", "done", "skip"):
        raise ValueError("status phải là todo | doing | done | skip")
    s = session_factory()
    try:
        t = s.scalar(select(GtmTaskORM).where(GtmTaskORM.key == key))
        if not t:
            raise ValueError(f"Không có việc nào mã {key!r}")
        t.status = status
        t.done_at = _now() if status == "done" else None
        if note is not None:
            t.note = note
        s.commit()
        return {"key": t.key, "title": t.title, "status": t.status}
    finally:
        s.close()


def digest_lines(session_factory) -> list[str]:
    """Khối 'VIỆC HÔM NAY' + traceback cho bản tin Telegram sáng."""
    auto_verify(session_factory)
    nxt = next_tasks(session_factory, 3)
    just = recently_done(session_factory, 24)
    pg = progress(session_factory)

    lines = ["", f"<b>🎯 VIỆC HÔM NAY</b>  <i>({pg['done']}/{pg['total']} việc lớn đã xong)</i>"]
    if nxt:
        for i, t in enumerate(nxt, 1):
            who = "" if t.owner == "anh" else " <i>(Claude làm)</i>"
            lines.append(f"<b>{i}. {t.title}</b>{who}")
            lines.append(f"    <i>{t.why}</i>")
            if t.source:
                lines.append(f"    📄 {t.source}")
    else:
        lines.append("• Hết việc trong kế hoạch — mở gtm_plan.py thêm chặng mới 🌿")

    if just:
        lines += ["", "<b>✅ Vừa xong (24h)</b>"]
        lines += [f"• {t.title}" for t in just]

    return lines
