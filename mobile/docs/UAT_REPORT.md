# DayThem — Báo cáo Kiểm thử UAT

> Phiên bản: v1.0 · Ngày: 2026-05-22  
> Môi trường: Prototype web (`npx expo start --web`)  
> Người kiểm thử: _______________  
> Trạng thái: ⬜ Chưa chạy

---

## Quy ước

| Ký hiệu | Ý nghĩa |
|---------|---------|
| ✅ Pass | Hành vi đúng, giao diện đúng |
| ❌ Fail | Lỗi hoặc hành vi sai |
| ⚠️ Partial | Đúng một phần, cần theo dõi |
| ⬜ Skip | Chưa kiểm thử |
| 🔁 Blocked | Bị chặn bởi lỗi trước |

**Cách điền:** Thay `⬜` bằng `✅ / ❌ / ⚠️` sau khi chạy từng bước. Ghi chú lỗi vào cột **Ghi chú / Bug**.

---

## Tóm tắt kết quả

| Flow | Tổng TC | Pass | Fail | Skip | Tỉ lệ |
|------|---------|------|------|------|-------|
| F1 — Onboarding & Đăng nhập | 12 | | | | |
| F2 — Quản lý Lớp học | 10 | | | | |
| F3 — Điểm danh | 11 | | | | |
| F4 — Thu học phí | 9 | | | | |
| F5 — Báo nghỉ & Học bù | 10 | | | | |
| F6 — Báo cáo tuần | 8 | | | | |
| F7 — Quản lý Học sinh | 8 | | | | |
| F8 — Lịch & Tổng quan | 6 | | | | |
| **Tổng cộng** | **74** | | | | |

---

## F1 — Onboarding & Đăng nhập

### F1.1 Đăng nhập Google / Facebook

| ID | Bước kiểm thử | Kết quả mong đợi | Kết quả thực tế | Ghi chú / Bug |
|----|---------------|-----------------|-----------------|---------------|
| F1.1.1 | Mở app lần đầu (chưa đăng nhập) | Hiển thị WelcomeScreen với 3 nút: Google, Facebook, Số điện thoại | ⬜ | |
| F1.1.2 | Tap "Tiếp tục với Google" | Hiển thị loading overlay "Đang kết nối Google…"; sau ~1s chuyển sang SetupScreen hoặc HomeScreen | ⬜ | |
| F1.1.3 | Tap "Tiếp tục với Facebook" | Hiển thị loading overlay "Đang kết nối Facebook…"; sau ~1s chuyển sang SetupScreen | ⬜ | |
| F1.1.4 | SetupScreen hiển thị | Có 2 chip giới tính (Cô giáo / Thầy giáo), TextInput tên, nút "Vào app 🌿" bị disable khi tên trống | ⬜ | |
| F1.1.5 | Chọn "Cô giáo" | Chip "Cô giáo" active (màu xanh), tiêu đề đổi thành "Cô tên gì ạ?" | ⬜ | |
| F1.1.6 | Chọn "Thầy giáo" | Chip "Thầy giáo" active, tiêu đề đổi thành "Thầy tên gì ạ?" | ⬜ | |
| F1.1.7 | Nhập tên và tap "Vào app 🌿" | Lưu tên + giới tính, chuyển về HomeScreen (MainTabs) | ⬜ | |

### F1.2 Đăng nhập bằng số điện thoại (OTP)

| ID | Bước kiểm thử | Kết quả mong đợi | Kết quả thực tế | Ghi chú / Bug |
|----|---------------|-----------------|-----------------|---------------|
| F1.2.1 | Tap "Tiếp tục với số điện thoại" | Hiển thị OTPScreen với ô nhập SĐT | ⬜ | |
| F1.2.2 | Nhập SĐT và tap "Gửi mã xác thực" | Chuyển sang màn hình nhập 6 số OTP | ⬜ | |
| F1.2.3 | Nhập từng số OTP | Tự động focus ô tiếp theo (auto-advance) | ⬜ | |
| F1.2.4 | Nhập đủ 6 số (dev code: 123456) | Tự động submit, chuyển sang SetupScreen hoặc HomeScreen | ⬜ | |
| F1.2.5 | Đăng nhập lần 2 (đã có tên) | Bỏ qua SetupScreen, vào thẳng HomeScreen | ⬜ | |

---

