# DayThem — Nghiệp vụ & Domain Model

> Phiên bản: v1.0 · Ngày: 2026-05-22  
> Đối tượng: giáo viên dạy thêm cá nhân, 1–5 lớp, 5–30 học sinh mỗi lớp

---

## 1. Tổng quan nghiệp vụ

DayThem giúp giáo viên dạy thêm tư quản lý toàn bộ vòng đời lớp học trong một app:

```
[Tạo lớp] → [Thêm học sinh] → [Lên lịch định kỳ]
     ↓
[Mỗi buổi học]
     ├── Điểm danh (ATT)
     ├── Thu học phí (TUI) — khi đến hạn
     └── Báo nghỉ / Học bù (ANN) — khi cần
     ↓
[Cuối tuần] → Gửi báo cáo phụ huynh (RPT)
```

**Người dùng duy nhất:** Giáo viên (TCH) — không có tài khoản phụ huynh.  
**Kênh thông báo:** Zalo (copy-paste template) → không cần tích hợp API Zalo.

---

## 2. Aggregate Map

| Aggregate | Abbrev | Mô tả | Vòng đời |
|-----------|--------|-------|----------|
| **Teacher** | TCH | Chủ tài khoản, cài đặt cá nhân | Singleton |
| **Class** | CLS | Lớp học = đơn vị tổ chức chính | Active → Archived |
| **Student** | STU | Học sinh thuộc 1 lớp | Enrolled → Left |
| **Attendance** | ATT | Phiên điểm danh theo buổi học | Draft → Recorded |
| **Tuition** | TUI | Trạng thái học phí từng học sinh theo tháng | Pending → Paid |
| **Announcement** | ANN | Thông báo nghỉ / học bù | Draft → Sent → Confirmed |
| **Report** | RPT | Báo cáo tuần gửi phụ huynh | Draft → Sent |

### Quan hệ

```
TCH (1) ──< CLS (n)
CLS (1) ──< STU (n)
CLS (1) ──< ATT (n)   // mỗi buổi học = 1 bản ghi ATT
ATT (1) ──< ATT_Record (n)  // 1 dòng / học sinh
CLS (1) ──< TUI (n)   // 1 bản ghi / (tháng × học sinh)
CLS (1) ──< ANN (n)
ANN (1) ──< Makeup (1?)  // đề xuất học bù
CLS (1) ──< RPT (n)   // 1 báo cáo / tuần
```

---

## 3. Entity Schemas

### 3.1 Teacher (TCH)

| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid | |
| `phone` | string | Dùng để xác thực OTP |
| `name` | string | "Cô Lan", "Thầy Minh" |
| `gender` | `'co'│'thay'` | Persist local storage |
| `email` | string? | Tuỳ chọn |
| `bank_name` | string? | Hiện trong tin nhắc học phí |
| `bank_number` | string? | |
| `bank_holder` | string? | |
| `avatar_url` | string? | |

**Business rules:**
- Mỗi tài khoản = 1 giáo viên duy nhất (không multi-user).
- Gender `co/thay` ảnh hưởng cách xưng hô trong toàn bộ app.

---

### 3.2 Class (CLS)

| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid | |
| `name` | string | "Lớp 9A", "Toán nâng cao" |
| `subject` | string | Toán / Lý / Anh... |
| `grade` | string | "9", "10", "THPT" |
| `default_fee` | number | Đơn vị: VNĐ |
| `fee_type` | `'month'│'session'│'course'` | Cách tính học phí |
| `schedule` | `{day, time, duration}[]` | Lịch học định kỳ |
| `zalo_group_id` | string? | ID nhóm Zalo liên kết |
| `color` | string? | Màu đại diện lớp |
| `status` | `'active'│'archived'` | |
| `student_count` | number | Denormalized |

**Business rules:**
- Lưu trữ lớp (archived) ẩn khỏi màn hình chính, giữ toàn bộ lịch sử.
- `fee_type = 'month'` → tính 1 lần/tháng, bất kể số buổi.
- `fee_type = 'session'` → tính theo số buổi thực học trong tháng.

---

### 3.3 Student (STU)

| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid | |
| `class_id` | uuid | FK → CLS |
| `name` | string | Họ tên đầy đủ |
| `parent_name` | string? | |
| `parent_phone` | string? | SĐT Zalo phụ huynh |
| `note` | string? | Ghi chú nội bộ |
| `fee_setting` | `{override: number│null, note: string│null}` | Override học phí mặc định |
| `status` | `'enrolled'│'left'` | |

**Business rules:**
- `fee_setting.override = null` → kế thừa `CLS.default_fee`.
- `fee_setting.override = 0` → miễn học phí (học bổng).
- `fee_setting.override > CLS.default_fee` → phụ đạo riêng.

---

### 3.4 Attendance (ATT)

| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid | |
| `class_id` | uuid | |
| `session_date` | date | YYYY-MM-DD |
| `notes` | string? | Ghi chú chung buổi học |
| `records` | `ATT_Record[]` | |

**ATT_Record:**

| Field | Type | Notes |
|-------|------|-------|
| `student_id` | uuid | |
| `present` | boolean | |
| `absence_reason` | string? | Bị ốm / Bận thi / Không báo... |

**Business rules:**
- Default: tất cả học sinh `present = true` — chỉ tap để đánh dấu vắng.
- 1 buổi học = 1 bản ghi ATT per class (không tạo 2 lần trong ngày).
- Cảnh báo nếu học sinh vắng ≥ 2 buổi liên tiếp → gợi ý nhắn Zalo.

---

### 3.5 Tuition (TUI)

| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid | |
| `class_id` | uuid | |
| `student_id` | uuid | |
| `month` | string | YYYY-MM |
| `amount` | number | Số tiền phải đóng tháng đó |
| `paid` | boolean | |
| `paid_at` | datetime? | |
| `payment_method` | string? | cash / transfer |

**Business rules:**
- Tạo tự động vào đầu mỗi tháng cho tất cả học sinh active.
- `amount` = `STU.fee_setting.override ?? CLS.default_fee`.
- Tick "Đã thu" không tạo giao dịch tài chính thật — chỉ ghi nhận trạng thái.

---

### 3.6 Announcement (ANN)

| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid | |
| `class_id` | uuid | |
| `type` | `'cancel'│'makeup'│'general'` | |
| `session_date` | date | Buổi bị ảnh hưởng |
| `content` | string | Nội dung thông báo |
| `reason` | string? | Lý do nghỉ |
| `propose_makeup` | boolean | |
| `status` | `'draft'│'sent'│'confirmed'` | |

**Makeup (con của ANN):**

| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid | |
| `announcement_id` | uuid | |
| `slots` | `{date, time, label}[]` | Tối đa 3 slot đề xuất |
| `votes` | `{slot_index: number, count: number}[]` | |
| `confirmed_slot` | number? | Index được chốt |

**Business rules:**
- Giáo viên chọn 2–3 slot → phụ huynh vote qua Zalo (link hoặc hỏi thăm).
- Slot có votes cao nhất → giáo viên confirm → tạo ATT mới cho ngày học bù.
- Trạng thái `sent` = giáo viên đã xác nhận copy-paste vào Zalo.

---

### 3.7 Report (RPT)

| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid | |
| `class_id` | uuid | |
| `week_start` | date | Thứ 2 đầu tuần |
| `content` | json | `{attendance_pct, homework_status, tuition_status}` |
| `sent_at` | datetime? | |
| `recipient_count` | number | |

**Business rules:**
- Tạo 1 báo cáo / tuần / lớp.
- Nội dung mẫu điền tự động từ dữ liệu tuần → giáo viên copy → paste vào Zalo từng phụ huynh hoặc nhóm lớp.

---

## 4. Business Rules tổng hợp

### Học phí
1. Học phí auto-gen đầu tháng cho tất cả học sinh active.
2. Fee = `override ?? class_default_fee`.
3. `fee_type = session` → fee = `sessions_in_month × rate_per_session`.
4. Tick "Đã thu" ghi `paid = true, paid_at = now`.
5. Gửi nhắc Zalo chỉ là copy-paste template — không tích hợp Zalo API.

### Điểm danh
1. Mặc định tất cả present → tap để vắng.
2. Không cho phép điểm danh cùng ngày 2 lần (upsert on conflict).
3. Alert vắng ≥ 2 buổi liên tiếp sau khi lưu.

### Thông báo / Học bù
1. Báo nghỉ → optional đề xuất học bù.
2. Poll học bù: 2–3 slots, votes từ Zalo (giáo viên tự nhập kết quả).
3. Confirm slot → lịch học bù được thêm vào calendar.

### Báo cáo tuần
1. Chạy mỗi cuối tuần (thủ công hoặc reminder tự động).
2. 1 tin nhắn template / học sinh — giáo viên copy từng tin hoặc dùng 1 tin chung cho cả nhóm.

---

## 5. Status Flow Diagrams

```
ATT: [Chưa điểm danh] → tap → [Draft] → "Hoàn tất" → [Recorded]

TUI: [Pending] ──────────────────────────── → tick → [Paid]
                └─ Zalo nhắc phụ huynh ──┘

ANN: [Draft] → soạn → "Soạn tin Zalo" → copy → xác nhận → [Sent]
                                                              ↓ propose_makeup
                                                         [Makeup.Draft]
                                                              ↓ confirm slot
                                                         [Makeup.Confirmed]

RPT: [Auto-generate] → soạn Zalo → copy → xác nhận → [Sent]
```
