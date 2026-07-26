# Book 01 — PRODUCT & DEPLOY RUNBOOK

> Mọi thao tác kỹ thuật để giữ app sống + ra bản mới. Trước đây rải trong memory —
> giờ gom 1 chỗ. Cập nhật: 2026-07-26.
> ⚠️ Phần lớn việc ở đây nên do founder hoặc Claude làm, KHÔNG giao CTV.

---

## 0. Hạ tầng (1 bảng)

| Thành phần | Địa chỉ | Ghi chú |
|---|---|---|
| Backend API | https://daythem.doitay.vn/api/v1 | FastAPI + gunicorn:8001, systemd `daythem` |
| Landing + admin | gieochu.vn , gieochu.vn/admin | mật khẩu admin: Vuivui@123 |
| VPS | `ssh root@165.22.252.188` | Ubuntu, Apache proxy, MySQL `daythem_production` |
| App code | `C:\DayThem\mobile` (Expo) · `C:\DayThem\backend` (FastAPI) | git `github.com/tungtaoday/daythem` |
| EAS builds | expo.dev/accounts/tungtaoday | free quota reset mùng 1 hàng tháng |

**Cảnh báo VPS:** đĩa chỉ 9.6G. **Luôn `df -h /` trước khi deploy.** Đầy đĩa →
scp/`cat >` lỗi IM LẶNG (file cụt) → app 503. Dọn: `apt-get clean`,
`journalctl --vacuum-size=50M`, xoá log `.gz`/`.1` trong /var/log.

---

## 1. Chạy & test ở máy local

```bash
# Backend
cd backend && python -m venv venv && venv/Scripts/activate
pip install -e . && alembic upgrade head
uvicorn daythem.entrypoints.app:app --reload      # localhost:8000
python -m pytest tests/e2e/ -v                     # PHẢI xanh trước khi deploy

# Mobile (web để test nhanh)
cd mobile && npm install
npx expo start --web                               # localhost:8081
npx tsc --noEmit                                   # PHẢI sạch trước khi commit
```

**Test trên iPhone/Android thật (không cần build):**
```bash
cd mobile
# lần đầu: npm install -g @expo/ngrok
EXPO_PUBLIC_API_URL=https://daythem.doitay.vn/api/v1 npx expo start --tunnel
```
→ cài **Expo Go** trên máy → quét QR (Android) / iPhone quét bằng Camera hoặc dán
`exp://...exp.direct` trong Expo Go. Lấy link tunnel: `curl -s http://127.0.0.1:4040/api/tunnels`.

---

## 2. Deploy backend (sau khi sửa code Python)

```bash
ssh root@165.22.252.188 "df -h /"                  # 1. kiểm đĩa TRƯỚC
cd backend
# 2. copy file đã sửa (ví dụ)
scp src/daythem/service/handlers.py root@165.22.252.188:/opt/daythem/src/daythem/service/
# 3. nếu có migration mới:
scp migrations/versions/<file>.py root@165.22.252.188:/opt/daythem/migrations/versions/
ssh root@165.22.252.188 "chown -R www-data:www-data /opt/daythem/src /opt/daythem/migrations && \
  cd /opt/daythem && ./venv/bin/alembic upgrade head && \
  systemctl restart daythem && sleep 3 && systemctl is-active daythem"   # phải in 'active'
# 4. verify
curl -s -o /dev/null -w '%{http_code}\n' https://daythem.doitay.vn/health
```

Cả bó thay đổi lớn: tar `backend/{src,migrations,alembic.ini,pyproject.toml}` → scp →
giải nén vào /opt/daythem → `./venv/bin/pip install -e .` → alembic → restart.

---

## 3. Build APK / iOS (ngày 01/08 khi quota reset)

```bash
cd mobile
npx eas-cli build -p android --profile production   # AAB cho CH Play
npx eas-cli build -p ios --profile production        # iOS (EAS lo certificate)
npx eas-cli build -p android --profile preview       # APK cài trực tiếp (link landing)
# nộp:
npx eas-cli submit -p ios                            # lên App Store Connect
```
`eas.json` đã đúng: preview+production trỏ `https://daythem.doitay.vn/api/v1`.
Chi tiết store: `docs/store-launch-checklist.md`.

**Bẫy monorepo (đã fix, đừng phá):** root `.gitignore` có `!mobile/assets/**` +
`C:\DayThem\.easignore` (không được ignore png, có loại backend/). Nếu build lỗi
`ENOENT adaptive-icon.png` → kiểm 2 file này.

---

## 4. Vận hành cỗ máy marketing (marketing/)

```bash
cd marketing
cp .env.example .env        # điền API key (Gemini/Imagen), page_id, group thật
python run.py               # FastAPI backend :8002 (scheduler TẮT mặc định)
cd frontend && npm run dev  # dashboard :3000 — duyệt bài, sinh ảnh, chấm eval
```
**MANUAL-ONLY:** agent sinh bài → eval harness gác cổng (chặn duyệt nếu FAIL) →
người đăng tay. KHÔNG bật auto-post. Nội dung thuế BẮT BUỘC người duyệt.
Chi tiết: `marketing/README-GieoChu.md`, memory `marketing-system`.

---

## 5. Sự cố thường gặp → cách xử

| Triệu chứng | Nguyên nhân hay gặp | Xử |
|---|---|---|
| API trả 503 | đĩa VPS đầy → app crash-loop | ssh vào, dọn đĩa (mục 0), `systemctl restart daythem` |
| Deploy "xong" mà không đổi | đĩa đầy → scp ghi file cụt im lặng | `df -h /` trước; deploy lại sau khi dọn |
| `expo start` không đổi bundle | Metro cũ còn chạy ở 8081 | `Get-NetTCPConnection -LocalPort 8081` → Stop-Process |
| tsc lỗi sau sửa RN | import trùng / kiểu sai | đọc lỗi, sửa; KHÔNG commit khi còn lỗi TS |
| APK báo `localhost:8081` | cài nhầm bản dev (không nhúng JS) | dùng profile **preview/production**, không phải development |
| Prints tiếng Việt lỗi cp1252 | Windows encoding | `PYTHONIOENCODING=utf-8` trước lệnh |

---

## 6. Trạng thái test hiện tại (giữ xanh)

- Backend: **135/135 e2e pass** (`pytest tests/e2e/ -v`).
- Mobile: `tsc --noEmit` sạch.
- Quy tắc: KHÔNG deploy/commit khi test đỏ hoặc tsc lỗi. Sửa gốc, không skip.