## F2 — Quản lý Lớp học (CLS)

### F2.1 Tạo lớp mới

| ID | Bước kiểm thử | Kết quả mong đợi | Kết quả thực tế | Ghi chú / Bug |
|----|---------------|-----------------|-----------------|---------------|
| F2.1.1 | HomeScreen → tap "+ Thêm lớp" hoặc ClassesScreen → FAB | Mở CreateClassScreen | ⬜ | |
| F2.1.2 | Điền đầy đủ: tên lớp, môn, khối, học phí, lịch học | Form nhận input, validate định dạng học phí (số) | ⬜ | |
| F2.1.3 | Tap "Tạo lớp" | Gọi API (mock), lớp mới xuất hiện trong ClassesScreen | ⬜ | |
| F2.1.4 | Tap vào lớp mới tạo | Mở ClassDetailScreen với 6 action tiles: Điểm danh / Thu tiền / Báo nghỉ / Báo cáo / Học sinh / Cài đặt | ⬜ | |

### F2.2 Điều hướng từ ClassDetail

| ID | Bước kiểm thử | Kết quả mong đợi | Kết quả thực tế | Ghi chú / Bug |
|----|---------------|-----------------|-----------------|---------------|
| F2.2.1 | Tap "Học sinh" | Mở tab Học sinh, đã filter sẵn theo lớp đó (chip lớp active) | ⬜ | |
| F2.2.2 | Tap "Thu tiền" | Mở tab Học phí, đã filter sẵn theo lớp đó | ⬜ | |
| F2.2.3 | Tap "Báo cáo" | Mở tab Báo cáo, đã filter sẵn theo lớp đó | ⬜ | |

### F2.3 Cài đặt lớp

| ID | Bước kiểm thử | Kết quả mong đợi | Kết quả thực tế | Ghi chú / Bug |
|----|---------------|-----------------|-----------------|---------------|
| F2.3.1 | Tap "Cài đặt" trong ClassDetail | Mở ClassSettingsScreen với tiêu đề "Cài đặt · {tên lớp}" | ⬜ | |
| F2.3.2 | Chỉnh tên lớp, môn học → Lưu | Cập nhật thành công, không crash | ⬜ | |
| F2.3.3 | Tap vào học sinh trong danh sách | Mở FeeModal với 3 preset (Mặc định / Giảm 50% / Miễn phí) + ô nhập tuỳ chỉnh | ⬜ | |

---

## F3 — Điểm danh (ATT)

| ID | Bước kiểm thử | Kết quả mong đợi | Kết quả thực tế | Ghi chú / Bug |
|----|---------------|-----------------|-----------------|---------------|
| F3.1 | ClassDetail → tap "Điểm danh" | Mở AttendanceScreen, tải danh sách học sinh, mặc định tất cả "Có mặt" (toggle xanh) | ⬜ | |
| F3.2 | Ring counter khi tất cả có mặt | Hiện "Cả lớp có mặt 🎉", ring đầy màu xanh, tỉ lệ N/N | ⬜ | |
| F3.3 | Tap tên học sinh để đánh vắng | Dòng chuyển sang nền đỏ nhạt, toggle đổi sang ✗ viền đỏ, counter cập nhật | ⬜ | |
| F3.4 | Tap lại để đánh có mặt | Trở về trạng thái ban đầu | ⬜ | |
| F3.5 | Tap icon ghi chú (khi học sinh vắng) | Mở NoteModal với 4 preset: Bị ốm / Bận thi / Việc gia đình / Không báo | ⬜ | |
| F3.6 | Chọn preset lý do | Preset active (viền xanh), text hiện trong ô input | ⬜ | |
| F3.7 | Gõ lý do tùy ý | TextInput nhận text, override preset | ⬜ | |
| F3.8 | Tap "Lưu" trong NoteModal | Modal đóng, subtitle học sinh hiển thị lý do đã nhập | ⬜ | |
| F3.9 | Tap "Hoàn tất điểm danh" | Gọi API (mock), chuyển sang SuccessScreen: tick xanh, đếm số có mặt/tổng | ⬜ | |
| F3.10 | SuccessScreen — có học sinh vắng | Hiển thị NudgeCard gợi ý nhắn Zalo với tên học sinh vắng | ⬜ | |
| F3.11 | Tap "Nhắn Zalo hỏi thăm" | Mở ZaloCopySheet với tin nhắn hỏi thăm đã điền tên học sinh; flow Copy → Đã copy → "Đã gửi Zalo ✓" | ⬜ | |

