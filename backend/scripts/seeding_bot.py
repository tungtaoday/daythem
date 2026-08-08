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

from daythem.config import settings  # noqa: E402
from daythem.service.seeding import topic_of_day  # noqa: E402
from daythem.service.seeding_reply import reply_for_image, reply_for_text  # noqa: E402

API = "https://api.telegram.org/bot{tok}/{method}"
FILE_API = "https://api.telegram.org/file/bot{tok}/{path}"
POLL_TIMEOUT = 50          # long polling — không đốt CPU
MAX_IMAGE_BYTES = 8_000_000

HELP = (
    "🌱 <b>Bot seeding GieoChữ</b>\n\n"
    "Đang lướt nhóm thấy bài ai đó đang hỏi? Gửi vào đây:\n"
    "• <b>Ảnh chụp màn hình</b> bài đăng (tiện nhất)\n"
    "• Hoặc <b>chép nội dung</b> bài rồi dán vào\n\n"
    "Bot đọc rồi soạn câu trả lời, chép dán thẳng vào bình luận.\n\n"
    "<i>Câu trả lời KHÔNG nhắc tên app — đó là cố ý. Ai hỏi lại thì mới nói.</i>\n\n"
    "/chude — xem chủ đề seeding hôm nay"
)


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
    if text == "/chude":
        from datetime import date
        t = topic_of_day(date.today())
        send(chat_id, f"🌱 <b>Chủ đề hôm nay: {t.name}</b>\n\n"
                      f"Tìm trong nhóm: <code>{' · '.join(t.keywords)}</code>\n\n"
                      f"<b>Mẫu chung:</b>\n<code>{t.reply}</code>")
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
                          "bài dán vào (ít nhất vài dòng) nhé.\n\n/help để xem hướng dẫn.")
            return
        send(chat_id, format_out(out))
    except ValueError as e:
        send(chat_id, f"❌ {e}")
    except Exception as e:  # noqa: BLE001 — bot phải sống sót mọi lỗi
        print(f"  lỗi không lường: {type(e).__name__}: {e}")
        send(chat_id, "❌ Có lỗi khi xử lý. Thử lại sau ít phút nhé.")


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
                   allowed_updates=json.dumps(["message"]))
            for upd in r.get("result", []):
                offset = upd["update_id"] + 1
                if "message" in upd:
                    handle(upd["message"])
        except KeyboardInterrupt:
            print("\nDừng.")
            return 0
        except Exception as e:  # noqa: BLE001
            print(f"vòng lặp lỗi: {type(e).__name__}: {e}")
            time.sleep(5)


if __name__ == "__main__":
    raise SystemExit(main())
