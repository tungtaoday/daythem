# DayThem — UX Flows & Sequence Diagrams

> Phiên bản: v1.0 · Ngày: 2026-05-22  
> Notation: `Teacher` = giáo viên dùng app · `App` = React Native client · `API` = backend REST

---

## Flow 1 — Onboarding & Đăng nhập

### 1.1 Đăng nhập lần đầu (Google / Facebook)

```mermaid
sequenceDiagram
    actor Teacher
    participant App
    participant SocialOAuth as Google/Facebook OAuth
    participant API

    Teacher->>App: Mở app lần đầu
    App->>App: loadMe() → token = null
    App->>Teacher: WelcomeScreen (Google / Facebook / Phone)

    Teacher->>App: Tap "Tiếp tục với Google"
    App->>SocialOAuth: OAuth redirect (mock trong prototype)
    SocialOAuth-->>App: id_token + name + avatar
    App->>API: POST /auth/social {provider, id_token}
    API-->>App: {token, teacher}
    App->>App: storage.set('auth_token', token)
    App->>App: teacher.name = null → navigate Setup

    Teacher->>App: Chọn "Cô giáo" / "Thầy giáo"
    Teacher->>App: Nhập tên
    Teacher->>App: Tap "Vào app 🌿"
    App->>API: PUT /auth/profile {name}
    API-->>App: teacher updated
    App->>App: storage.set('teacher_gender', gender)
    App->>Teacher: HomeScreen (MainTabs)
```

### 1.2 Đăng nhập bằng số điện thoại (OTP)

```mermaid
sequenceDiagram
    actor Teacher
    participant App
    participant API
    participant SMS

    Teacher->>App: Tap "Tiếp tục với số điện thoại"
    Teacher->>App: Nhập SĐT (0xxxxxxxxx)
    Teacher->>App: Tap "Gửi mã xác thực"
    App->>API: POST /auth/request-otp {phone}
    API->>SMS: Gửi OTP 6 số
    API-->>App: {dev_code} (dev only)
    App->>Teacher: OTPScreen

    Teacher->>App: Nhập 6 số (auto-advance mỗi ô)
    App->>API: POST /auth/verify-otp {phone, code}
    API-->>App: {token, teacher}
    App->>App: Lưu token → navigate Setup (nếu chưa có tên)
```

---

## Flow 2 — Quản lý Lớp học (CLS)

### 2.1 Tạo lớp mới

```mermaid
sequenceDiagram
    actor Teacher
    participant App
    participant API

    Teacher->>App: HomeScreen → tap "+ Thêm lớp"
    App->>Teacher: CreateClassScreen
    Teacher->>App: Nhập tên lớp, môn, khối, học phí, lịch
    Teacher->>App: Tap "Tạo lớp"
    App->>API: POST /classes {name, subject, grade, default_fee, fee_type, schedule}
    API-->>App: Class {id, ...}
    App->>App: classes.push(newClass)
    App->>Teacher: ClassDetailScreen (lớp mới)
```

### 2.2 Xem chi tiết lớp & điều hướng

```mermaid
sequenceDiagram
    actor Teacher
    participant App

    Teacher->>App: ClassesScreen → tap vào lớp
    App->>Teacher: ClassDetailScreen
    Note over App,Teacher: 6 action tiles + danh sách học sinh có thể tap

    Teacher->>App: Tap "Điểm danh" → AttendanceScreen {classId}
    Teacher->>App: Tap "Báo nghỉ" → CancelClassScreen {classId}
    Teacher->>App: Tap "Cài đặt" → ClassSettingsScreen {classId}

    alt Tab screen (Thu tiền / Báo cáo / Học sinh)
        Teacher->>App: Tap "Thu tiền" → TuitionTab {filterClassId}
        App->>Teacher: TuitionTab hiển thị breadcrumb "‹ [Tên lớp]"
        Teacher->>App: Tap breadcrumb → về ClassDetailScreen

        Teacher->>App: Tap "Báo cáo" → ReportTab {filterClassId}
        App->>Teacher: ReportTab hiển thị breadcrumb "‹ [Tên lớp]"
        Teacher->>App: Tap breadcrumb → về ClassDetailScreen

        Teacher->>App: Tap "Học sinh" → StudentsTab {filterClassId}
        App->>Teacher: StudentsTab hiển thị breadcrumb "‹ [Tên lớp]"
        Teacher->>App: Tap breadcrumb → về ClassDetailScreen
    end

    Teacher->>App: Tap học sinh trong danh sách → StudentsTab {filterClassId}
```

