"""Bot Telegram nhận bài đăng → trả về câu trả lời seeding.

Cách dùng (trên điện thoại, lúc đang lướt nhóm):
  1. Thấy bài ai đó đang hỏi về học phí / Thông tư 29 / quản lý lớp
  2. Chụp màn hình (hoặc chép nội dung) gửi vào bot
  3. Bot trả câu trả lời, chép dán thẳng vào bình luận

AN TOÀN: chỉ trả lời TELEGRAM_CHAT_ID của owner. Mã bot có thể lộ, nên người lạ
nhắn vào cũng bị bỏ qua hoàn toàn — không tốn token, không rò rỉ gì.

Chạy nền bằng systemd (xem docs/books/01). Thử tay:
    python scripts/seeding_bot.py
"""
from __future__ import annotations

import base64
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

try:
    sys.stdout.reconfigure(encoding="utf-8")
except (AttributeError, OSError):
    pass

from daythem.adapters.database import SessionLocal  # noqa: E402
from daythem.config import settings  # noqa: E402
from daythem.service.growth_loop import (  # noqa: E402
    CHANNELS, PILLARS, add_note, log_post, open_notes, scoreboard,
    set_last_post_metrics,
)
from daythem.service.gtm_plan import (  # noqa: E402
    mark, next_tasks, progress, recently_done,
)
from daythem.service.seeding import group_link_lines, topic_of_day  # noqa: E402
from daythem.service.seeding_reply import reply_for_image, reply_for_text  # noqa: E402

API = "https://api.telegram.org/bot{tok}/{method}"
FILE_API = "https://api.telegram.org/file/bot{tok}/{path}"
POLL_TIMEOUT = 50          # long polling — không đốt CPU
MAX_IMAGE_BYTES = 8_000_000

HELP = (
    "🌱 <b>Bot GieoChữ</b>\n\n"
    "<b>1. Soạn câu trả lời seeding</b>\n"
    "Đang lướt nhóm thấy bài ai đó đang hỏi? Gửi vào đây:\n"
    "• <b>Ảnh chụp màn hình</b> bài đăng (tiện nhất)\n"
    "• Hoặc <b>chép nội dung</b> bài rồi dán vào\n\n"
    "<i>Câu trả lời KHÔNG nhắc tên app — đó là cố ý.</i>\n\n"
    "<b>2. Báo việc đã làm</b>\n"
    "/viec — xem việc cần làm, có đánh số\n"
    "/xong 1 — báo việc số 1 đã xong\n"
    "/dang 2 — đang làm việc số 2\n"
    "/bo 5 — bỏ qua việc số 5\n\n"
    "<b>3. Vòng growth — ghi thử nghiệm</b>\n"
    "/post g1 hocphi — vừa đăng bài trụ 'học phí' vào nhóm 1\n"
    "/kq 1200 14 3 — bài vừa ghi đạt 1200 reach, 14 bl, 3 share\n"
    "/ghi g3 toàn bài tuyển sinh — THẤY GÌ GHI NẤY, Claude đọc khi điều chỉnh\n"
    "/tuan — bảng điểm thử nghiệm + khối dán cho Claude\n\n"
    "<i>Kênh: g1..g5 (nhóm theo thứ tự bản tin) · fb · tt · zl</i>\n\n"
    "/chude — chủ đề seeding hôm nay"
)


def _open_tasks() -> list:
    """Việc chưa xong, đúng thứ tự ưu tiên — dùng chung cho /viec và /xong N."""
    return next_tasks(SessionLocal, 99)


def _resolve(arg: str) -> str | None:
    """Nhận số thứ tự (theo /viec) hoặc mã việc → trả về mã việc."""
    arg = arg.strip()
    if arg.isdigit():
        tasks = _open_tasks()
        i = int(arg) - 1
        return tasks[i].key if 0 <= i < len(tasks) else None
    return arg or None


def _viec_text() -> str:
    tasks = _open_tasks()
    pg = progress(SessionLocal)
    if not tasks:
        return "🎉 <b>Hết việc trong kế hoạch!</b>\n\nMở gtm_plan.py thêm chặng mới."
    lines = [f"<b>📋 VIỆC CẦN LÀM</b>  <i>({pg['done']}/{pg['total']} việc lớn đã xong)</i>", ""]
    for i, t in enumerate(tasks[:8], 1):
        icon = "🔸" if t.status == "doing" else "⬜"
        who = "" if t.owner == "anh" else " <i>(Claude)</i>"
        lines.append(f"{icon} <b>{i}. {t.title}</b>{who}")
        lines.append(f"     <code>{t.key}</code>")
    if len(tasks) > 8:
        lines.append(f"\n<i>…và {len(tasks) - 8} việc nữa</i>")
    just = recently_done(SessionLocal, 72)
    if just:
        lines += ["", "<b>✅ Vừa xong (3 ngày)</b>"]
        lines += [f"• {t.title}" for t in just[:5]]
    lines += ["", "<i>Báo xong: /xong 1 — hoặc /xong &lt;mã việc&gt;</i>"]
    return "\n".join(lines)


