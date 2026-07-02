# BRD — Đồng bộ Design System (P0) + Tính năng từ bản thiết kế

**Mã:** BREQ-DS-FEATURES · **Ngày:** 2026-07-02 · **App:** GieoChữ (RN + Expo)
**Nguồn tính năng:** bộ design gốc trong `C:\DayThem\template\*.html` (đã đối chiếu với app hiện tại).

---

## 1. Bối cảnh
App đã đủ tính năng lõi. Hai việc còn lại:
- **P0 — Đồng bộ design system** (dọn nợ kỹ thuật, rủi ro thấp): các màn đang tự chế hero/nút/thẻ/màu → thống nhất qua `<Hero>/<Card>/<Button>` + token.
- **Tính năng đẹp từ bản thiết kế** mà app chưa có (Strict — cần duyệt trước khi làm).

## 2. Phạm vi P0 (design system — Flexible, làm ngay)

| # | Yêu cầu | Tiêu chí chấp nhận |
|---|---------|--------------------|
| P0.1 | **1 nút Back chung** (`<BackButton>`) | Mọi màn dùng cùng 1 icon/kiểu; vùng chạm ≥ 44px; thay hết 4 kiểu (`←`, `‹`, chevron, Ionicon) |
| P0.2 | **Quét màu → token** | `#888→textSecondary`, `#1a1a1a→textPrimary`, `#eeece6→border`, `#4a9e72→green500`, `#3d8760→green600`, `#8a6d30→honey700`, `#3a7dd3→zalo`. Chữ xám đồng 1 tông |
| P0.3 | **Nút chính qua `<Button>`** | Chiều cao thống nhất 48; bỏ `btnPrimary/sendBtn/saveBtn` tự chế |
| P0.4 | **Thẻ qua `<Card>`** (radius 20, border token) | Hết loạn bo góc 18–26 |
| P0.5 | **1 màn "Thành công" chung** (`<SuccessScreen>`) | 4 màn success (Cancel/Makeup/Attendance/Report) dùng chung |
| P0.6 | **Xoá code chết** | Xoá `ReportScreen`, `TuitionScreen`, `StudentListScreen` (không có trong navigation) |
| P0.7 | **typography.* cho tiêu đề/nhãn** | Bỏ cỡ chữ lẻ (13.5/12.5); nhãn section đồng nhất |

**Cách làm an toàn:** làm từng cụm, xem mắt trên web sau mỗi cụm, giữ checkpoint để revert. KHÔNG nhiều agent song song trên cùng file.

## 3. Backlog tính năng mới (từ bản thiết kế — Strict, chờ duyệt)

| # | Tính năng | Nguồn design | Ưu tiên | Backend? | Effort |
|---|-----------|--------------|---------|----------|--------|
| F1 | **Lịch tuần (agenda)** + tổng quan tháng (định kỳ/bù/nghỉ) | `Lịch tuần agenda` | **Cao** | Không | M |
| F2 | **Báo cáo: Tuần/Tháng/Tổng** + biểu đồ chuyên cần thật + Δ tuần | `Báo cáo analytics` | **Cao** | Không (tính từ sessions) | M |
| F3 | **Bài đã dạy / Chương** ghi theo buổi (điểm danh) → vào báo cáo phụ huynh | `analytics`, `Assistant` | **Cao** | **Có** (field ở session) | M |
| F4 | **Hiển thị chuyên cần % + trạng thái (OK/Vắng nhiều/Xuất sắc) + Còn nợ** cho tài khoản THẬT ở tab Học sinh | `Học sinh directory` | Cao | Không (tính thật) | M |
| F5 | **Học phí: doanh thu theo tháng (biểu đồ thật) + Δ%** | `Học phí finance` | Vừa | Không | S–M |
| F6 | **Fee breakdown** "4 buổi/tháng · 125k/buổi" + hiện **ghi chú phí riêng** + "X cá biệt" | `Cài đặt lớp` | Vừa | Không | S |
| F7 | **Nhiều buổi định kỳ/tuần** cho 1 lớp | `Cài đặt lớp` | Vừa | **Có** (schedule → mảng) | L |
| F8 | **Mã QR chuyển khoản (VietQR)** trong tin nhắc học phí | `Profile`, landing | Vừa | Không (dựng URL VietQR) | S–M |
| F9 | **Profile: buổi-đã-dạy + kinh nghiệm (bio) + hiển thị Zalo** | `Profile tương tác` | Thấp | **Có** (bio field) | S |
| F10 | **Nhóm Zalo liên kết** (thay "Sắp có") | `Cài đặt lớp` | Thấp | Có (đã có zalo_group_id) | M |
| F11 | **Thẻ trợ lý giàu hơn**: nội dung buổi + đếm ngược + "Xem từng người" | `Assistant xuất` | Thấp | Không | M |

## 4. Đề xuất thứ tự
1. **P0** (an toàn) trước — dọn nền để build tính năng lên sạch hơn.
2. Tính năng **Cao** (F1 Lịch tuần, F2 Báo cáo toggle+chart, F4 chuyên cần thật) — không cần backend, giá trị cao.
3. Tính năng cần backend (F3 bài dạy, F7 nhiều buổi, F9 bio) — làm sau, có UC riêng.

## 5. Ngoài phạm vi đợt này
Dark mode (Giao diện Sáng/Tối), đa ngôn ngữ, thanh toán trong app.
