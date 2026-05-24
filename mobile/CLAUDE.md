# DayThem Mobile — CLAUDE.md

App quản lý lớp dạy thêm cho giáo viên cá nhân. React Native + Expo, chạy trên web để prototype, build sang iPhone/Android bằng EAS.

---

## Stack

| Layer | Tech |
|-------|------|
| Framework | React Native 0.81.5 + Expo SDK 54 |
| Language | TypeScript (strict) — `npx tsc --noEmit` phải clean |
| Navigation | `@react-navigation/native-stack` + `@react-navigation/bottom-tabs` |
| State | Zustand v5 |
| HTTP | Axios — base URL `http://localhost:8000/api/v1` |
| Icons | `@expo/vector-icons` (Ionicons) — `src/components/icons/index.tsx` |
| Font | Be Vietnam Pro — load qua `web/index.html` |
| Web mode | `react-native-web` — `npx expo start --web` |
| Excel export | `xlsx` (SheetJS) + `expo-file-system` + `expo-sharing` |

---

## Cấu trúc thư mục

```
src/
├── api/              # axios calls: auth, classes, students, attendance, tuition, announcements, reports
├── components/
│   ├── icons/        # index.tsx — tất cả icon map sang Ionicons (kể cả IconDownload)
│   └── ui/           # Avatar, Button, Card, ZaloCopySheet
├── navigation/
│   └── index.tsx     # AppNavigator — xem mục Navigation bên dưới
├── screens/
│   ├── Auth/         # WelcomeScreen, PasswordScreen, SetupScreen
│   ├── Home/         # HomeScreen
│   ├── Classes/      # ClassesScreen (tab)
│   ├── Class/        # ClassDetailScreen, CreateClassScreen, ClassSettingsScreen
│   │                 # ClassStudentsScreen, ClassTuitionScreen, ClassReportScreen
│   ├── Attendance/   # AttendanceScreen
│   ├── Student/      # StudentsTabScreen (tab), StudentListScreen (DEAD CODE — không có trong navigation)
│   ├── Tuition/      # TuitionTabScreen (tab)
│   ├── Report/       # ReportTabScreen (tab), ReportScreen
│   └── Announce/     # CancelClassScreen, MakeupPollScreen
├── store/            # auth.ts, classes.ts, storage.ts
├── utils/            # exportExcel.ts — xuất Excel học sinh / học phí
└── theme/            # index.ts — colors, spacing, radius, typography
```

---

## Auth Flow (Password-based, không phải OTP)

Auth đã chuyển từ OTP sang mật khẩu từ tháng 5/2026:

```
WelcomeScreen
├── Google / Facebook → loginWithPassword('0901234567', 'demo123') [mock]
└── Số điện thoại → PasswordScreen → POST /auth/login {phone, password}
                                   → demo fallback nếu API lỗi
```

- **Tài khoản mới**: API tự tạo + set password hash (PBKDF2)
- **Tài khoản cũ** (OTP, chưa có password): lần đầu login → set password
- **Sai mật khẩu**: 401 → Alert lỗi

`useAuthStore` — `loginWithPassword`, `updateProfile`, `logout`  
`logout()` xóa `auth_token` khỏi SecureStore → navigator redirect về Welcome.

---

## Onboarding Setup (3 bước)

`SetupScreen` hiển thị khi `teacher.name === null` sau login:

| Bước | Màn hình | Dữ liệu |
|------|----------|---------|
| 1 — Profile | Cô/Thầy + tên + môn + khối | `gender`, `name`, `subjects[]`, `grades[]` |
| 2 — Lớp đầu | Tên lớp + lịch + học phí + địa điểm | → `createClass()` |
| 3 — Done | Summary card | → `updateProfile()` → vào app |

Progress bar 3 segment ở đầu screen. Bước 2 có thể skip (không nhập tên lớp).

---

## Navigation

```
Stack
├── Welcome                        (chưa login)
├── Password  (params: phone)      (chưa login)
├── Setup                          (đã login, teacher.name === null)
└── MainTabs                       (đã login + có tên)
    ├── Home         (HomeScreen)
    ├── Classes      (ClassesScreen)
    ├── Students     (StudentsTabScreen)
    ├── Tuition      (TuitionTabScreen)
    └── Reports      (ReportTabScreen)
    + Stack overlays:
      ├── ClassDetail     (params: classId, className)
      ├── CreateClass
      ├── ClassStudents   (params: classId, className) ← học sinh trong lớp
      ├── ClassTuition    (params: classId, className) ← học phí trong lớp
      ├── ClassReport     (params: classId, className) ← báo cáo trong lớp
      ├── ClassSettings   (params: classId, className) ← cài đặt lớp + học phí từng HS
      ├── Attendance      (params: classId, className)
      ├── CancelClass     (params: classId, className)
      ├── MakeupPoll      (params: announcementId, makeupId)
      ├── Profile
      └── Calendar
```