def _mark_text(arg: str, status: str) -> str:
    key = _resolve(arg)
    if not key:
        return "Thiếu số thứ tự hoặc mã việc.\nVí dụ: <code>/xong 1</code>\n\n/viec để xem danh sách."
    try:
        r = mark(SessionLocal, key, status)
    except ValueError as e:
        return f"❌ {e}\n\n/viec để xem mã việc đúng."
    icon = {"done": "✅", "doing": "🔸", "todo": "⬜", "skip": "⏭"}[status]
    out = [f"{icon} <b>{r['title']}</b> → {r['status']}"]
    if status == "done":
        pg = progress(SessionLocal)
        out.append(f"\n<i>Tiến độ: {pg['done']}/{pg['total']} việc lớn</i>")
        nxt = next_tasks(SessionLocal, 1)
        if nxt:
            out.append(f"\n<b>Tiếp theo:</b> {nxt[0].title}")
            out.append(f"<i>{nxt[0].why}</i>")
        else:
            out.append("\n🎉 Hết việc trong kế hoạch!")
    return "\n".join(out)


def tg(method: str, **params) -> dict:
    url = API.format(tok=settings.TELEGRAM_BOT_TOKEN, method=method)
    data = urllib.parse.urlencode(
        {k: v for k, v in params.items() if v is not None}).encode()
    try:
        with urllib.request.urlopen(urllib.request.Request(url, data=data), timeout=70) as r:
            return json.load(r)
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        print(f"  [tg] {method} lỗi: {e}")
        return {}


def send(chat_id: int, text: str) -> None:
    tg("sendMessage", chat_id=chat_id, text=text,
       parse_mode="HTML", disable_web_page_preview="true")


def download(file_id: str) -> tuple[str, str] | None:
    """Tải ảnh từ Telegram → (base64, mime). None nếu hỏng/quá lớn."""
    info = tg("getFile", file_id=file_id)
    path = (info.get("result") or {}).get("file_path")
    if not path:
        return None
    if (info["result"].get("file_size") or 0) > MAX_IMAGE_BYTES:
        return None
    url = FILE_API.format(tok=settings.TELEGRAM_BOT_TOKEN, path=path)
    try:
        with urllib.request.urlopen(url, timeout=60) as r:
            raw = r.read(MAX_IMAGE_BYTES + 1)
    except (urllib.error.URLError, TimeoutError, OSError):
        return None
    if len(raw) > MAX_IMAGE_BYTES:
        return None
    mime = "image/png" if path.lower().endswith(".png") else "image/jpeg"
    return base64.b64encode(raw).decode(), mime


def format_out(out: dict) -> str:
    if not out.get("relevant"):
        return ("🤔 <b>Bài này không hợp để seeding</b>\n\n"
                f"<i>{out.get('why', '')}</i>\n\n"
                "Tìm bài nào thầy cô đang hỏi về học phí, Thông tư 29, hộ kinh doanh, "
                "quản lý lớp — mấy chủ đề đó mới đúng tệp.")
    parts = [
        f"✅ <b>{out.get('topic', 'Bài phù hợp')}</b>",
        "",
        "<b>Câu trả lời — chép dán thẳng:</b>",
        f"<code>{out.get('reply', '')}</code>",
    ]
    if out.get("why"):
        parts += ["", f"<i>💡 {out['why']}</i>"]
    if out.get("warning"):
        parts += ["", out["warning"]]
    parts += ["", "<i>Nhớ: đừng nhắc app. Ai hỏi lại thì mới nói, và nói rõ là app của mình.</i>"]
    return "\n".join(parts)


