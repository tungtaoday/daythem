"""Gemini (Google AI Studio) adapter — OCR ảnh danh sách học sinh → danh sách tên.

Gọi REST bằng urllib (không thêm dependency). Khoá API ở server; app KHÔNG bao giờ
thấy khoá. Không lưu ảnh — chỉ chuyển tiếp lấy tên rồi bỏ.
"""
import json
import urllib.request
import urllib.error
from daythem.config import settings

_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"

_PROMPT = (
    "Đây là ảnh danh sách học sinh của một lớp học. "
    "Trích xuất HỌ TÊN ĐẦY ĐỦ của từng học sinh, giữ nguyên dấu tiếng Việt. "
    "Bỏ số thứ tự, tiêu đề, tên lớp, tên môn, ngày tháng, và mọi thông tin không phải tên học sinh. "
    "Nếu ảnh không phải danh sách tên thì trả về mảng rỗng."
)

# Chặn ảnh quá lớn (base64) để tránh lạm dụng / chi phí. ~8MB base64 ≈ ~6MB ảnh.
_MAX_B64_LEN = 8_000_000


def extract_student_names(image_b64: str, mime_type: str = "image/jpeg") -> list[str]:
    """Trả danh sách tên học sinh trích từ ảnh. Raise ValueError khi chưa cấu hình/ảnh xấu/gọi lỗi."""
    if not settings.GEMINI_API_KEY:
        raise ValueError("Tính năng quét ảnh chưa được bật.")
    if not image_b64 or len(image_b64) > _MAX_B64_LEN:
        raise ValueError("Ảnh không hợp lệ hoặc quá lớn.")

    body = {
        "contents": [{"parts": [
            {"text": _PROMPT},
            {"inline_data": {"mime_type": mime_type, "data": image_b64}},
        ]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": {"type": "ARRAY", "items": {"type": "STRING"}},
            "temperature": 0,
        },
    }
    url = _ENDPOINT.format(model=settings.GEMINI_MODEL, key=settings.GEMINI_API_KEY)
    req = urllib.request.Request(
        url, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.load(resp)
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        # Không rò rỉ URL (chứa khoá) ra ngoài.
        raise ValueError("Không quét được ảnh lúc này, thử lại sau.") from e

    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        names = json.loads(text)
    except (KeyError, IndexError, TypeError, json.JSONDecodeError):
        return []

    out: list[str] = []
    seen: set[str] = set()
    for n in names if isinstance(names, list) else []:
        if not isinstance(n, str):
            continue
        n = " ".join(n.split())  # gọn khoảng trắng
        if 1 < len(n) <= 60 and n.lower() not in seen:
            seen.add(n.lower())
            out.append(n)
    return out[:100]
