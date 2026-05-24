# DayThem — Production Playbook

> Phiên bản: v1.0 · Ngày: 2026-05-22  
> Mục tiêu: đưa prototype mobile lên production cho Android (primary) + iOS (secondary)

---

## 0. Trạng thái hiện tại

| Hạng mục | Prototype | Production cần |
|----------|-----------|----------------|
| Frontend | React Native + Expo SDK 54, web-only | EAS Build → APK/IPA thật |
| Auth | Mock Google/Facebook OAuth (bypass) | OAuth thật |
| Backend | Axios → `localhost:8000` (chưa có server) | REST API thật trên cloud |
| Database | Không | PostgreSQL / Supabase |
| Zalo | Copy-paste template | Giữ nguyên (không cần API) |
| Storage | `expo-secure-store` local | + server sync |
| Notification | Không | `expo-notifications` + FCM |

---

## 1. Backend API — Spec tối thiểu (MVP)

### 1.1 Auth

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/auth/request-otp` | `{phone}` | `{dev_code?}` |
| POST | `/auth/verify-otp` | `{phone, code}` | `{token, teacher}` |
| POST | `/auth/social` | `{provider, id_token}` | `{token, teacher}` |
| GET | `/auth/me` | — | `Teacher` |
| PUT | `/auth/profile` | `{name, avatar_url?}` | `Teacher` |

### 1.2 Classes (CLS)

| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/classes` | Lọc theo teacher_id từ token |
| POST | `/classes` | Tạo mới |
| PUT | `/classes/{id}` | Cập nhật |
| PATCH | `/classes/{id}/archive` | Lưu trữ |

### 1.3 Students (STU)

| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/classes/{id}/students` | |
| POST | `/classes/{id}/students` | |
| PUT | `/students/{id}` | |
| PUT | `/students/{id}/fee` | `{override, note}` |

### 1.4 Attendance (ATT)

| Method | Endpoint | Notes |
|--------|----------|-------|
| POST | `/classes/{id}/attendance` | Upsert by session_date |
| GET | `/classes/{id}/attendance` | List sessions |
| GET | `/classes/{id}/attendance/{sessionId}` | Chi tiết buổi |

### 1.5 Tuition (TUI)

| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/classes/{id}/tuition/{month}` | YYYY-MM |
| POST | `/classes/{id}/tuition/payment` | `{student_id, paid, amount?}` |

### 1.6 Announcements (ANN)

| Method | Endpoint | Notes |
|--------|----------|-------|
| POST | `/classes/{id}/announcements` | |
| POST | `/announcements/{id}/makeup` | Propose slots |
| POST | `/announcements/{id}/makeup/confirm` | `{slot_index}` |

### 1.7 Reports (RPT)

| Method | Endpoint | Notes |
|--------|----------|-------|
| POST | `/classes/{id}/reports` | `{week_start}` |
| GET | `/classes/{id}/reports` | History |

---

## 2. Database Schema (PostgreSQL)

```sql
-- Teachers
CREATE TABLE teachers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       VARCHAR(15) UNIQUE,
  name        TEXT,
  gender      VARCHAR(10) DEFAULT 'co',
  email       TEXT,
  bank_name   TEXT,
  bank_number TEXT,
  bank_holder TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Classes
CREATE TABLE classes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id   UUID REFERENCES teachers(id),
  name         TEXT NOT NULL,
  subject      TEXT,
  grade        TEXT,
  default_fee  INTEGER NOT NULL DEFAULT 0,
  fee_type     VARCHAR(20) DEFAULT 'month',
  schedule     JSONB,
  color        TEXT,
  status       VARCHAR(20) DEFAULT 'active',
  zalo_group_id TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Students
CREATE TABLE students (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id     UUID REFERENCES classes(id),
  name         TEXT NOT NULL,
  parent_name  TEXT,
  parent_phone TEXT,
  note         TEXT,
  fee_override INTEGER,        -- NULL = dùng default class fee
  fee_note     TEXT,
  status       VARCHAR(20) DEFAULT 'enrolled',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance sessions
CREATE TABLE attendance_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id     UUID REFERENCES classes(id),
  session_date DATE NOT NULL,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, session_date)
);

-- Attendance records (per student per session)
CREATE TABLE attendance_records (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     UUID REFERENCES attendance_sessions(id),
  student_id     UUID REFERENCES students(id),
  present        BOOLEAN DEFAULT TRUE,
  absence_reason TEXT
);

-- Tuition
CREATE TABLE tuition (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id       UUID REFERENCES classes(id),
  student_id     UUID REFERENCES students(id),
  month          CHAR(7) NOT NULL,   -- YYYY-MM
  amount         INTEGER NOT NULL,
  paid           BOOLEAN DEFAULT FALSE,
  paid_at        TIMESTAMPTZ,
  UNIQUE(student_id, month)
);

-- Announcements
CREATE TABLE announcements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id       UUID REFERENCES classes(id),
  type           VARCHAR(20),        -- cancel | makeup | general
  session_date   DATE,
  content        TEXT,
  reason         TEXT,
  propose_makeup BOOLEAN DEFAULT FALSE,
  status         VARCHAR(20) DEFAULT 'draft',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Makeup proposals
CREATE TABLE makeup_slots (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id  UUID REFERENCES announcements(id),
  slots            JSONB,             -- [{date, time, label, votes}]
  confirmed_slot   INTEGER,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Reports
CREATE TABLE reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id        UUID REFERENCES classes(id),
  week_start      DATE,
  content         JSONB,
  recipient_count INTEGER,
  sent_at         TIMESTAMPTZ,
  UNIQUE(class_id, week_start)
);
```

