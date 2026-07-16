# GieoChữ — Clip hướng dẫn sử dụng app (tự động sinh)

> 2 clip video hướng dẫn dùng app, **sinh tự động từ mã nguồn**: chụp màn hình app + thuyết minh tiếng Việt + ghép MoviePy.
> Ngày: 2026-07-12.

## Sản phẩm
| Clip | Nội dung | Thời lượng | File |
|------|----------|-----------|------|
| **Lõi (core)** | Trang chủ → Điểm danh → Thu học phí → Báo cáo phụ huynh → Báo nghỉ/học bù | ~85s | `marketing/data/videos/GieoChu_huongdan_core.mp4` |
| **Đầy đủ (full)** | + Đăng nhập, Danh sách/Hồ sơ HS, Học phí, Chốt lịch học bù, Lịch tuần, Cài đặt lớp (13 phần) | ~137s | `marketing/data/videos/GieoChu_huongdan_full.mp4` |

Định dạng: **1080×1920 dọc** (hợp Facebook/TikTok/Zalo/Reels), 24fps, H.264 + audio AAC.

## Giải pháp (pipeline)
1. **Chụp màn hình app** — render prototype `DayThem.html` (self-contained, có seed data đẹp) bằng **Playwright headless**, chụp riêng 17 khung `.dc-card` → ảnh màn hình sạch (login, home, điểm danh, thu phí, báo cáo, báo nghỉ, học bù, học sinh, lịch, cài đặt, profile).
2. **Khung video** — dựng bằng PIL: nền honey ấm, tiêu đề xanh (brand GieoChữ), ảnh màn hình app căn giữa, footer thương hiệu.
3. **Thuyết minh** — **gTTS** (Google, giọng tiếng Việt) đọc kịch bản từng phần. *(edge-tts của Microsoft bị chặn trong môi trường này → dùng gTTS thay thế.)*
4. **Ghép** — **MoviePy** nối các đoạn (mỗi đoạn = ảnh + giọng đọc + padding) + intro/outro.

## Cách dùng
- Đăng thẳng lên **Fanpage / Reels / TikTok / Zalo**, hoặc gắn link trong bài giới thiệu.
- Clip **lõi** hợp làm quảng cáo/giới thiệu nhanh; clip **đầy đủ** hợp hướng dẫn người mới cài.
- Nội dung dùng branding **DayThem/GieoChữ** trong prototype — nếu prototype cập nhật thành GieoChữ hoàn toàn thì chụp lại sẽ đồng bộ tên.

## Tái tạo / chỉnh sửa
Script: `scratchpad/make_tutorial.py` (kịch bản từng phần trong biến `CORE` và `FULL`).
- Sửa lời thuyết minh: đổi câu narration trong `CORE`/`FULL`.
- Thêm/bớt phần: thêm dòng `("cardNN", "Tiêu đề", None, "lời đọc")` (xem `scratchpad/screens/manifest.json` để biết card nào là màn nào).
- Chụp lại màn hình (khi app/prototype đổi): `scratchpad/capture_screens.py`.
- Render lại: `python scratchpad/make_tutorial.py` → xuất vào `marketing/data/videos/`.

## Hạn chế & nâng cấp
- Đây là dạng **slideshow có thuyết minh** (ảnh tĩnh từng màn), không phải quay thao tác chạm live. Muốn footage chạm live → quay màn hình app thật theo kịch bản (đã có sẵn kịch bản trong script).
- Giọng gTTS ổn nhưng máy móc hơn giọng người. Nâng cấp: lồng giọng người thật, hoặc dùng TTS cao cấp (ElevenLabs/Azure) nếu có key.
- Có thể thêm nhạc nền nhẹ, hiệu ứng chuyển cảnh, và caption phụ đề để tăng chất lượng.