---

## F4 — Thu học phí (TUI)

### F4.1 Xem danh sách & tick đã thu

| ID | Bước kiểm thử | Kết quả mong đợi | Kết quả thực tế | Ghi chú / Bug |
|----|---------------|-----------------|-----------------|---------------|
| F4.1.1 | Vào tab "Học phí" | Hero card tổng đã thu / chưa thu; danh sách học sinh CHƯA NỘP ở trên | ⬜ | |
| F4.1.2 | Filter chip theo lớp | Chỉ hiện học sinh thuộc lớp đó; hero card cập nhật tổng theo filter | ⬜ | |
| F4.1.3 | Tap "Tick đã thu" cho học sinh | Học sinh chuyển sang trạng thái Đã nộp, số liệu hero card cập nhật | ⬜ | |
| F4.1.4 | Vào từ ClassDetail → "Thu tiền" | Tab Học phí mở với chip lớp đó đã được chọn sẵn | ⬜ | |

### F4.2 Gửi nhắc học phí qua Zalo

| ID | Bước kiểm thử | Kết quả mong đợi | Kết quả thực tế | Ghi chú / Bug |
|----|---------------|-----------------|-----------------|---------------|
| F4.2.1 | Banner "N phụ huynh chưa nộp" hiển thị | Số đếm đúng với số học sinh chưa nộp | ⬜ | |
| F4.2.2 | Tap "Gửi nhắc" | Mở ZaloCopySheet với 3 tone: Nhẹ nhàng / Trực tiếp / Kèm STK | ⬜ | |
| F4.2.3 | Chuyển giữa 3 tone | Nội dung tin nhắn thay đổi tương ứng | ⬜ | |
| F4.2.4 | Chỉnh sửa nội dung tin nhắn | TextInput cho phép sửa tự do | ⬜ | |
| F4.2.5 | Tap "Copy tin nhắn" | Toast/indicator "✓ Đã copy" xuất hiện; clipboard có nội dung đúng | ⬜ | |
| F4.2.6 | Tap "Đã gửi Zalo ✓" | Sheet đóng, banner cập nhật "Đã gửi N tin Zalo" | ⬜ | |

---

## F5 — Báo nghỉ & Học bù (ANN)

### F5.1 Báo nghỉ

| ID | Bước kiểm thử | Kết quả mong đợi | Kết quả thực tế | Ghi chú / Bug |
|----|---------------|-----------------|-----------------|---------------|
| F5.1.1 | ClassDetail → tap "Báo nghỉ" | Mở CancelClassScreen | ⬜ | |
| F5.1.2 | Chọn lý do (chip) | Chip active, lý do được lưu vào state | ⬜ | |
| F5.1.3 | Ghi chú thêm (tuỳ chọn) | TextInput cho phép gõ tự do | ⬜ | |
| F5.1.4 | Toggle "Đặt buổi học bù" | Toggle chuyển màu, state thay đổi | ⬜ | |
| F5.1.5 | Tap "Soạn tin nhắn Zalo" | Mở ZaloCopySheet với tin báo nghỉ đã điền lý do; tên lớp và ngày tháng tự động | ⬜ | |
| F5.1.6 | Copy và xác nhận đã gửi | Gọi API (mock), chuyển sang SuccessScreen | ⬜ | |
| F5.1.7 | SuccessScreen khi có học bù | Hiển thị CTA "Đề xuất buổi học bù →" | ⬜ | |

### F5.2 Đề xuất học bù (Makeup Poll)

| ID | Bước kiểm thử | Kết quả mong đợi | Kết quả thực tế | Ghi chú / Bug |
|----|---------------|-----------------|-----------------|---------------|
| F5.2.1 | Tap "Đề xuất buổi học bù →" | Mở MakeupPollScreen với 2–3 slot thời gian | ⬜ | |
| F5.2.2 | Nhập số votes vào từng slot | Slot có votes cao nhất hiển thị badge "Nhiều nhất" | ⬜ | |
| F5.2.3 | Tap "Chốt buổi học bù" | Gọi API (mock), SuccessScreen hiển thị ngày học bù đã lưu | ⬜ | |

---

