# GieoChữ — Growth Hacks để tăng nhanh số giáo viên

> Ngày: 2026-07-14. Bổ sung cho `docs/gtm-checklist.md`.
> Nguyên tắc cho tệp GV trung niên, ngại tech, sống trong Zalo: **spam phản tác dụng** — cái nhân nhanh là *sản phẩm tự quảng cáo* + *đúng thời điểm đau* + *truyền miệng giữa đồng nghiệp*. Không dùng chiêu spam/mass-DM/tài khoản ảo (mất uy tín cả group, không hồi phục được).
> Cơ sở: 3 case verify (Azota, ClassDojo, MISA) + audit codebase (cái gì thật/giả).

---

## 0. Cách xếp ưu tiên (leverage × feasibility)

- **Leverage** = một hành động sinh ra bao nhiêu GV mới (đòn bẩy cao = tự nhân).
- **Feasibility** = chạy được NGAY hay cần build/sửa sản phẩm trước.
- **P0 = làm trước tiên** (gate hoặc thời điểm cấp). **P1 = cao. **P2 = làm khi có nền.

| # | Growth hack | Leverage | Chạy được ngay? | Ưu tiên |
|---|-------------|:--------:|-----------------|:-------:|
| 1 | Biến báo cáo phụ huynh thành "quảng cáo tự lan" (watermark thiệp) | ⭐⭐⭐⭐⭐ | Sau khi sửa luồng báo cáo (Bước 0) | **P0** |
| 2 | Cưỡi sóng thời điểm: đầu năm học (T8–9) + Thông tư 29 | ⭐⭐⭐⭐⭐ | Ngay — nhưng cửa sổ đóng ~15/9 | **P0** |
| 3 | Giết ma sát nhập liệu bằng OCR (đã có sẵn `gemini.py`) | ⭐⭐⭐⭐ | Gần ngay (đã có backend) | **P0/P1** |
| 4 | "Đại sứ cô giáo" thay ads (10–20 GV được nể/group) | ⭐⭐⭐⭐⭐ | Ngay | **P1** |
| 5 | Onboarding cầm tay (video Zalo 10' set up giúp cô) | ⭐⭐⭐⭐ | Ngay | **P1** |
| 6 | Referral 1 chạm qua Zalo, thưởng 2 chiều | ⭐⭐⭐⭐⭐ | Cần build (hiện 0 code) | **P1/P2** |
| 7 | Lead magnet pháp lý/thuế (kiểu MISA) dẫn vào app | ⭐⭐⭐⭐ | Ngay | **P1** |
| 8 | "Khoe báo cáo" vào group GV như social proof | ⭐⭐⭐⭐ | Sau #1 | **P1** |
| 9 | Zalo OA broadcast mẹo hằng tuần (giữ + tái kích hoạt) | ⭐⭐⭐ | Ngay | **P2** |
| 10 | Notification bám lịch tháng (thu phí/có lớp) | ⭐⭐⭐ | Cần build nhẹ | **P2** |

---

## 1. Chi tiết từng hack

### #1 — Biến "báo cáo phụ huynh" thành mẩu quảng cáo tự lan **(P0, đòn bẩy #1)**
Bài học ClassDojo áp thẳng: mỗi cô có 10–50 phụ huynh; mỗi tin cô gửi = 1 lượt hiển thị miễn phí.
- Đóng dấu tinh tế lên thiệp (`ThiepShare` đã có): *"Tạo bằng GieoChữ · miễn phí cho giáo viên"*.
- Làm thiệp đẹp tới mức GV khác phải hỏi "làm bằng gì?" → mỗi cô khoe = 20 cô hỏi.
- Phụ huynh nhận thiệp đẹp: nhiều người cũng dạy thêm / có bạn dạy thêm → tự tìm app.
- ⚠️ **Chặn dưới:** luồng "gửi báo cáo" đang GIẢ (progress fake, "Đã gửi X" nhưng không gửi, tin dùng chữ literal `[Tên con]`). Hack chỉ chạy **sau Bước 0**. Đây là động cơ tăng trưởng số 1 → sửa trước mọi thứ.

### #2 — Cưỡi sóng thời điểm **(P0, CẤP — cửa sổ đang đóng)**
Hôm nay 14/7. Đầu năm học (T8–9) còn ~6–8 tuần = *đau cao nhất năm* (lập lớp mới, thu học phí tháng đầu, sắp danh sách HS). Azota bùng nhờ cưỡi sóng COVID; sóng của bạn = **lịch đầu năm học + TT29**.
- Dồn content + beta đẩy **trước 15/8**, cao điểm **20/8–15/9**.
- Thông điệp: *"Vào năm học mới, quản lớp gọn từ ngày đầu."*
- Sóng phụ trong năm: đầu mỗi tháng (thu học phí), mùa quyết toán thuế.

### #3 — Giết ma sát nhập liệu bằng OCR **(P0/P1 — bạn đã có sẵn)**
Rào cản aha lớn nhất tệp ngại tech = gõ tay danh sách HS. Backend đã có `gemini.py` OCR.
- Hook: *"Chụp sổ điểm danh — app tự nhập cả lớp trong 10 giây, khỏi gõ tay."*
- Rút time-to-aha từ ~15 phút → ~1 phút = khác biệt giữa "dùng tiếp" và "gỡ app".

### #4 — "Đại sứ cô giáo" thay vì chạy ads **(P1)**
Tệp tin đồng nghiệp, không tin quảng cáo (đã social-listen).
- Tuyển 10–20 cô được nể trong mỗi group mục tiêu: tặng Pro trọn đời + huy hiệu + được góp ý tính năng.
- Họ đăng bài THẬT → chuyển đổi gấp nhiều lần KOL trả tiền.

### #5 — Onboarding cầm tay (do things that don't scale) **(P1)**
- 50–100 GV đầu: gọi video Zalo 10' set up lớp giúp cô.
- Không scale mãi, nhưng ép activation → retention → truyền miệng, và cho testimonial + hiểu pain thật.

### #6 — Referral 1 chạm qua Zalo **(P1/P2 — cần build)**
- Thưởng 2 chiều (VD +1 tháng Pro / mở thêm lớp), link/QR gửi qua Zalo, tracking.
- Đặt điểm mời **ngay sau khoảnh khắc gửi báo cáo** (lúc cô thấy giá trị rõ nhất).
- ⚠️ Audit: hiện **0 dòng code** → phải build. ROI cao vì tệp lan qua truyền miệng.

### #7 — Lead magnet pháp lý/thuế dẫn vào app **(P1, kiểu MISA)**
- Phát miễn phí trong group: checklist đăng ký HKD dạy thêm, "Dạy bao nhiêu/năm thì phải lo thuế? (2026)", mẫu báo cáo.
- Bản tĩnh (PDF) có watermark; **bản tự động điền tên nằm trong app**.
- ⚠️ Con số thuế đổi nhanh (500tr→1 tỷ giữa các nguồn) → dẫn văn bản mới nhất + "tham khảo, đối chiếu cơ quan thuế".

### #8 — "Khoe báo cáo" vào group GV **(P1, sau #1)**
- Làm nút/luồng để cô chia sẻ báo cáo cuối tháng đẹp thẳng vào FB group như một "flex".
- Social proof đặt đúng kênh chuyển đổi (group tiểu học Nhóm A).

### #9 — Zalo OA broadcast mẹo hằng tuần **(P2)**
- Kênh giữ chân + tái kích hoạt + hỗ trợ người thật (tệp ngại tech cần).

### #10 — Notification bám lịch tháng **(P2, build nhẹ)**
- Nhắc "cuối tháng thu học phí" / "hôm nay có lớp" → bám nhịp tháng, tăng Retention W4 (chỉ số sinh tử).

---

## 2. Trình tự nếu phải 10x số GV trong 90 ngày

1. **Tuần 1–2:** Bước 0 sự thật hoá (sửa luồng báo cáo giả + đồng bộ landing) + watermark thiệp (#1) + bật hook OCR (#3). *Sản phẩm phải "khoe được" trước.*
2. **Tuần 2–4:** onboarding cầm tay 50 GV beta (#5) → thu video/testimonial → chốt 10 đại sứ (#4).
3. **Tuần 4–8 (trùng đầu năm học):** đại sứ + lead magnet pháp lý/thuế (#7) đổ vào 5 group tiểu học (#8), cao điểm 20/8–15/9 (#2).
4. **Song song:** build referral Zalo (#6), bật khi đã có ~vài trăm GV để nhân số. Lập Zalo OA (#9) + notification lịch tháng (#10).

---

## 3. Một sự thật cốt lõi
Growth hack mạnh nhất của GieoChữ **không phải mẹo phân phối** — mà là **làm cho cái cô gửi cho phụ huynh vừa đẹp vừa thật**. Sửa xong luồng báo cáo, mỗi cô tự thành một kênh marketing (10–50 phụ huynh/cô). Chưa sửa thì mọi hack phân phối = đổ nước vào rổ thủng.

## 4. Không làm (backfire với tệp này)
- Spam group, mass-DM, tài khoản ảo, comment rác → mất uy tín cả group, không hồi phục.
- Overclaim ("gửi Zalo tự động", "đăng nhập Zalo", "tự nộp thuế") khi sản phẩm chưa làm được → GV soi kỹ, mất niềm tin.
- Chặn tính năng lõi sau paywall → chặn viral (bài học ClassDojo: giữ core free).
