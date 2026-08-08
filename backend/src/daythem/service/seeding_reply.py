"""Soạn câu trả lời seeding từ nội dung bài đăng thật trong hội nhóm.

Khác `seeding.py`: file kia cho MẪU chung theo chủ đề của ngày. File này nhận
**bài đăng cụ thể** (chữ hoặc ảnh chụp màn hình) và soạn câu trả lời bám đúng
điều người ta hỏi — thứ mẫu chung không làm được.

Vì sao quan trọng: mẫu chung ai đọc cũng biết là copy. Câu trả lời nhắc đúng chi
tiết họ vừa kể mới khiến người ta nhớ mặt, rồi mới inbox.

Dùng Gemini vì khoá đã có sẵn trên server (đang dùng cho OCR danh sách học sinh).
"""
from __future__ import annotations

import json
import unicodedata
import urllib.error
import urllib.request

from daythem.config import settings

_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"

# Luật cứng — chép từ docs/marketing-beta-content-pack.md và docs/books/05.
# Phá luật là mất niềm tin, mà tệp thầy cô mất niềm tin thì không lấy lại được.
_SYSTEM = """Bạn giúp một người làm app quản lý lớp dạy thêm (tên GieoChữ) soạn câu
TRẢ LỜI BÌNH LUẬN trong hội nhóm giáo viên Việt Nam trên Facebook.

MỤC TIÊU: trả lời thật hữu ích cho người đang hỏi. Không bán hàng. Người ta thấy
hữu ích thì tự nhớ mặt rồi inbox — đó mới là cách có khách ở giai đoạn này.

LUẬT TUYỆT ĐỐI KHÔNG ĐƯỢC PHÁ:
1. KHÔNG nhắc tên app "GieoChữ", không nhắc "app của em", không để link.
   Nếu người ta hỏi lại thì mới nói — nhưng đó là lượt sau, không phải bây giờ.
2. KHÔNG bịa số liệu ("tiết kiệm 30 phút", "90% giáo viên", "hàng nghìn thầy cô").
   Chưa có số đo thật. Dùng định tính: "đỡ hẳn", "khỏi phải nhớ".
3. KHÔNG khẳng định chắc nịch về pháp luật/thuế. Quy định đang đổi.
   Luôn kết bằng lời khuyên đối chiếu chi cục thuế hoặc văn bản chính thống.
4. KHÔNG dạy đời, không chê cách làm của người ta.

GIỌNG VĂN:
- Xưng "em", gọi người hỏi là "cô"/"thầy"/"anh chị" tuỳ ngữ cảnh bài đăng.
- Như một đồng nghiệp trẻ hơn đang chia sẻ, không phải chuyên gia giảng bài.
- Ngắn: 3-6 câu, hoặc vài gạch đầu dòng. Bình luận dài không ai đọc.
- Tiếng Việt tự nhiên, KHÔNG dùng từ sáo rỗng kiểu "tối ưu hoá", "giải pháp toàn diện".
- Cụ thể, làm được ngay. Nếu khuyên gì thì nói rõ làm thế nào.

KỸ THUẬT LÀM CHO NGƯỜI TA TRẢ LỜI LẠI:
- Nhắc lại một chi tiết cụ thể họ vừa kể → chứng minh mình đọc thật.
- Kết bằng một câu hỏi mở ngắn nếu tự nhiên (vd "cô ở tỉnh nào để em nói cụ thể hơn ạ?").
  Nếu gượng thì bỏ, đừng ép.

TRẢ VỀ ĐÚNG JSON:
{
  "relevant": true/false,       // bài này có đáng trả lời không (đúng tệp giáo viên dạy thêm?)
  "topic": "...",               // chủ đề bài, vài từ
  "reply": "...",               // câu trả lời, dán được ngay
  "why": "..."                  // 1 câu: vì sao trả lời như vậy
}

Nếu bài KHÔNG liên quan tới dạy thêm / quản lý lớp / học phí / pháp lý-thuế giáo viên
thì đặt relevant=false và giải thích ngắn trong "why", để "reply" rỗng.
"""

_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "relevant": {"type": "BOOLEAN"},
        "topic": {"type": "STRING"},
        "reply": {"type": "STRING"},
        "why": {"type": "STRING"},
    },
    "required": ["relevant", "topic", "reply", "why"],
}