## F6 — Báo cáo tuần (RPT)

| ID | Bước kiểm thử | Kết quả mong đợi | Kết quả thực tế | Ghi chú / Bug |
|----|---------------|-----------------|-----------------|---------------|
| F6.1 | Vào tab "Báo cáo" | Hiển thị ReportTabScreen với thống kê tuần hiện tại; danh sách lớp | ⬜ | |
| F6.2 | Filter chip theo lớp | Chỉ hiện báo cáo của lớp đó | ⬜ | |
| F6.3 | Vào từ ClassDetail → "Báo cáo" | Tab Báo cáo mở với lớp đó đã filter sẵn | ⬜ | |
| F6.4 | Tap "Soạn báo cáo Zalo · N phụ huynh" | Mở ZaloCopySheet với mẫu báo cáo tuần; điểm danh, học phí điền tự động | ⬜ | |
| F6.5 | Chỉnh sửa nội dung báo cáo | TextInput cho phép sửa trước khi copy | ⬜ | |
| F6.6 | Copy báo cáo | "✓ Đã copy" indicator, clipboard đúng nội dung | ⬜ | |
| F6.7 | Tap "Đã gửi Zalo ✓" | Sheet đóng, API ghi nhận (mock) | ⬜ | |
| F6.8 | Tap "Về trang chính" sau khi gửi | Về HomeScreen, state reset (không còn thấy SuccessScreen nếu quay lại tab) | ⬜ | |

---

## F7 — Quản lý Học sinh (STU)

| ID | Bước kiểm thử | Kết quả mong đợi | Kết quả thực tế | Ghi chú / Bug |
|----|---------------|-----------------|-----------------|---------------|
| F7.1 | Vào tab "Học sinh" | Hiển thị danh sách học sinh nhóm theo lớp, tổng số học sinh + lớp | ⬜ | |
| F7.2 | Filter chip "Chưa nộp" | Chỉ hiện học sinh có học phí chưa nộp tháng này | ⬜ | |
| F7.3 | Filter chip "Cần quan tâm" | Chỉ hiện học sinh vắng ≥ 2 buổi liên tiếp | ⬜ | |
| F7.4 | Filter chip theo tên lớp | Chỉ hiện học sinh lớp đó | ⬜ | |
| F7.5 | Vào từ ClassDetail → "Học sinh" | Tab đã filter sẵn theo lớp đó | ⬜ | |
| F7.6 | Tap vào học sinh | Mở StudentProfile với 3 tab: Tổng quan / Điểm danh / Học phí | ⬜ | |
| F7.7 | Tap "Nhắn Zalo" trong StudentProfile | Mở ZaloCopySheet với tin nhắn cá nhân hoá cho học sinh đó | ⬜ | |
| F7.8 | Tap "Gọi" trong StudentProfile | Mở app điện thoại với số phụ huynh (Linking.openURL tel:) | ⬜ | |

---

## F8 — Lịch & Tổng quan (Home + Calendar)

| ID | Bước kiểm thử | Kết quả mong đợi | Kết quả thực tế | Ghi chú / Bug |
|----|---------------|-----------------|-----------------|---------------|
| F8.1 | Mở HomeScreen | 4 quick-action tiles (Điểm danh / Thu tiền / Báo nghỉ / Báo cáo), activity feed 3 items gần nhất, 3 stat chips | ⬜ | |
| F8.2 | Stat chips hiển thị đúng | Hiện số lớp học, số học sinh, tên học sinh nghỉ nhiều nhất | ⬜ | |
| F8.3 | Tap icon Calendar (góc phải trên) | Mở CalendarScreen | ⬜ | |
| F8.4 | Tap ngày bất kỳ trong calendar | Highlight ngày đó, hiện class cards cho ngày đó bên dưới | ⬜ | |
| F8.5 | Tap "Mở lớp →" trong class card | Mở ClassDetailScreen của lớp đó | ⬜ | |
| F8.6 | Tap avatar (góc phải) trong HomeScreen | Mở ProfileScreen | ⬜ | |

---

## F9 — Profile & Tài khoản

> Flow phụ trợ — không có trong UX_FLOWS.md nhưng cần kiểm thử.

