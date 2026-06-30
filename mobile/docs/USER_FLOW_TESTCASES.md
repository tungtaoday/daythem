# GieoChữ — Test Case cho User Flow (QA Checklist)

Mục đích: kiểm tra thủ công các luồng người dùng sau mỗi đợt sửa, đặc biệt các bug điều hướng & dữ liệu vừa khắc phục. Mỗi case: **Bước → Kết quả mong đợi**. Đánh dấu ✅/❌ khi test.

Quy ước tài khoản:
- **Thật**: đăng nhập bằng SĐT thật (có mạng, backend `daythem.doitay.vn`).
- **Demo**: mất mạng / backend lỗi → app tự vào demo (token `demo-...`), hiện dữ liệu mẫu.

---

## 0. REGRESSION — các lỗi vừa sửa (test trước tiên)

| # | Flow | Bước | Kết quả đúng |
|---|------|------|--------------|
| R1 | **Vào lớp → học sinh KHÔNG nhảy ra tab** | Mở 1 lớp (Chi tiết lớp) → chạm 1 học sinh trong danh sách | Mở **hồ sơ học sinh trong lớp** (không nhảy sang tab "Học sinh" lớn). Header gốc ẩn, chỉ còn 1 nút back |
| R2 | Back trong hồ sơ học sinh | Đang xem hồ sơ → bấm mũi tên back (hoặc nút back Android) | Quay lại **danh sách học sinh của lớp** (không thoát khỏi lớp) |
| R3 | STK không còn giả | Học phí → "Gửi nhắc" → chọn mẫu "Có chuyển khoản" | Nội dung **không có** số tài khoản giả "0123 456 789 / Ng. T. Mai" |
| R4 | Học bù không hiện ngày giả | Tài khoản thật → mở Học bù | **Không** hiện ngày 24–26/05 (2025). Danh sách slot trống + gợi ý "thêm khung giờ" |
| R5 | Báo nghỉ không báo thành công giả | Tắt mạng → Báo nghỉ → gửi | Hiện Alert "Chưa gửi được", **không** hiện "đã báo nghỉ" |
| R6 | Báo cáo không gửi "0 báo cáo" | Tài khoản thật, lớp chưa có học sinh → mở Báo cáo | Nút gửi **ẩn**, hiện "Thêm học sinh để gửi báo cáo" |
| R7 | Màu xanh đồng nhất | So sánh hero màn Thu tiền / Báo cáo lớp với Chi tiết lớp | Cùng 1 sắc xanh (không lệch tông) |
| R8 | Gradient hiện trên máy thật | Mở Home + Lớp học trên điện thoại | Hero có nền xanh đặc (không bị trắng/mất nền) |
| R9 | Thống kê không "chết" | Tài khoản thật → tab Học sinh | Không hiện "Cần quan tâm 0 / Chuyên cần –"; chỉ hiện số thật |
| R10 | Brand GieoChữ | Cài đặt thông báo + nội dung thông báo | Ghi "GieoChữ" (không còn "Gieo") |
| R11 | Giới tính Thầy | Tạo tài khoản chọn "Thầy" → xem các mẫu tin/nhắc | Mọi nơi xưng "thầy" (không còn "cô" cứng) |
| R12 | Xoá tài khoản | Hồ sơ → Xoá tài khoản → xác nhận 2 lần | Dữ liệu xoá vĩnh viễn, về màn đăng nhập |
| R13 | Đổi mật khẩu thật | Hồ sơ → Đổi mật khẩu → sai MK hiện tại | Hiện lỗi "Mật khẩu hiện tại không đúng" (không báo thành công giả) |

---

## 1. ĐĂNG NHẬP & ONBOARDING

- **1.1** Welcome → nhập SĐT mới → đặt mật khẩu (≥6 ký tự) → **tạo tài khoản** → vào Setup.
- **1.2** SĐT cũ + đúng mật khẩu → vào app. Sai mật khẩu → Alert "Mật khẩu không đúng", **không** vào app.
- **1.3** Mật khẩu < 6 ký tự → báo lỗi, không gửi.
- **1.4** Mất mạng → đăng nhập bất kỳ → vào **demo** (dữ liệu mẫu), không kẹt.
- **1.5** Setup 3 bước: chọn Cô/Thầy + tên + môn/khối → tạo lớp đầu (có thể bỏ qua) → vào app. Tên + giới tính hiển thị đúng ở Home.
- **1.6** Quên mật khẩu: hiển thị "Liên hệ hỗ trợ: support@gieochu.vn" (không còn số giả).

## 2. LỚP HỌC

- **2.1** Tạo lớp: Classes → + → chọn môn/khối/lịch/học phí → Tạo → lớp xuất hiện ở Classes + Home.
- **2.2** Header "Lớp của thầy/cô {tên}" đúng giới tính + tên.
- **2.3** Chi tiết lớp: hero đếm ngược buổi tới ("CÒN N NGÀY"/"HÔM NAY"), chỉ số Học sinh/Chuyên cần/Đã nộp.
- **2.4** Bánh răng góc phải hero + tile "Cài đặt" → đều mở **Cài đặt lớp**.
- **2.5** Cài đặt lớp: chip "Cách tính" (Theo tháng/buổi/khoá) — lớp mới tạo phải **được chọn sẵn "Theo tháng"** (không trống).
- **2.6** Sửa học phí mặc định + lưu → phản ánh ở Thu tiền.