def handle(msg: dict) -> None:
    chat_id = msg.get("chat", {}).get("id")
    owner = str(settings.TELEGRAM_CHAT_ID)
    if str(chat_id) != owner:
        print(f"  bỏ qua tin từ chat lạ: {chat_id}")
        return

    text = (msg.get("text") or msg.get("caption") or "").strip()

    if text in ("/start", "/help"):
        send(chat_id, HELP)
        return

    # ── Báo cáo tiến độ công việc ──
    # Đặt TRƯỚC nhánh xử lý bài đăng: lệnh bắt đầu bằng "/" nên không lẫn, nhưng
    # để trước cho rõ ý — đây là đường riêng, không đi qua model.
    if text.startswith("/xong_gv"):
        from daythem.adapters.database import SessionLocal
        from daythem.service.cham_soc import KIND_XONG, ghi
        from daythem.service.user_health import user_list
        sdt = text[len("/xong_gv"):].strip()
        u = next((x for x in user_list(SessionLocal)["users"] if x.phone == sdt), None)
        if not u:
            send(chat_id, f"Không thấy giáo viên có số <code>{sdt}</code>.")
        else:
            ghi(SessionLocal, u.teacher_id, KIND_XONG)
            send(chat_id, f"🌿 Chốt <b>{u.name}</b> — không hiện lại trong bản tin nữa.")
        return

    if text.startswith("/viec"):
        send(chat_id, _viec_text())
        return
    for cmd, st in (("/xong", "done"), ("/dang", "doing"),
                    ("/bo", "skip"), ("/lam_lai", "todo")):
        if text.startswith(cmd):
            send(chat_id, _mark_text(text[len(cmd):].strip(), st))
            return

    # ── Vòng growth: ghi thử nghiệm ──
    if text.startswith("/post"):
        args = text.split()[1:]
        if len(args) < 2:
            send(chat_id, "Cú pháp: <code>/post &lt;kênh&gt; &lt;trụ&gt; [mã link] [ghi chú]</code>\n"
                          f"Kênh: {' '.join(sorted(CHANNELS))}\n"
                          f"Trụ: {' '.join(sorted(PILLARS))}\n"
                          "Ví dụ: <code>/post g1 hocphi</code>")
            return
        try:
            r = log_post(SessionLocal, args[0], args[1],
                         link_code=args[2] if len(args) > 2 else None,
                         note=" ".join(args[3:]) or None)
        except ValueError as e:
            send(chat_id, f"❌ {e}")
            return
        code = f" · mã link <code>{r['link_code']}</code>" if r.get("link_code") else \
               "\n<i>💡 Lần sau kèm mã link (/post g1 hocphi gp1) để đo được click theo bài.</i>"
        send(chat_id, f"📝 Đã ghi: <b>{r['channel']}</b> · {r['pillar']}{code}\n"
                      f"Có số reach thì gõ <code>/kq &lt;reach&gt; &lt;bl&gt; &lt;share&gt;</code>")
        return

    if text.startswith("/kq"):
        args = text.split()[1:]
        if len(args) != 3 or not all(a.isdigit() for a in args):
            send(chat_id, "Cú pháp: <code>/kq &lt;reach&gt; &lt;bình luận&gt; &lt;chia sẻ&gt;</code>"
                          " — áp cho bài ghi gần nhất.\nVí dụ: <code>/kq 1200 14 3</code>")
            return
        try:
            r = set_last_post_metrics(SessionLocal, *map(int, args))
        except ValueError as e:
            send(chat_id, f"❌ {e}")
            return
        send(chat_id, f"📊 {r['channel']} · {r['pillar']} ({r['post_date']}): "
                      f"reach <b>{r['reach']}</b> · {r['comments']} bl · {r['shares']} share")
        return

    if text.startswith("/ghi"):
        body = text[len("/ghi"):].strip()
        if not body:
            notes = open_notes(SessionLocal)
            if not notes:
                send(chat_id, "Chưa có nhận xét nào chờ xử lý.\n"
                              "Thấy gì ghi nấy: <code>/ghi g3 toàn bài tuyển sinh</code>")
            else:
                out = [f"<b>👁 Nhận xét chờ xử lý ({len(notes)})</b>"]
                for n in notes:
                    tag = f"[{CHANNELS.get(n.channel, n.channel)}] " if n.channel else ""
                    out.append(f"• {tag}{n.text}")
                out.append("\n<i>Claude sẽ đọc và xử lý ở phiên điều chỉnh chiến lược tới.</i>")
                send(chat_id, "\n".join(out))
            return
        try:
            r = add_note(SessionLocal, body)
        except ValueError as e:
            send(chat_id, f"❌ {e}")
            return
        tag = f" (kênh: {r['channel_name']})" if r["channel_name"] else ""
        send(chat_id, f"👁 Đã ghi{tag}: <i>{r['text']}</i>\n"
                      "Claude sẽ đọc ở phiên điều chỉnh chiến lược tới — không cần nhắc lại.")
        return

    if text.startswith("/tuan"):
        send(chat_id, "\n".join(scoreboard(SessionLocal)["lines"]).strip())
        return

    if text == "/chude":
        from datetime import date
        d = date.today()
        t = topic_of_day(d)
        send(chat_id, f"🌱 <b>Chủ đề hôm nay: {t.name}</b>\n"
                      + "\n".join(group_link_lines(d))
                      + f"\n\n<b>Mẫu chung:</b>\n<code>{t.reply}</code>")
        return

    photos = msg.get("photo") or []
    try:
        if photos:
            send(chat_id, "🔎 Đang đọc ảnh…")
            got = download(photos[-1]["file_id"])   # cỡ lớn nhất
            if not got:
                send(chat_id, "❌ Không tải được ảnh (quá lớn hoặc lỗi mạng). Thử chụp lại nhé.")
                return
            out = reply_for_image(got[0], got[1], note=text)
        elif len(text) >= 30:
            send(chat_id, "🔎 Đang đọc bài…")
            out = reply_for_text(text)
        else:
            send(chat_id, "Gửi <b>ảnh chụp màn hình</b> bài đăng, hoặc <b>chép nội dung</b> "
                          "bài dán vào (ít nhất vài dòng) nhé.\n\n"
                          "💡 Còn nếu anh định <b>ghi nhận xét</b> (vd nhóm nào không hợp) "
                          "thì dùng <code>/ghi ...</code> — Claude sẽ đọc khi điều chỉnh.\n\n"
                          "/help để xem hướng dẫn.")
            return
        send(chat_id, format_out(out))
    except ValueError as e:
        send(chat_id, f"❌ {e}")
    except Exception as e:  # noqa: BLE001 — bot phải sống sót mọi lỗi
        print(f"  lỗi không lường: {type(e).__name__}: {e}")
        send(chat_id, "❌ Có lỗi khi xử lý. Thử lại sau ít phút nhé.")



