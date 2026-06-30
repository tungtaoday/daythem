# DayThem — Production Playbook: Lên iPhone

> Phiên bản: v2.0 · Cập nhật: 2026-05-24  
> Mục tiêu: đưa app lên iPhone thật, dữ liệu đồng bộ về database của bạn

---

## Trạng thái hiện tại

| Hạng mục | Hiện tại | Cần làm để lên iPhone |
|----------|----------|----------------------|
| Mobile app | Expo SDK 54, chạy web browser | EAS Build → IPA → TestFlight |
| Backend API | FastAPI + SQLite, **30/30 tests pass**, chạy `localhost:8000` | Deploy lên cloud server |
| Database | SQLite file `daythem.db` trên máy bạn | Migrate sang PostgreSQL trên cloud |
| Auth | Password-based (PBKDF2), hoạt động | Giữ nguyên, chỉ đổi URL |
| Dữ liệu | Local, không sync | **Có** — khi backend lên cloud, mọi thao tác trên app đều lưu vào DB của bạn |

**Tin tốt:** Backend đã xây xong hoàn chỉnh. Không cần viết thêm API. Chỉ cần deploy + đổi URL.

---

## Dữ liệu có được đồng bộ không?

**Có.** Cơ chế:

```
iPhone của bạn
    │
    │  HTTPS request
    ▼
API Server (cloud) ← bạn deploy backend FastAPI lên đây
    │
    │  SQLAlchemy ORM
    ▼
PostgreSQL Database ← dữ liệu thật của bạn lưu ở đây
```

Mỗi khi giáo viên điểm danh, ghi học phí, thêm học sinh... → app gửi request lên API → API lưu vào database. Dữ liệu tồn tại vĩnh viễn trên server, không mất khi xóa app hay đổi điện thoại.

---

## Bước 1 — Deploy Backend lên Cloud

### 1.1 Chọn nơi host

Khuyến nghị cho MVP Việt Nam:

| Option | Chi phí | Dễ | Ghi chú |
|--------|---------|-----|---------|
| **Railway** | $5/tháng | ★★★★★ | Deploy từ GitHub, auto SSL, 1 click |
| **Render** | Free (cold start) / $7 | ★★★★☆ | Free tier ngủ sau 15 phút không dùng |
| **VPS Vultr/DigitalOcean** | $6/tháng | ★★★☆☆ | Cần tự cài nginx, ssl |
| **Supabase** | Free → $25 | ★★★★☆ | Chỉ cho DB, vẫn cần deploy FastAPI riêng |

**Khuyến nghị: Railway** — kết nối GitHub repo → auto-deploy mỗi khi push.

### 1.2 Chuẩn bị backend để deploy

**a. Thêm `Procfile`** (Railway/Render đọc file này):
```
web: uvicorn daythem.entrypoints.app:app --host 0.0.0.0 --port $PORT
```

**b. Thêm `requirements.txt`** (nếu chưa có — Railway cần file này):
```bash
cd backend
pip freeze > requirements.txt
```

Hoặc dùng `pyproject.toml` đã có — Railway hỗ trợ cả hai.

**c. Đổi database từ SQLite sang PostgreSQL:**

Trong `backend/src/daythem/adapters/database.py`, thay:
```python
# Hiện tại (SQLite local):
DATABASE_URL = "sqlite:///./daythem.db"

# Production (PostgreSQL):
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./daythem.db")
```

Thêm `psycopg2-binary` vào dependencies:
```bash
pip install psycopg2-binary
```

**d. Biến môi trường cần set trên Railway:**

| Biến | Giá trị |
|------|---------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/daythem` (Railway tự tạo) |
| `SECRET_KEY` | Chuỗi random 32+ ký tự (dùng `python -c "import secrets; print(secrets.token_hex(32))"`) |
| `JWT_EXPIRE_DAYS` | `30` |

### 1.3 Deploy lên Railway (step-by-step)

```
1. Vào railway.app → New Project → Deploy from GitHub repo
2. Chọn repo tungtaoday/daythem → chọn thư mục /backend (monorepo)
3. Railway tự detect Python → cài deps → start app
4. Vào tab "Variables" → thêm SECRET_KEY
5. Vào tab "Database" → Add PostgreSQL → Railway tự set DATABASE_URL
6. Vào tab "Settings" → Generate Domain → được URL dạng:
   https://daythem-backend-xxxx.railway.app
```

### 1.4 Kiểm tra backend đã chạy

```bash
curl https://daythem-backend-xxxx.railway.app/docs
# → Swagger UI hiện ra là OK
```

---

## Bước 2 — Đổi URL trong App

Hiện tại trong `mobile/src/api/client.ts`:
```typescript
const BASE_URL = 'http://localhost:8000/api/v1';
```

Đổi sang:
```typescript
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';
```

Tạo file `mobile/.env.production`:
```
EXPO_PUBLIC_API_URL=https://daythem-backend-xxxx.railway.app/api/v1
```

Khi build EAS, biến này được nhúng vào app tự động.

---

## Bước 3 — Build iPhone (EAS)

### 3.1 Yêu cầu bắt buộc

- **Apple Developer Account** — $99/năm tại [developer.apple.com](https://developer.apple.com)
- **Mac** hoặc dùng EAS cloud build (không cần Mac)
- Expo account miễn phí tại [expo.dev](https://expo.dev)

### 3.2 Cài EAS CLI

```bash
npm install -g eas-cli
eas login   # đăng nhập tài khoản Expo
```

### 3.3 Cập nhật `mobile/app.json`

```json
{
  "expo": {
    "name": "DayThem",
    "slug": "daythem",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "ios": {
      "bundleIdentifier": "vn.daythem.app",
      "buildNumber": "1",
      "supportsTablet": false
    },
    "plugins": [
      "expo-secure-store",
      "expo-file-system"
    ]
  }
}
```

### 3.4 Tạo `mobile/eas.json`

```json
{
  "cli": { "version": ">= 7.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "preview": {
      "distribution": "internal",
      "env": { "EXPO_PUBLIC_API_URL": "https://daythem-backend-xxxx.railway.app/api/v1" }
    },
    "production": {
      "env": { "EXPO_PUBLIC_API_URL": "https://daythem-backend-xxxx.railway.app/api/v1" }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "email@apple.com",
        "ascAppId": "123456789"
      }
    }
  }
}
```

### 3.5 Build và cài lên iPhone

**Cách nhanh nhất — TestFlight:**
```bash
cd mobile