> **Quy tắc breadcrumb:** Breadcrumb `‹ [Tên lớp]` chỉ hiện khi API backend hoạt động (class tồn tại trong store). Trong chế độ demo, breadcrumb ẩn vì không có class thật để quay về. Lọc `filterClassId` được fallback về `'all'` nếu ID không khớp dữ liệu hiện tại.

### 2.3 Cài đặt lớp học (ClassSettings)

```mermaid
sequenceDiagram
    actor Teacher
    participant App
    participant API

    Teacher->>App: ClassDetailScreen → "Cài đặt"
    App->>API: GET /classes/{id}/students
    API-->>App: students[]
    App->>Teacher: ClassSettingsScreen (tên lớp, môn, học phí từ store)
    Note over App,Teacher: State khởi tạo từ klass trong Zustand store

    Teacher->>App: Chỉnh tên lớp / môn học / học phí mặc định / cách tính
    Teacher->>App: Tap "Lưu thay đổi"
    App->>API: PUT /classes/{id} {name, subject, default_fee, fee_type}
    API-->>App: Class updated
    App->>App: Update store
    App->>Teacher: Button hiển thị "✓ Đã lưu"

    Teacher->>App: Tap học sinh → FeeModal
    App->>Teacher: FeeModal (preset: mặc định / giảm 50% / miễn phí / tuỳ chỉnh)
    Teacher->>App: Chọn preset hoặc nhập số tiền + ghi chú → Tap "Lưu"
    App->>API: PUT /students/{id}/fee {override, note}
    API-->>App: ok
    App->>App: Update local state
    App->>Teacher: Badge "cá biệt" cập nhật
```

### 2.4 Thêm học sinh trực tiếp từ ClassDetail

```mermaid
sequenceDiagram
    actor Teacher
    participant App
    participant API

    Teacher->>App: ClassDetailScreen → tap "+ Thêm" (góc phải section Học sinh)
    App->>Teacher: AddStudentModal (pageSheet)

    Teacher->>App: Nhập tên học sinh (bắt buộc)
    Teacher->>App: Nhập SĐT phụ huynh (tuỳ chọn)
    Teacher->>App: Tap "Thêm học sinh"
    App->>API: POST /classes/{id}/students {name, parent_phone}
    API-->>App: Student {id, ...}
    App->>App: Store: students[classId].push(student), student_count++
    App->>Teacher: Modal đóng, học sinh xuất hiện ngay trong danh sách
```

---

## Flow 3 — Điểm danh (ATT)

```mermaid
sequenceDiagram
    actor Teacher
    participant App
    participant API

    Teacher->>App: ClassDetail → "Điểm danh"
    App->>API: GET /classes/{id}/students
    API-->>App: students[]
    App->>App: Khởi tạo marks = {all: 'present'}
    App->>Teacher: AttendanceScreen (danh sách)

    loop Mỗi học sinh vắng
        Teacher->>App: Tap tên → toggle 'absent'
        App->>App: marks[id] = 'absent'
        opt Ghi lý do
            Teacher->>App: Tap icon note → NoteModal
            Teacher->>App: Chọn preset / gõ tay → Lưu
            App->>App: notes[id] = reason
        end
    end

    Teacher->>App: Tap "Hoàn tất điểm danh"
    App->>API: POST /classes/{id}/attendance {session_date, records[]}
    API-->>App: ok
    App->>Teacher: SuccessScreen

    alt Có học sinh vắng
        App->>Teacher: NudgeCard (gợi ý nhắn Zalo)
        Teacher->>App: Tap "Nhắn Zalo hỏi thăm"
        App->>Teacher: ZaloCopySheet (tin nhắn hỏi thăm)
        Teacher->>App: Copy → mở Zalo → dán → gửi
        Teacher->>App: Tap "Đã gửi Zalo ✓"
        App->>App: Ghi nhận đã liên lạc
    end
```

---

## Flow 4 — Thu học phí (TUI)

### 4.1 Xem & tick đã thu

