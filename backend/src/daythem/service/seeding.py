"""Seeding hằng ngày — hôm nay vào nhóm tìm gì, trả lời thế nào.

Vì sao có file này: ở mức 0 người dùng, cách kiếm khách hiệu quả nhất là **trả lời
câu hỏi có sẵn trong hội nhóm**, không phải đăng bài quảng cáo. Nhưng việc đó dễ bỏ
bê vì không có ai nhắc. Module này biến nó thành việc hằng ngày có người nhắc.

**TẤT ĐỊNH — không gọi AI.** Chủ đề xoay vòng theo ngày trong năm. Cùng một ngày
chạy bao nhiêu lần cũng ra cùng kết quả, không tốn token, không lỗi mạng.

Trọng số bám dữ liệu nghe ngóng thật (xem docs/books/05):
  "nhắc học phí"       — 44 lần được nhắc  → xuất hiện 3/8 vòng
  "Thông tư 29 / HKD"  —  8 lần            → 2/8
  "báo cáo & phẩm giá" —  0 lần            → 1/8 (hay nhưng chưa ai kêu)
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True)
class Topic:
    key: str
    name: str
    keywords: list[str]       # gõ vào ô tìm kiếm TRONG nhóm
    reply: str                # mẫu trả lời ngắn, dán được ngay
    pillar: str               # trụ nội dung, để ghi vào post log


TOPICS: dict[str, Topic] = {
    "hocphi": Topic(
        key="hocphi",
        name="Nhắc học phí khéo léo",
        keywords=["học phí", "nhắc phụ huynh", "phụ huynh chậm đóng", "đòi tiền học"],
        reply=(
            "Em thấy nhiều thầy cô làm cách này đỡ ngại hơn hẳn: đừng nhắc trong nhóm lớp, "
            "nhắn riêng từng phụ huynh, và nhắn theo mẫu cố định — có tên con, số buổi đã học, "
            "số tiền.\n\n"
            "Nhắn riêng thì phụ huynh không mất mặt trước người khác, mà có số liệu cụ thể thì "
            "thành thông báo chứ không thành đòi nợ.\n\n"
            "Cái khó là nhớ nhắc ai rồi ai chưa — chỗ này cô ghi ra giấy hay dùng công cụ gì "
            "cũng được, miễn đừng nhắc trùng."
        ),
        pillar="Mẹo vận hành",
    ),
    "thongtu29": Topic(
        key="thongtu29",
        name="Thông tư 29 & hộ kinh doanh",
        keywords=["thông tư 29", "hộ kinh doanh", "dạy thêm có phải đăng ký", "giấy phép dạy thêm"],
        reply=(
            "Theo Thông tư 29/2024, dạy thêm ngoài nhà trường có thu tiền thì phải đăng ký kinh "
            "doanh — phổ biến nhất là hộ kinh doanh, đăng ký ở UBND cấp xã/phường nơi mình dạy.\n\n"
            "Hồ sơ khá gọn: đơn đăng ký + bản sao CCCD, lệ phí thấp.\n\n"
            "Cô ở tỉnh nào để em nói cụ thể hơn chỗ nộp ạ?"
        ),
        pillar="Pháp lý",
    ),
    "thue": Topic(
        key="thue",
        name="Thuế cho giáo viên dạy thêm",
        keywords=["thuế dạy thêm", "kê khai thuế", "09/KK-TNCN", "ngưỡng chịu thuế"],
        reply=(
            "Từ 2026 ngưỡng doanh thu chịu thuế của hộ kinh doanh đã nâng lên 1 tỷ/năm — đa số "
            "thầy cô dạy thêm ở nhà nằm dưới ngưỡng này, tức là không phải nộp.\n\n"
            "Nhưng vẫn nên giữ sổ thu chi rõ ràng: ai đóng bao nhiêu, tháng nào. Lỡ có ai hỏi thì "
            "mình có số liệu, mà cuối năm nhìn lại cũng biết mình dạy được bao nhiêu.\n\n"
            "Cô cần mẫu sổ thu chi đơn giản thì em gửi cô tham khảo ạ."
        ),
        pillar="Thuế",
    ),
    "diemdanh": Topic(
        key="diemdanh",
        name="Điểm danh & sổ sách lớp",
        keywords=["điểm danh", "sổ điểm danh", "quản lý lớp dạy thêm", "theo dõi học sinh"],
        reply=(
            "Mẹo nhỏ mà đỡ được nhiều: điểm danh ngay lúc các con đang vào chỗ, đừng để cuối buổi "
            "mới nhớ lại — cuối buổi là quên, mà quên thì cuối tháng tính tiền theo buổi sẽ lệch.\n\n"
            "Với lớp thu theo buổi thì nên ghi luôn lý do vắng. Sau này phụ huynh hỏi 'sao tháng "
            "này ít buổi thế' là mình có câu trả lời ngay, đỡ khó xử ạ."
        ),
        pillar="Mẹo vận hành",
    ),
    "baocao": Topic(
        key="baocao",
        name="Báo cáo riêng cho phụ huynh",
        keywords=["báo cáo phụ huynh", "nhận xét học sinh", "phản hồi phụ huynh"],
        reply=(
            "Em thấy gửi riêng từng phụ huynh hiệu quả hơn nhắn chung nhiều: có tên con, số buổi "
            "đã học, chuyên cần, và một câu nhận xét thật.\n\n"
            "Nhắn chung thì phụ huynh lướt qua. Nhắn riêng có tên con thì họ đọc kỹ, mà con nào "
            "học chưa tốt cũng không bị nêu trước mặt cả lớp.\n\n"
            "Mỗi tuần một lần là đủ, không cần nhiều ạ."
        ),
        pillar="Phẩm giá",
    ),
}

# Vòng xoay 8 ngày — chủ đề nào người ta kêu nhiều thì xuất hiện nhiều.
CYCLE: list[str] = [
    "hocphi", "thongtu29", "hocphi", "diemdanh",
    "thue", "hocphi", "baocao", "thongtu29",
]


def topic_of_day(d: date) -> Topic:
    """Chủ đề seeding của một ngày. Tất định — cùng ngày luôn ra cùng chủ đề."""
    return TOPICS[CYCLE[d.toordinal() % len(CYCLE)]]


def seeding_lines(d: date, posts_this_week: int, target_posts: int) -> list[str]:
    """Khối 'Seeding hôm nay' cho bản tin Telegram (HTML)."""
    t = topic_of_day(d)
    kw = " · ".join(t.keywords[:3])
    lines = [
        "",
        f"<b>🌱 SEEDING HÔM NAY — {t.name}</b>",
        f"<i>Vào 5 nhóm, tìm trong nhóm:</i> {kw}",
        f"<i>Trả lời 2 câu. KHÔNG nhắc app.</i>",
        "",
        "<b>Mẫu trả lời:</b>",
        f"<code>{t.reply}</code>",
    ]
    if posts_this_week < target_posts:
        lines.append("")
        lines.append(
            f"📝 Bài đăng tuần này: <b>{posts_this_week}/{target_posts}</b> — "
            f"ghi lại ở gieochu.vn/admin sau khi đăng"
        )
    return lines