# Cụm từ không được xuất hiện trong câu trả lời — chặn ở tầng code, không tin
# mỗi lời dặn trong prompt.
#
# ⚠️ So khớp sau khi BỎ DẤU tiếng Việt. Bản đầu tiên chỉ có "gieochu" không dấu
# nên lọt mất "GieoChữ" — đúng tên app, đúng thứ cần chặn. Bỏ dấu bắt được mọi
# cách viết: GieoChữ · Gieo Chữ · gieochu · GIEOCHU.
_CAM = [
    "gieochu", "gieo chu", "app cua em", "app em", "tai app", "link app",
    "tiet kiem 30 phut", "hang nghin giao vien", "% hai long", "daythem",
]

def _bo_dau(s: str) -> str:
    """Bỏ dấu tiếng Việt để so khớp. Dùng unicodedata thay vì bảng tra tay —
    bảng tra tay từng lệch một ký tự và làm cả hàm gãy."""
    s = s.replace("đ", "d").replace("Đ", "D")
    return "".join(
        c for c in unicodedata.normalize("NFD", s)
        if not unicodedata.combining(c)
    ).lower()


def _call(parts: list[dict]) -> dict:
    body = {
        "systemInstruction": {"parts": [{"text": _SYSTEM}]},
        "contents": [{"parts": parts}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": _SCHEMA,
            "temperature": 0.7,
        },
    }
    url = _ENDPOINT.format(model=settings.GEMINI_MODEL, key=settings.GEMINI_API_KEY)
    req = urllib.request.Request(
        url, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.load(resp)
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        raise ValueError(f"Không gọi được model: {e}") from e
    try:
        return json.loads(data["candidates"][0]["content"]["parts"][0]["text"])
    except (KeyError, IndexError, TypeError, json.JSONDecodeError) as e:
        raise ValueError("Model trả về không đọc được") from e


def _check(out: dict) -> dict:
    """Chặn ở tầng code những gì prompt đã dặn — phòng khi model quên.

    So khớp trên bản BỎ DẤU để bắt mọi cách viết, nhưng cắt trên bản GỐC để
    câu trả lời trả về vẫn nguyên dấu tiếng Việt.
    """
    reply = (out.get("reply") or "").strip()
    hit = [c for c in _CAM if c in _bo_dau(reply)]
    if hit:
        out["warning"] = (f"⚠️ Câu trả lời có nhắc {hit} — ĐÃ BỎ dòng đó. "
                          f"Đọc lại xem có cần viết thêm không.")
        out["reply"] = "\n".join(
            ln for ln in reply.split("\n")
            if not any(c in _bo_dau(ln) for c in hit)
        ).strip()
    return out


def reply_for_text(post_text: str) -> dict:
    """Soạn câu trả lời cho một bài đăng dạng chữ."""
    if not settings.GEMINI_API_KEY:
        raise ValueError("Chưa cấu hình GEMINI_API_KEY.")
    if not (post_text or "").strip():
        raise ValueError("Chưa có nội dung bài đăng.")
    return _check(_call([
        {"text": "Đây là NỘI DUNG một bài đăng trong hội nhóm giáo viên. "
                 "Soạn câu trả lời bình luận.\n\n--- BÀI ĐĂNG ---\n" + post_text[:6000]},
    ]))


def reply_for_image(image_b64: str, mime: str = "image/jpeg", note: str = "") -> dict:
    """Soạn câu trả lời từ ẢNH CHỤP MÀN HÌNH bài đăng."""
    if not settings.GEMINI_API_KEY:
        raise ValueError("Chưa cấu hình GEMINI_API_KEY.")
    txt = ("Đây là ẢNH CHỤP MÀN HÌNH một bài đăng trong hội nhóm giáo viên Facebook. "
           "Đọc nội dung bài (và bình luận nếu thấy), rồi soạn câu trả lời bình luận.")
    if note.strip():
        txt += f"\n\nGhi chú thêm từ người gửi: {note.strip()[:500]}"
    return _check(_call([
        {"text": txt},
        {"inline_data": {"mime_type": mime or "image/jpeg", "data": image_b64}},
    ]))
