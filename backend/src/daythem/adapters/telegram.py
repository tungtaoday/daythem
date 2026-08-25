"""Telegram adapter — báo owner khi có user mới (best-effort, không bao giờ làm hỏng caller)."""
import json
import threading
import urllib.request
import urllib.parse
from daythem.config import settings


def _send(text: str, reply_markup: dict | None = None) -> None:
    token = settings.TELEGRAM_BOT_TOKEN
    chat_id = settings.TELEGRAM_CHAT_ID
    if not token or not chat_id:
        return
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": "true",
    }
    # Nút bấm dưới tin (inline keyboard). Telegram nhận dạng JSON chuỗi hoá.
    if reply_markup:
        payload["reply_markup"] = json.dumps(reply_markup, ensure_ascii=False)
    data = urllib.parse.urlencode(payload).encode()
    try:
        urllib.request.urlopen(urllib.request.Request(url, data=data), timeout=8)
    except Exception:
        pass  # không để lỗi Telegram ảnh hưởng luồng chính


def notify(text: str) -> None:
    """Gửi bất đồng bộ (thread nền) — không chặn request."""
    if not settings.TELEGRAM_BOT_TOKEN or not settings.TELEGRAM_CHAT_ID:
        return
    threading.Thread(target=_send, args=(text,), daemon=True).start()
