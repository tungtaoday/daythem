# Teacher Aggregate (TCH)

**Aggregate root:** `TeacherORM`  
**Table:** `teachers`  
**Abbreviation:** `TCH`

---

## Entity Diagram

```mermaid
erDiagram
    TEACHER {
        str id PK
        str phone UK
        str name
        str avatar_url
        str password_hash
        str push_token
        bool notif_attendance
        bool notif_tuition
        bool notif_report
        str dnd_start
        str dnd_end
        datetime created_at
    }
    TEACHER ||--o{ CLASS : owns
```

---

## Attributes

| Field | Type | Nullable | Default | Mô tả |
|-------|------|----------|---------|-------|
| `id` | UUID str | No | — | Primary key |
| `phone` | str(20) | No | — | Unique, dùng để login |
| `name` | str(100) | Yes | null | null = chưa setup → redirect SetupScreen |
| `avatar_url` | Text | Yes | null | URL ảnh đại diện |
| `password_hash` | str(200) | Yes | null | PBKDF2; null = tài khoản OTP cũ chưa set password |
| `push_token` | str(200) | Yes | null | Expo Push Token dạng `ExponentPushToken[xxx]` |
| `notif_attendance` | bool | No | True | Nhắc điểm danh 30p trước buổi học |
| `notif_tuition` | bool | No | True | Nhắc học phí ngày 1 hàng tháng |
| `notif_report` | bool | No | True | Nhắc báo cáo tuần thứ 6 17h |
| `dnd_start` | str(5) | Yes | "22:00" | Giờ bắt đầu Không làm phiền (HH:MM) |
| `dnd_end` | str(5) | Yes | "07:00" | Giờ kết thúc Không làm phiền (HH:MM) |
| `created_at` | datetime | No | now() | UTC, no timezone |

---

## Commands

| Command | Handler | Params | Event |
|---------|---------|--------|-------|
| `LoginWithPasswordCommand` | `handle_login_with_password` | phone, password | — |
| `UpdateProfileCommand` | `handle_update_profile` | teacher_id, name, avatar_url, push_token?, notif_attendance?, notif_tuition?, notif_report?, dnd_start?, dnd_end? | — |

---

## Business Rules

| ID | Rule |
|----|------|
| BR-TCH-01 | `push_token` chỉ được set khi device grant notification permission |
| BR-TCH-02 | `dnd_start` / `dnd_end` format HH:MM, validate bằng regex `^\d{2}:\d{2}$` |
| BR-TCH-03 | Cron job KHÔNG gửi notification nếu `push_token` null |
| BR-TCH-04 | Cron job KHÔNG gửi trong khung `dnd_start` → `dnd_end` (tính theo giờ server UTC+7) |
| BR-TCH-05 | Nếu toggle `notif_attendance = False`, cron skip giáo viên đó |

---

## API Endpoints

```
POST /auth/login          { phone, password }      → { token, teacher }
GET  /auth/me                                       → Teacher
PUT  /auth/profile        UpdateProfileBody         → Teacher
```

### UpdateProfileBody (mở rộng)

```python
class UpdateProfileBody(BaseModel):
    name: str | None = None
    avatar_url: str | None = None
    push_token: str | None = None
    notif_attendance: bool | None = None
    notif_tuition: bool | None = None
    notif_report: bool | None = None
    dnd_start: str | None = None   # "22:00"
    dnd_end: str | None = None     # "07:00"
```

---

## Notification Cron Schedule

| Trigger | Thời điểm | Condition |
|---------|-----------|-----------|
| Nhắc điểm danh | 30p trước `class.schedule.start_time` mỗi ngày | `notif_attendance=True` + `push_token` not null + ngoài DND |
| Nhắc học phí | Ngày 1 hàng tháng 08:00 | `notif_tuition=True` + `push_token` not null |
| Nhắc báo cáo | Thứ 6 hàng tuần 17:00 | `notif_report=True` + `push_token` not null |

---

## teacher_out() response (mở rộng)

```python
{
  "id": "uuid",
  "phone": "0901234567",
  "name": "Nguyễn Văn A",
  "avatar_url": null,
  "push_token": "ExponentPushToken[xxx]",
  "notif_attendance": true,
  "notif_tuition": true,
  "notif_report": true,
  "dnd_start": "22:00",
  "dnd_end": "07:00",
  "created_at": "2026-05-01T08:00:00"
}
```