**Context lớp học**: khi vào ClassDetail → các sub-screen (Students, Tuition, Report, Settings) đều nhận `classId` + `className` qua params → giữ được context "đang ở trong lớp nào".

---

## API Contract

### Auth
```
POST /auth/login      { phone, password }  → { token, teacher }
GET  /auth/me                              → Teacher
PUT  /auth/profile    { name, avatar_url } → Teacher
```

### Fee (học phí)
```
PUT /students/{id}/fee  { fee_type, amount?, note? }
```
- `fee_type`: `"default"` | `"discount"` | `"free"` | `"custom"`
- `amount`: chỉ cần khi fee_type = discount/custom
- **KHÔNG** dùng `{ override, note }` — đó là format cũ đã bị fix

### Classes
```
PUT /classes/{id}   { name?, subject?, grade?, default_fee?, fee_type?, zalo_group_id? }
```

---

## Học phí — Luồng & Bug đã fix

### Thiết lập học phí mặc định lớp (`ClassSettingsScreen`)
- Trường "Số tiền" là `<TextInput>` (đơn vị nghìn đ), có preset chips 200k–1tr
- Bấm "Lưu thay đổi" → `PUT /classes/{id}` với `default_fee` + `fee_type`

### Thiết lập học phí từng học sinh (`ClassSettings → FeeModal`)
- Tap vào học sinh trong section "HỌC PHÍ TỪNG HỌC SINH"
- Modal có presets (Mặc định / Giảm 50% / Miễn phí) + input số tùy chỉnh
- Lưu → map sang `fee_type` rồi gọi `PUT /students/{id}/fee`
- Mapping `fee_setting` từ API: `fee_type === 'free' → override=0`, `fee_type === 'default' → override=null`, còn lại → `override = amount`

---

## Xuất Excel

`src/utils/exportExcel.ts` — dùng SheetJS:

```typescript
exportStudentsExcel(students, className)  // từ ClassStudentsScreen
exportTuitionExcel(items, className, monthLabel)  // từ ClassTuitionScreen
```

- **Web**: download Blob trực tiếp qua `URL.createObjectURL`
- **Native**: ghi file vào `FileSystem.cacheDirectory` → `Sharing.shareAsync`

Nút "Xuất Excel" (có `IconDownload`) xuất hiện trên summary bar / hero card khi có dữ liệu.

---

## Patterns quan trọng

### SVG inline (web-only)
```tsx
const SvgEl = 'svg' as any;
const CircleEl = 'circle' as any;
```

### Gradient background (web-only)
```tsx
// KHÔNG đặt trong StyleSheet.create
<View style={[s.card, { backgroundImage: 'linear-gradient(...)' } as any]}>
```

### Demo fallback data
Các screen hiển thị demo data khi API trả rỗng hoặc không connect:
- `ClassStudentsScreen`: `DEMO_STUS` (7 học sinh)
- `ClassTuitionScreen`: `DEMO_ITEMS` (7 học sinh)
- `TuitionTabScreen`: `DEMO_TUITION` (17 học sinh, 2 lớp)
- `StudentsTabScreen`: demo students

### Demo fallback auth
`loginWithPassword` catch block: nếu API lỗi → tạo `mock-token`, teacher.name = null → vào SetupScreen bình thường.

---

## Chạy và kiểm tra

```bash
# Từ thư mục mobile/
npx expo start --web   # browser, hot reload
npx tsc --noEmit       # type check — phải clean trước khi commit
```

---

## Design reference

Prototype gốc: `C:\DayThem\DayThem.html` (single-file HTML, mở bằng browser).

Source JSX tham khảo:
```
C:\Users\cts\.claude\projects\C--DayThem\
  771d8795-b38d-4636-9635-f3ccc6f704cb\tool-results\design2_files\daythem\project\
    flows.jsx     # Attendance, Tuition, StudentProfile, Report
    announce.jsx  # CancelClass, MakeupFlow
    shared.jsx    # icons, seed data
    home.jsx      # HomeA/B/C variants
```

---

## Dead code / Không dùng

| File | Trạng thái |
|------|-----------|
| `src/screens/Student/StudentListScreen.tsx` | Không có trong navigation — dead code |
| `src/screens/Auth/OTPScreen.tsx` | Đã xóa khi chuyển sang password auth |