**Index quan trọng:**
```sql
CREATE INDEX idx_classes_teacher ON classes(teacher_id);
CREATE INDEX idx_students_class ON students(class_id);
CREATE INDEX idx_attendance_class_date ON attendance_sessions(class_id, session_date);
CREATE INDEX idx_tuition_class_month ON tuition(class_id, month);
```

---

## 3. Authentication — OAuth thật

### 3.1 Google Sign-In

**Package:** `@react-native-google-signin/google-signin`

```bash
npx expo install @react-native-google-signin/google-signin
```

**Config (`app.json`):**
```json
{
  "expo": {
    "plugins": [
      ["@react-native-google-signin/google-signin", {
        "iosUrlScheme": "com.googleusercontent.apps.XXXXX"
      }]
    ]
  }
}
```

**Flow:**
```
WelcomeScreen → GoogleSignin.signIn()
→ idToken → POST /auth/social {provider: 'google', id_token}
→ API verify với Google API → trả token DayThem
```

### 3.2 Facebook Login

**Package:** `react-native-fbsdk-next`

```bash
npx expo install react-native-fbsdk-next
```

**Flow tương tự Google, provider = 'facebook'.**

### 3.3 OTP SMS

**Nhà cung cấp khuyến nghị cho Việt Nam:** SpeedSMS, ESMS, hoặc Twilio Verify  
**Rate limit:** 3 OTP / SĐT / giờ · OTP hết hạn sau 5 phút

---

## 4. Infrastructure

### 4.1 Recommended Stack (cost-effective cho MVP)

| Layer | Lựa chọn | Chi phí ước tính |
|-------|----------|-----------------|
| Backend | **Supabase** (Postgres + Auth + REST auto-gen) | Free tier → $25/mo |
| API server | **Supabase Edge Functions** (Deno) hoặc Node.js trên Railway | Free → $5/mo |
| File storage | Supabase Storage (avatars) | Trong free tier |
| Push notifications | **Expo Push Notifications** + FCM/APNs | Free |
| SMS OTP | ESMS Việt Nam | ~300đ/tin |
| CDN | Không cần (Supabase xử lý) | — |

### 4.2 Môi trường

| Env | URL | Mục đích |
|-----|-----|---------|
| `development` | `http://localhost:8000` | Dev local |
| `staging` | `https://staging.daythem.vn/api` | Test trước khi release |
| `production` | `https://api.daythem.vn/api` | Live |

**Config trong app (`src/api/client.ts`):**
```typescript
const BASE_URL = __DEV__
  ? 'http://localhost:8000/api/v1'
  : 'https://api.daythem.vn/api/v1';
```

---

## 5. Mobile Build — Expo EAS

### 5.1 Cài đặt

```bash
npm install -g eas-cli
eas login
eas build:configure
```

### 5.2 `app.json` cần thiết

```json
{
  "expo": {
    "name": "DayThem",
    "slug": "daythem",
    "version": "1.0.0",
    "android": {
      "package": "vn.daythem.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#4a9e72"
      }
    },
    "ios": {
      "bundleIdentifier": "vn.daythem.app",
      "buildNumber": "1"
    }
  }
}
```

### 5.3 Build commands

```bash
# Android APK (internal testing)
eas build --platform android --profile preview

# Android AAB (Play Store)
eas build --platform android --profile production

# iOS (App Store)
eas build --platform ios --profile production

# OTA update (không cần resubmit store)
eas update --branch production --message "Hotfix v1.0.1"
```

### 5.4 `eas.json`

```json
{
  "build": {
    "preview": {
      "android": { "buildType": "apk" },
      "env": { "API_URL": "https://staging.daythem.vn/api/v1" }
    },
    "production": {
      "env": { "API_URL": "https://api.daythem.vn/api/v1" }
    }
  }
}
```

---

## 6. Push Notifications

### 6.1 Setup

```bash
npx expo install expo-notifications expo-device
```

### 7.2 Trigger points

| Event | Notification |
|-------|-------------|
| Buổi học sắp tới (30 phút) | "Lớp 9 bắt đầu lúc 18:30" |
| Cuối tuần thứ 6 | "Nhớ gửi báo cáo tuần cho phụ huynh" |
| Học sinh vắng 2 buổi liên tiếp | "Bảo Long vắng 2 buổi — nhắn phụ huynh?" |
| Đầu tháng | "Tháng mới — nhớ gửi nhắc học phí" |

### 6.3 Không cần làm

- **Không** gửi thông báo cho phụ huynh từ app — dùng Zalo copy-paste
- **Không** cần Zalo OA API — giữ model copy-paste