```mermaid
sequenceDiagram
    actor Teacher
    participant App
    participant API

    Teacher->>App: Tab "Học phí"
    App->>API: GET /classes/{id}/tuition/{month} (mỗi lớp)
    API-->>App: tuition[]
    App->>Teacher: Hero card (tổng đã thu / chưa thu) + danh sách CHƯA NỘP

    Teacher->>App: Tap "Tick đã thu" cho học sinh X
    App->>API: POST /classes/{id}/tuition/payment {student_id, paid: true}
    API-->>App: ok
    App->>App: Update local: paid = true
    App->>Teacher: Danh sách cập nhật
```

### 4.2 Gửi nhắc học phí qua Zalo

```mermaid
sequenceDiagram
    actor Teacher
    participant App

    App->>Teacher: Banner "N phụ huynh chưa nộp · Gửi nhắc"
    Teacher->>App: Tap "Gửi nhắc"
    App->>Teacher: ZaloCopySheet
    Note over App,Teacher: 3 mẫu: Nhẹ nhàng / Trực tiếp / Kèm STK

    Teacher->>App: Chọn giọng điệu (tone chip)
    Teacher->>App: Chỉnh sửa nội dung (tuỳ chọn)
    Teacher->>App: Tap "Copy tin nhắn"
    App->>App: navigator.clipboard.writeText(text)
    App->>Teacher: "✓ Đã copy" + hướng dẫn dán Zalo

    Teacher->>Teacher: Mở Zalo → tìm nhóm/phụ huynh → dán → gửi

    Teacher->>App: Tap "Đã gửi Zalo ✓"
    App->>Teacher: Checkmark animation → đóng sheet
    App->>Teacher: Banner → "Đã gửi N tin Zalo"
```

---

## Flow 5 — Báo nghỉ & Học bù (ANN)

### 5.1 Báo nghỉ

```mermaid
sequenceDiagram
    actor Teacher
    participant App
    participant API

    Teacher->>App: ClassDetail → "Báo nghỉ"
    App->>Teacher: CancelClassScreen

    Teacher->>App: Chọn lý do (chips)
    Teacher->>App: Ghi chú thêm (tuỳ chọn)
    Teacher->>App: Toggle "Đặt buổi học bù"
    Teacher->>App: Tap "Soạn tin nhắn Zalo"

    App->>Teacher: ZaloCopySheet (tin báo nghỉ auto-fill)
    Teacher->>App: Copy → dán Zalo → gửi
    Teacher->>App: "Đã gửi Zalo ✓"

    App->>API: POST /classes/{id}/announcements {type: cancel, reason, propose_makeup}
    API-->>App: announcement {id}
    App->>Teacher: SuccessScreen

    alt propose_makeup = true
        App->>Teacher: "Bước tiếp theo: Đề xuất buổi học bù →"
        Teacher->>App: Tap → MakeupPollScreen
    end
```

### 5.2 Đề xuất học bù (Makeup Poll)

```mermaid
sequenceDiagram
    actor Teacher
    participant App
    participant API

    Teacher->>App: MakeupPollScreen
    App->>Teacher: 2–3 slot thời gian đề xuất

    Note over Teacher,App: Giáo viên chia sẻ link/hỏi phụ huynh vote qua Zalo
    Teacher->>App: Nhập số votes cho mỗi slot (simulate)

    App->>Teacher: Badge "Nhiều nhất" trên slot dẫn đầu
    Teacher->>App: Tap "Chốt buổi học bù"
    App->>API: POST /announcements/{id}/makeup/confirm {slot_index}
    API-->>App: ok
    App->>Teacher: SuccessScreen (ngày học bù đã lưu)
```

---

## Flow 6 — Báo cáo tuần (RPT)

```mermaid
sequenceDiagram
    actor Teacher
    participant App
    participant API

    Teacher->>App: Tab "Báo cáo"
    App->>API: GET /classes (để lấy danh sách)
    API-->>App: classes[]
    App->>Teacher: ReportTabScreen (thống kê tuần hiện tại)

    opt Lọc theo lớp
        Teacher->>App: Tap chip lớp
        App->>App: displayClasses = [lớp đó]
    end

    Teacher->>App: Tap "Soạn báo cáo Zalo · N phụ huynh"
    App->>Teacher: ZaloCopySheet (mẫu báo cáo tuần)
    Note over App,Teacher: Tên con và số liệu điền tự động từ dữ liệu tuần

    Teacher->>App: Chỉnh sửa nội dung
    Teacher->>App: Copy → dán Zalo từng phụ huynh / nhóm
    Teacher->>App: "Đã gửi Zalo ✓"

    App->>API: POST /classes/{id}/reports {week_start, recipient_count} (mỗi lớp)
    API-->>App: ok
    App->>Teacher: Animation đang gửi → SuccessScreen "Đã gửi N báo cáo"
```