| ID | Bước kiểm thử | Kết quả mong đợi | Kết quả thực tế | Ghi chú / Bug |
|----|---------------|-----------------|-----------------|---------------|
| F9.1 | ProfileScreen hiển thị | Avatar, tên, SĐT, email; section TÀI KHOẢN với chip giới tính, mục Đổi mật khẩu | ⬜ | |
| F9.2 | Tap "Chỉnh sửa" | Các trường chuyển sang TextInput có thể sửa, nút "Lưu" xuất hiện | ⬜ | |
| F9.3 | Sửa tên + tap "Lưu" | Tên cập nhật, quay về chế độ xem | ⬜ | |
| F9.4 | Đổi giới tính Cô ↔ Thầy | Chip toggle hoạt động; cách xưng hô trong app thay đổi ở các màn hình khác | ⬜ | |
| F9.5 | Tap "Đổi mật khẩu" | Mở ChangePasswordModal với 3 trường: Mật khẩu hiện tại / Mật khẩu mới (≥6 ký tự) / Xác nhận | ⬜ | |
| F9.6 | Mật khẩu mới < 6 ký tự → tap Xác nhận | Trường viền đỏ, thông báo lỗi, không submit | ⬜ | |
| F9.7 | Mật khẩu mới ≠ xác nhận → tap Xác nhận | Trường xác nhận viền đỏ, không submit | ⬜ | |
| F9.8 | Nhập đúng đủ 3 trường → tap Xác nhận | Hiện ✓ animation thành công, modal tự đóng sau ~1s | ⬜ | |
| F9.9 | Section NHẬN HỌC PHÍ — chỉnh sửa ngân hàng | TextInput tên ngân hàng, số tài khoản, tên chủ tài khoản đều sửa được khi đang ở chế độ edit | ⬜ | |
| F9.10 | Tap "Đăng xuất" | Alert xác nhận; sau confirm → xóa token, về WelcomeScreen | ⬜ | |

---

## Kiểm thử hồi quy (Regression)

Sau khi sửa lỗi, chạy lại các TC sau để đảm bảo không có regression:

| ID | Mô tả | Liên quan đến |
|----|-------|---------------|
| REG.1 | Filter lớp trong 3 tab (Học sinh / Học phí / Báo cáo) vẫn hoạt động sau khi bấm back | F2.2, F4.1.4, F6.3, F7.5 |
| REG.2 | ZaloCopySheet đóng đúng sau confirm ở tất cả 4 flow | F3.11, F4.2.6, F5.1.6, F6.7 |
| REG.3 | Gender "Cô/Thầy" được lưu và phản ánh đúng sau reload | F1.1.5, F1.1.6, F9.4 |
| REG.4 | Demo data vẫn hiển thị khi API trả về rỗng | F3.1, F4.1.1, F6.1, F7.1 |
| REG.5 | Clipboard copy hoạt động trên web | F4.2.5, F5.1.5, F6.6 |

---

## Thiết bị & Trình duyệt kiểm thử

| Môi trường | Trình duyệt / OS | Người kiểm | Ngày | Kết quả tổng |
|------------|-----------------|------------|------|-------------|
| Desktop web | Chrome 125 / Windows 10 | | | ⬜ |
| Desktop web | Safari 17 / macOS | | | ⬜ |
| Mobile web | Chrome / Android | | | ⬜ |
| Mobile web | Safari / iOS | | | ⬜ |

---

## Danh sách lỗi phát hiện

> Điền khi tìm thấy lỗi trong quá trình kiểm thử.

| Bug ID | TC liên quan | Mô tả lỗi | Mức độ | Trạng thái |
|--------|-------------|-----------|--------|-----------|
| BUG-001 | | | 🔴 Critical / 🟡 Major / 🟢 Minor | Open / Fixed |

---

## Kết luận & Khuyến nghị

> Điền sau khi hoàn thành toàn bộ kiểm thử.

**Tổng số TC:** 74 + 10 (F9) = **84**  
**Pass:** ___  **Fail:** ___  **Skip:** ___

**Đánh giá tổng thể:**
- [ ] ✅ Sẵn sàng demo / release prototype
- [ ] ⚠️ Cần sửa lỗi Critical trước khi demo
- [ ] ❌ Cần rework đáng kể

**Lỗi cần ưu tiên xử lý:**
1. 
2. 
3. 

**Ghi chú thêm:**

---

*Báo cáo này được sinh tự động từ UX_FLOWS.md — cập nhật song song khi flows thay đổi.*