# Build IPA trên cloud EAS (không cần Mac)
eas build --platform ios --profile preview

# Sau ~15 phút → EAS gửi link download IPA
# Upload IPA lên TestFlight qua App Store Connect
# → Invite bản thân làm tester → cài app trên iPhone
```

**Cách cài trực tiếp (không qua TestFlight):**
```bash
# Build IPA dạng "ad-hoc" cho đúng device UDID của bạn
eas build --platform ios --profile preview
# Cần đăng ký UDID của iPhone trong Apple Developer portal trước
```

**Cách nhanh nhất để test (simulator):**
```bash
# Không cần Apple Developer account
eas build --platform ios --profile development
# Chạy trên iOS Simulator (cần Mac)
```

---

## Bước 4 — Checklist trước khi lên iPhone thật

### Backend
- [ ] Deploy backend lên Railway/Render
- [ ] `SECRET_KEY` đã set (khác với dev)
- [ ] `DATABASE_URL` trỏ vào PostgreSQL thật
- [ ] CORS đã mở cho domain app (hiện tại `allow_origins=["*"]` là OK cho MVP)
- [ ] Test API từ Postman/curl với URL cloud

### Database
- [ ] PostgreSQL đã tạo trên Railway (tự động) hoặc Supabase
- [ ] Backend đã chạy migration (`Base.metadata.create_all(engine)` trong `app.py` sẽ tự tạo tables)
- [ ] Nếu có dữ liệu mẫu từ SQLite muốn giữ → export và import vào PostgreSQL

### App
- [ ] `EXPO_PUBLIC_API_URL` trỏ đúng URL backend
- [ ] `app.json` đã có `bundleIdentifier`
- [ ] Assets icon đầy đủ (1024×1024 PNG)
- [ ] `npx tsc --noEmit` clean

### Apple
- [ ] Có Apple Developer account ($99/năm)
- [ ] Tạo App ID trên [developer.apple.com](https://developer.apple.com) với bundle ID `vn.daythem.app`
- [ ] `eas build:configure` đã chạy → sinh ra provisioning profile tự động

---

## Bước 5 — Sau khi lên iPhone

### Theo dõi lỗi

```bash
npx expo install @sentry/react-native
```

```typescript
// mobile/App.tsx
import * as Sentry from '@sentry/react-native';
Sentry.init({ dsn: 'https://...@sentry.io/...', environment: 'production' });
```

### OTA Update (không cần submit App Store lại)

Khi fix bug nhỏ hoặc UI:
```bash
eas update --branch production --message "fix: học phí hiển thị đúng"
```
App tự tải bản mới lần mở tiếp theo. Không cần resubmit App Store.

### Khi nào cần build + submit App Store lại
- Thêm native plugin mới (expo-camera, etc.)
- Đổi `bundleIdentifier` hoặc version
- Thay đổi permissions (Info.plist)

---

## Roadmap tính năng sau MVP

| Phiên bản | Tính năng | Ghi chú |
|-----------|-----------|---------|
| `1.0` | Điểm danh + Học phí + Báo nghỉ + Báo cáo + Xuất Excel | **Hiện tại** |
| `1.1` | Push notification nhắc điểm danh + học phí | `expo-notifications` + APNs |
| `1.2` | Google Sign-In thật | `@react-native-google-signin/google-signin` |
| `1.3` | Báo cáo PDF | `react-native-html-to-pdf` hoặc server-side render |
| `2.0` | Zalo OA integration | Cần OA approved (~4 tuần xét duyệt) |

---

## Không làm trong MVP

| Tính năng | Lý do |
|-----------|-------|
| Tài khoản phụ huynh | Scope lớn, không phải pain point chính |
| Thanh toán online | Cần giấy phép TPSP |
| Multi-teacher | 95% giáo viên dạy một mình |
| SMS OTP thật | Password auth đã đủ — OTP thêm chi phí |
| Dark mode | Nice-to-have v1.1 |

---

## Tóm tắt thứ tự ưu tiên

```
Tuần 1: Deploy backend Railway + set DATABASE_URL PostgreSQL
Tuần 1: Test API từ điện thoại (dùng Postman hoặc web app)
Tuần 2: Đổi EXPO_PUBLIC_API_URL trong app + eas build iOS preview
Tuần 2: Cài lên iPhone qua TestFlight, test end-to-end
Tuần 3: Fix bug từ test thật + eas update
Sau đó: Submit App Store nếu muốn publish rộng
```


  