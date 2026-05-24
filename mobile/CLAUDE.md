# DayThem Mobile — CLAUDE.md

App quản lý lớp dạy thêm cho giáo viên cá nhân. React Native + Expo, chạy trên web để prototype.

---

## Stack

| Layer | Tech |
|-------|------|
| Framework | React Native 0.81.5 + Expo SDK 54 |
| Language | TypeScript (strict) |
| Navigation | `@react-navigation/native-stack` + `@react-navigation/bottom-tabs` |
| State | Zustand v5 |
| HTTP | Axios — base URL `http://localhost:8000/api/v1` |
| Icons | `@expo/vector-icons` (Ionicons) — xem `src/components/icons/index.tsx` |
| Font | Be Vietnam Pro — load qua `web/index.html` |
| Web mode | `react-native-web` — chạy bằng `npx expo start --web` |

---

## Cấu trúc thư mục

```
src/
├── api/              # axios calls: auth, classes, students, attendance, tuition, announcements, reports
├── components/
│   ├── icons/        # index.tsx — tất cả icon map sang Ionicons
│   └── ui/           # Avatar, Button, Card
├── navigation/
│   └── index.tsx     # AppNavigator: Auth stack / MainTabs / feature screens
├── screens/
│   ├── Auth/         # WelcomeScreen, OTPScreen, SetupScreen
│   ├── Home/         # HomeScreen
│   ├── Classes/      # ClassesScreen (tab)
│   ├── Class/        # ClassDetailScreen, CreateClassScreen
│   ├── Attendance/   # AttendanceScreen
│   ├── Student/      # StudentsTabScreen (tab + inline profile)
│   ├── Tuition/      # TuitionTabScreen (tab)
│   ├── Report/       # ReportTabScreen (tab)
│   └── Announce/     # CancelClassScreen, MakeupPollScreen
├── store/            # auth.ts, classes.ts, storage.ts
└── theme/            # index.ts — colors, spacing, radius, typography
```

---

## Design system

Màu sắc xấp xỉ từ oklch trong `DayThem.html` sang hex:

```typescript
colors.green500   = '#4a9e72'   // primary — button, active state
colors.green600   = '#3d8760'
colors.green700   = '#2f6849'
colors.coral500   = '#e07a5f'   // accent — warning, absent
colors.coral700   = '#b85a42'
colors.honey100   = '#fef5e1'   // warm highlight
colors.bg         = '#faf8f2'   // screen background
colors.border     = '#e8e4da'
colors.textSecondary = '#6b6b6b'
```

---

## Patterns quan trọng

### SVG inline (web-only, không cần react-native-svg)
```tsx
const SvgEl = 'svg' as any;
const CircleEl = 'circle' as any;
// Dùng cho ring counter, progress circle — render đúng trên expo web
```

### Gradient background (web-only)
```tsx
// KHÔNG đặt trong StyleSheet.create — TypeScript sẽ báo lỗi
<View style={[s.card, { backgroundImage: 'linear-gradient(160deg, #f0faf4, #d8f3e3)' } as any]}>
```

### Overlay / absolute fill
```tsx
// Cần cast as any vì inset không có trong RN TypeScript types
style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as any}
```

### Demo fallback data
Các tab screen (Students, Tuition, Report) có demo data hiện khi API trả về rỗng:
- `StudentsTabScreen`: `DEMO_STUDENTS` — 7 học sinh mẫu
- `TuitionTabScreen`: `DEMO_TUITION` — 9 học sinh 2 lớp, mix paid/unpaid
- `ReportTabScreen`: `DEMO_CLASSES` — Lớp 9 + Lớp 10

---

## Navigation

```
Stack
├── Welcome / OTP              (chưa login)
├── Setup                      (đã login, chưa có tên)
└── MainTabs                   (đã login)
    ├── Home
    ├── Classes
    ├── Students
    ├── Tuition
    └── Reports
    + Stack overlays:
      ├── ClassDetail
      ├── CreateClass
      ├── Attendance   (params: classId, className)
      ├── CancelClass  (params: classId, className)
      └── MakeupPoll   (params: announcementId, makeupId)
```

Auth flow: `useAuthStore` — `logout()` xóa `auth_token` khỏi storage → navigator tự redirect về Welcome.

---

## Chạy và kiểm tra

```bash
npx expo start --web      # mở browser, hot reload
npx tsc --noEmit          # type check — phải clean trước khi xem là xong
```

---

## Design reference

Prototype gốc: `C:\DayThem\DayThem.html` (single-file, mở bằng browser).

Source JSX tham khảo:
```
C:\Users\cts\.claude\projects\C--DayThem\
  771d8795-b38d-4636-9635-f3ccc6f704cb\tool-results\design2_files\daythem\project\
    flows.jsx     # Attendance, Tuition, StudentProfile, Report
    announce.jsx  # CancelClass, MakeupFlow
    shared.jsx    # icons, seed data (STUDENTS_9, STUDENTS_10, CLASSES)
    home.jsx      # HomeA/B/C variants
```