def handle_callback(cq: dict) -> None:
    """Xử lý nút bấm dưới bản tin sáng: "✓ Đã nhắn" và "💬 Họ hỏi cách".

    Nút thay cho gõ lệnh vì bản tin đọc trên điện thoại — gõ "/danhan <id>" trên
    bàn phím ảo thì không ai làm đều được, mà việc này phải làm mỗi ngày.
    """
    from daythem.adapters.database import SessionLocal
    from daythem.service.cham_soc import (KIND_HUONG, KIND_NHAN, ghi, huong_dan_cho)
    from daythem.service.user_health import user_list

    data = cq.get("data") or ""
    chat_id = cq.get("message", {}).get("chat", {}).get("id")
    cq_id = cq.get("id")
    if str(chat_id) != str(settings.TELEGRAM_CHAT_ID):
        return
    if ":" not in data:
        tg("answerCallbackQuery", callback_query_id=cq_id)
        return
    ma, tid = data.split(":", 1)

    u = next((x for x in user_list(SessionLocal)["users"] if x.teacher_id == tid), None)
    ten = u.name if u else "giáo viên"

    if ma == "n":
        ghi(SessionLocal, tid, KIND_NHAN)
        tg("answerCallbackQuery", callback_query_id=cq_id,
           text=f"Đã ghi: nhắn {ten}. 4 ngày nữa mới hiện lại.")
        send(chat_id, f"✓ Đã ghi <b>{ten}</b> — đang chờ trả lời.\n"
                      f"<i>Họ hỏi cách làm thì bấm nút 💬 ở bản tin.</i>")
        return

    if ma == "h":
        if not u:
            tg("answerCallbackQuery", callback_query_id=cq_id, text="Không tìm thấy người này.")
            return
        khoa, bai = huong_dan_cho(u)
        ghi(SessionLocal, tid, KIND_HUONG, note=khoa)
        tg("answerCallbackQuery", callback_query_id=cq_id, text=f"Bài hướng dẫn cho {ten}")
        send(chat_id, f"📖 <b>Gửi {ten}</b> — copy cả khối dưới:\n\n<code>{bai}</code>\n\n"
                      f"<i>Họ làm được rồi thì nhắn /xong_gv {u.phone}</i>")
        return

    tg("answerCallbackQuery", callback_query_id=cq_id)

def main() -> int:
    if not settings.TELEGRAM_BOT_TOKEN or not settings.TELEGRAM_CHAT_ID:
        print("Chưa cấu hình TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID.")
        return 1
    if not settings.GEMINI_API_KEY:
        print("Chưa cấu hình GEMINI_API_KEY — bot không soạn được câu trả lời.")
        return 1

    print(f"Bot seeding đang chạy. Chỉ nhận tin từ chat {settings.TELEGRAM_CHAT_ID}.")
    offset = None
    while True:
        try:
            r = tg("getUpdates", offset=offset, timeout=POLL_TIMEOUT,
                   allowed_updates=json.dumps(["message", "callback_query"]))
            for upd in r.get("result", []):
                offset = upd["update_id"] + 1
                if "message" in upd:
                    handle(upd["message"])
                elif "callback_query" in upd:
                    handle_callback(upd["callback_query"])
        except KeyboardInterrupt:
            print("\nDừng.")
            return 0
        except Exception as e:  # noqa: BLE001
            print(f"vòng lặp lỗi: {type(e).__name__}: {e}")
            time.sleep(5)


if __name__ == "__main__":
    raise SystemExit(main())