---

## 7. Checklist lên Production

### Phase 1 — Backend & Auth (2–3 tuần)

- [ ] Khởi tạo Supabase project
- [ ] Chạy migration SQL (schema ở mục 2)
- [ ] Implement REST API (Node.js hoặc Supabase Edge Functions)
- [ ] Tích hợp Google Sign-In thật
- [ ] Tích hợp Facebook Login thật
- [ ] OTP SMS qua ESMS/SpeedSMS
- [ ] Deploy lên staging
- [ ] Test toàn bộ API flow với app

### Phase 2 — App build & Test (1–2 tuần)

- [ ] Thay `BASE_URL` sang staging URL
- [ ] Test trên Android device thật (Samsung/Xiaomi Việt Nam)
- [ ] Test trên iOS device (iPhone)
- [ ] Xử lý edge case: offline, mạng chậm, lỗi API
- [ ] Add error boundaries và user-facing error messages
- [ ] Test flow Điểm danh → Học phí → Báo nghỉ → Báo cáo end-to-end
- [ ] Kiểm tra performance (FlatList cho 30+ học sinh)
- [ ] Accessibility (font size, contrast)

### Phase 3 — Store submission (1 tuần)

- [ ] Thiết kế app icon (1024×1024 + adaptive icon Android)
- [ ] Screenshots mỗi kích thước (6.5" iPhone, 12.9" iPad, Pixel)
- [ ] Mô tả app (Tiếng Việt)
- [ ] Privacy Policy URL (bắt buộc cho Google/Facebook OAuth)
- [ ] Submit Google Play (review ~3 ngày)
- [ ] Submit Apple App Store (review ~7 ngày)
- [ ] EAS Build production

### Phase 4 — Soft launch (tuần 1 sau launch)

- [ ] Invite 5–10 giáo viên beta test
- [ ] Monitor crash (Sentry hoặc Expo's built-in)
- [ ] Theo dõi: số lần điểm danh, học phí ghi nhận, báo cáo gửi
- [ ] Thu thập feedback → fix trong 48h

---

## 8. Các tính năng KHÔNG làm trong MVP

Để giữ scope tập trung, **loại khỏi v1.0:**

| Tính năng | Lý do |
|-----------|-------|
| Tích hợp Zalo API thật | Yêu cầu Zalo OA approved (2–4 tuần xét duyệt) + chi phí |
| Phụ huynh có tài khoản riêng | Làm phức tạp auth + UX, không phải pain point chính |
| Thanh toán online (VNPay/MoMo) | Cần pháp lý (giấy phép TPSP), scope lớn |
| Import học sinh từ Excel | Phức tạp UX, MVP dùng thêm thủ công là đủ |
| Multi-teacher (lớp chia sẻ) | Edge case, 95% giáo viên dạy một mình |
| Báo cáo PDF | Nice-to-have, v1.1 |
| Dark mode | Nice-to-have, v1.1 |

---

## 9. Monitoring & Analytics

### 9.1 Crash tracking

```bash
npx expo install @sentry/react-native
```

```typescript
// App.tsx
import * as Sentry from '@sentry/react-native';
Sentry.init({ dsn: 'https://...@sentry.io/...', environment: __DEV__ ? 'dev' : 'prod' });
```

### 9.2 Metrics quan trọng (North Star)

| Metric | Target tuần 1 | Cách đo |
|--------|--------------|---------|
| DAU (giáo viên active/ngày) | ≥ 3 | Server logs |
| Tỉ lệ điểm danh đúng giờ | ≥ 80% buổi | ATT records |
| Tuition ghi nhận / tháng | ≥ 1 lần/lớp | TUI records |
| Crash-free sessions | ≥ 99% | Sentry |

### 9.3 Không dùng

- Google Analytics / Firebase Analytics — GDPR overhead, không cần cho MVP
- Dùng server logs + Supabase dashboard là đủ giai đoạn đầu

---

## 10. Versioning & Release strategy

| Version | Nội dung | Kênh |
|---------|---------|------|
| `1.0.0` | MVP: Điểm danh + Học phí + Báo nghỉ + Báo cáo | Google Play internal test |
| `1.0.1` | Bug fixes từ beta | OTA (eas update) |
| `1.1.0` | Báo cáo PDF, Dark mode, Import Excel | Store update |
| `2.0.0` | Zalo OA integration (nếu approved) | Store update |

**Quy tắc:**
- Patch (`x.x.1`): OTA update — không cần submit store lại
- Minor (`x.1.x`): EAS Build mới + store update
- Major (`2.x.x`): Milestone tính năng lớn

---

## 11. Liên hệ & Tài nguyên

| Tài nguyên | Link |
|-----------|------|
| Supabase docs | https://supabase.com/docs |
| Expo EAS Build | https://docs.expo.dev/build/introduction |
| Google Sign-In RN | https://github.com/react-native-google-signin/google-signin |
| ESMS SMS API | https://esms.vn/api |
| Google Play Console | https://play.google.com/console |
| App Store Connect | https://appstoreconnect.apple.com |
| Sentry RN | https://docs.sentry.io/platforms/react-native |