## 3. HỌC SINH (trong lớp)

- **3.1** Thêm học sinh (modal 4 ô: tên*, phụ huynh, SĐT, ghi chú) từ Chi tiết lớp và từ màn Học sinh-trong-lớp → cùng kết quả.
- **3.2** (R1/R2) Chạm học sinh → hồ sơ trong lớp; back → danh sách lớp.
- **3.3** Hồ sơ → tab Học phí → đặt phí riêng (Mặc định/Giảm 50%/Miễn phí/tuỳ chỉnh) → Lưu → mở lại thấy đúng.
- **3.4** Tab Học sinh lớn: tài khoản thật chỉ hiện "{N} học sinh · {M} lớp" + lọc theo lớp (không có chip "Cần quan tâm/Chưa nộp" rỗng).

## 4. ĐIỂM DANH

- **4.1** Mở điểm danh: tất cả mặc định **Có mặt**, vòng đếm {N}/{N}.
- **4.2** Chạm 1 em → Vắng (đỏ), vòng đếm giảm.
- **4.3** Hoàn tất → lưu. Mất mạng → Alert lỗi, không mất dữ liệu.
- **4.4** Có em vắng → gợi ý nhắn Zalo hỏi thăm (xưng đúng thầy/cô).

## 5. HỌC PHÍ

- **5.1** Hero số tiền "đã thu / còn thiếu" đúng.
- **5.2** "Tick thu" 1 em → cập nhật ngay (optimistic). Mất mạng → rollback + Alert.
- **5.3** Gửi nhắc Zalo: 3 mẫu (nhẹ nhàng/trực tiếp/có chuyển khoản) — (R3) không số TK giả; xưng đúng giới tính.
- **5.4** Xuất Excel học phí.

## 6. BÁO NGHỈ / HỌC BÙ

- **6.1** Báo nghỉ: chọn lý do; "Khác" → nhập tự do thành lý do; xem trước tin nhóm Zalo dùng **tên + giới tính thật** + đúng môn/lớp.
- **6.2** (R5) Mất mạng → gửi → Alert lỗi, không báo thành công.
- **6.3** Học bù (thật): (R4) slot trống → "Thêm khung giờ" tạo ngày **tương lai thật** → chốt slot.
- **6.4** Học bù (demo): mô phỏng phụ huynh vote, badge "Nhiều nhất", chốt 1 chạm.

## 7. BÁO CÁO

- **7.1** (R6) Tài khoản thật chưa có học sinh → nút gửi ẩn, hiện hướng dẫn.
- **7.2** Có học sinh → "Gửi báo cáo cho {N} phụ huynh" → mở ZaloCopySheet.
- **7.3** Xem trước mẫu tin phụ huynh ([Tên con] điền tự động) + ghi chú trung thực.
- **7.4** Demo: dashboard thống kê + biểu đồ.

## 8. THÔNG BÁO (Cài đặt thông báo)

- **8.1** Profile → Cài đặt thông báo → bật/tắt từng loại + chọn giờ/ngày → lưu (gọi `/notify/prefs`).
- **8.2** Khung Không làm phiền (Từ/Đến).
- **8.3** (R10) Mục "TỪ GIEOCHỮ" + công tắc marketing.
- **8.4** Trên máy thật: cấp quyền → đến mốc giờ có thông báo (điểm danh trước buổi học, tóm tắt sáng...).

## 9. HỒ SƠ / TÀI KHOẢN

- **9.1** Sửa tên + giới tính → lưu → toàn app đổi xưng hô (thầy/cô) đúng.
- **9.2** (R13) Đổi mật khẩu: sai MK hiện tại → lỗi; đúng → đổi thật (đăng nhập lại bằng MK mới).
- **9.3** Đăng xuất → có hỏi xác nhận.
- **9.4** (R12) Xoá tài khoản → xác nhận 2 lần → dữ liệu xoá, `/auth/me` trả 401, về Welcome.
- **9.5** Thông tin ngân hàng nhận tiền lưu được (máy local).
- **9.6** SĐT trống hiển thị "Chưa thiết lập" (không số giả).

## 10. THUẾ TNCN

- **10.1** Profile → Thuế → chọn năm → tóm tắt doanh thu/thuế.
- **10.2** Tờ khai 09/KK-TNCN: ghi rõ "bản nháp", "GieoChữ không tự nộp thay".

## 11. NHẤT QUÁN TỔNG THỂ

- **11.1** Brand "GieoChữ" ở: Welcome (logo), Setup, Home, Tax, Thông báo.
- **11.2** Icon app + splash là mầm xanh GieoChữ.
- **11.3** Tài khoản thật: KHÔNG thấy số liệu bịa; mọi màn rỗng có hướng dẫn/CTA.
- **11.4** Safe-area: hero/header không bị status bar che; nút đáy không bị thanh điều hướng đè (test Samsung).

---

## Tự động hoá (tham khảo)
- Backend đã có e2e: `tests/e2e/test_delete_account.py` (xoá tài khoản + đổi mật khẩu), `test_notify.py`, `test_tax.py`, `test_security.py`...
- Mobile: jest cho store/auth, store/classes, api/client (46 test).
- Điều hướng end-to-end (R1/R2) nên test thủ công, hoặc thêm **Detox** nếu cần CI sau này.