---

## Flow 7 — Quản lý Học sinh (STU)

```mermaid
sequenceDiagram
    actor Teacher
    participant App
    participant API

    Teacher->>App: Tab "Học sinh"
    App->>Teacher: StudentsTabScreen (17 học sinh · 2 lớp)

    opt Filter
        Teacher->>App: Tap chip "Chưa nộp" / "Cần quan tâm" / tên lớp
        App->>App: filteredGroups = ...
    end

    Teacher->>App: Tap học sinh
    App->>Teacher: StudentProfile (3 tabs: Tổng quan / Điểm danh / Học phí)

    Teacher->>App: Tap "Nhắn Zalo"
    App->>Teacher: ZaloCopySheet (tin nhắn cá nhân hoá)

    Teacher->>App: Tap "Gọi"
    App->>App: Linking.openURL('tel:...')
```

---

## Flow 8 — Lịch & Tổng quan (Home + Calendar)

```mermaid
sequenceDiagram
    actor Teacher
    participant App

    Teacher->>App: HomeScreen (mở app)
    App->>Teacher: Quick actions: Điểm danh / Thu tiền / Báo nghỉ / Báo cáo
    App->>Teacher: Activity feed (3 items gần nhất)
    App->>Teacher: 3 stats chips (Lớp học / Học sinh / Nghỉ nhiều)

    Teacher->>App: Tap icon Calendar (top right)
    App->>Teacher: CalendarScreen

    Teacher->>App: Tap ngày bất kỳ
    App->>App: selectedDate = date
    App->>Teacher: Class cards cho ngày đó

    Teacher->>App: Tap "Mở lớp →"
    App->>Teacher: ClassDetailScreen {classId}
```

---

## Screen Inventory

| Screen | Path | Trigger |
|--------|------|---------|
| WelcomeScreen | `/Auth/WelcomeScreen` | Chưa đăng nhập |
| OTPScreen | `/Auth/OTPScreen` | Đăng nhập SĐT |
| SetupScreen | `/Auth/SetupScreen` | Đã đăng nhập, chưa có tên |
| HomeScreen | `MainTabs/Home` | Default sau login |
| CalendarScreen | `Stack/Calendar` | Icon lịch ở Home |
| ClassesScreen | `MainTabs/Classes` | Tab "Lớp học" |
| ClassDetailScreen | `Stack/ClassDetail` | Tap lớp bất kỳ |
| CreateClassScreen | `Stack/CreateClass` | FAB tạo lớp |
| ClassSettingsScreen | `Stack/ClassSettings` | Tile "Cài đặt" trong ClassDetail |
| AttendanceScreen | `Stack/Attendance` | Tile "Điểm danh" |
| CancelClassScreen | `Stack/CancelClass` | Tile "Báo nghỉ" |
| MakeupPollScreen | `Stack/MakeupPoll` | Sau báo nghỉ có học bù |
| StudentsTabScreen | `MainTabs/Students` | Tab "Học sinh" |
| TuitionTabScreen | `MainTabs/Tuition` | Tab "Học phí" |
| ReportTabScreen | `MainTabs/Reports` | Tab "Báo cáo" |
| ProfileScreen | `Stack/Profile` | Avatar ở Home |

---

## Navigation Map

```
Stack (Root)
├── WelcomeScreen
├── OTPScreen
├── SetupScreen
└── MainTabs
    ├── Tab: Home
    ├── Tab: Classes
    ├── Tab: Students        ← nhận filterClassId param
    ├── Tab: Tuition         ← nhận filterClassId param
    ├── Tab: Reports         ← nhận filterClassId param
    │
    └── Stack overlays
        ├── ClassDetail      {classId, className}
        ├── CreateClass
        ├── Attendance       {classId, className}
        ├── CancelClass      {classId, className}
        ├── MakeupPoll       {announcementId, makeupId}
        ├── ClassSettings    {classId, className}
        ├── Profile
        └── Calendar
```

**Quy tắc điều hướng:**
- Stack screen → Tab screen: `navigation.navigate('MainTabs', { screen: 'TabName', params: { filterClassId } })`
- Tab screen → Stack screen: `navigation.navigate('ScreenName', { params })`
- Back: `navigation.goBack()` hoặc nút ← hardware
