# GieoChữ — Kế hoạch Marketing System

> Tài liệu tư vấn/lên kế hoạch. Tham khảo hệ thống `C:\doitay_all_in_one\Strategy\agent-system`
> (cỗ máy marketing khép kín ~14k dòng Python + Next.js đã chạy thật cho Doitay.vn).
> Nguồn GTM: memory `marketing-gtm`. Trạng thái: **kế hoạch — chưa implement**.
> Quyết định đã chốt: (1) chỉ lên kế hoạch trước; (2) **KHÔNG auto-post Facebook Groups** — agent sinh bài + seed comment, gửi Telegram để người tự đăng tay.

---

## 1. Mục tiêu & nguyên tắc

**Mục tiêu:** một hệ thống hỗ trợ marketing GieoChữ tạo ra nội dung đúng tệp (giáo viên dạy thêm), đúng đòn bẩy (Thông tư 29 + thuế HKD), đăng đúng kênh (FB Groups GV + Zalo + referral), và **học dần** từ hiệu quả.

**Nguyên tắc thiết kế:**
1. **Config-driven** — mọi thứ về GieoChữ nằm trong `project.yaml` + JSON, không hardcode.
2. **Human-in-the-loop** — agent đề xuất, người duyệt từng bài. Hợp tệp giáo dục "sợ sai".
3. **An toàn tài khoản trên hết** — không auto-post group. Group GV soi spam gắt.
4. **Cho trước, nhận sau** — nội dung giá trị (mẫu báo cáo, hướng dẫn thuế/HKD) trước, nhắc app cuối bài.
5. **Bám sóng quy định** — pháp lý dạy thêm + thuế là nam châm hút đúng tệp, miễn phí, đúng thời điểm.

---

## 2. Đánh giá hệ thống Doitay (dùng làm nền)

**Tái dùng được gần như nguyên (không đụng code):**
- 9 agents (research/content/strategy/analytics/devils_advocate/distribution/...)
- ~60 skills (R/C/S/A/G/D)
- Agent runner, DB (6 bảng), feedback loop (pattern → inject ngược), frontend 4-5 tab.

**Phải đổi (chủ yếu là config):**
- `project.yaml`, `posting_targets.json`, `social_listening_sources.json`
- Vài chỗ hardcode: `page_id`, query template mang tính "thợ", `terminology_mapping`.

**Rủi ro đã biết:**
- Auto-post group → khóa tài khoản (đã quyết: tắt).
- Phụ thuộc API tốn phí: Anthropic + SerpAPI + Gemini Imagen + FB Graph.
- Layer 7 (behavioral hypothesis) mới là kế hoạch trong Doitay, chưa implement.

**Kết luận:** Kiến trúc config-driven khiến việc adapt sang GieoChữ ~85% là viết config, ~15% chỉnh code. Đáng fork thay vì xây lại.

---

## 3. Kiến trúc đề xuất cho GieoChữ

Giữ nguyên khung Doitay, đổi 3 thứ: **context (project.yaml)**, **routing (posting_targets)**, **distribution mode (tắt auto group)**.

```
project.yaml (GieoChữ)  ──► inject vào MỌI agent
        │
        ▼
SCAN ──────── research agent: quét group GV, thuế/pháp lý, đối thủ (thủ công/app khác)
        │        → pain_phrases, signals → DB
        ▼
HYPOTHESIS ── strategy S7 + analytics A2 + devils_advocate A1
        │        → "GV sắp bị kiểm tra HKD sẽ inbox nếu thấy hướng dẫn thuế 1 chạm"
        ▼
CONTENT ────── content agent: bài theo 4 pillar, hook/body/cta/ảnh
        │        → ScheduledPost (draft) → DB
        ▼
REVIEW ─────── NGƯỜI duyệt từng bài (approve/edit/reject)
        │
        ▼
DISTRIBUTE ── ⚠️ KHÔNG auto group.
        │        • Fanpage GieoChữ: có thể auto (an toàn) — TÙY, mặc định vẫn tay
        │        • Groups + Zalo: agent sinh bài + seed comment → Telegram → NGƯỜI đăng tay
        ▼
MEASURE ────── sync FB metrics (bài Page); group nhập tay số liệu cơ bản
        ▼
LEARN ──────── extract patterns → inject ngược vào agent call sau
```

---

## 4. Bộ config GieoChữ cần viết (nội dung cụ thể)

### 4.1 `project.yaml` — nguồn chân lý

| Field | Giá trị GieoChữ |
|-------|-----------------|
| `name` | GieoChữ |
| `tagline` | "Quản lý lớp dạy thêm nhẹ như nhắn tin" |
| `description` | App quản lý lớp dạy thêm cho GV cá nhân: điểm danh, thu học phí, báo nghỉ/học bù, báo cáo phụ huynh, nhắc Zalo, thuế TNCN, xuất Excel |
| `geography` | Toàn quốc (VN) — không bó vùng như Doitay |
| `primary_audience.who` | Giáo viên dạy thêm cá nhân, thường trung niên, **không rành công nghệ**, sống trong Zalo |
| `primary_audience.pain_points` | Quên ai đã nộp học phí; ngại nhắc phụ huynh; sổ tay/Excel rối; **sợ sai luật TT29**; **lo thuế HKD**; báo cáo phụ huynh mất công |
| `primary_audience.desires` | Thu học phí không sót; báo cáo phụ huynh 1 chạm; dạy thêm hợp pháp nhẹ nhàng; không cần rành tech |
| `competitors` | **Sổ tay + Excel + Zalo thủ công** (đối thủ thật); app quản lý trung tâm nặng nề |
| `competitive_advantage` | Nhẹ + tiếng Việt thuần + tích hợp Zalo + lo thuế HKD; hợp GV cá nhân, không phải trung tâm |

**`content_angles` (4 pillar — thay Cái Uy/Sĩ Diện/Cơ Hội):**
1. **Pháp lý dạy thêm** — Thông tư 29, đăng ký HKD, dạy thêm hợp pháp. *(đòn bẩy mạnh nhất)*
2. **Thuế cho giáo viên** — ngưỡng 1 tỷ/năm 2026, cách kê khai, tờ khai 09/KK-TNCN (đúng tính năng app).
3. **Mẹo vận hành lớp** — thu học phí khéo, nhắc phụ huynh không ngại, báo cáo tuần, điểm danh nhanh.
4. **Demo / Before–After** — "trước: sổ tay rối; sau: 1 chạm". Ảnh/clip màn hình app.

**`tone`:** Ấm áp, thực tế, tôn trọng nghề giáo. Nói như đồng nghiệp cô/thầy, KHÔNG corporate, KHÔNG buzzword. Tiếng Việt thuần, câu ngắn, dễ hiểu cho người ngại tech.

**`avoid`:** giọng bán hàng lộ liễu; hù dọa pháp lý quá đà làm GV hoảng; hứa hẹn "kiếm tiền khủng"; thuật ngữ kỹ thuật.

**`default_cta`:** "Dùng thử miễn phí GieoChữ — [link]". Ưu tiên CTA mềm: "Tải mẫu báo cáo phụ huynh miễn phí", "Nhận checklist đăng ký HKD dạy thêm".

**`channels`:** Facebook (Page + Groups GV), **Zalo OA** (kênh chính chăm sóc GV), TikTok (video pháp lý/mẹo), Blog/SEO (từ khóa ý định cao).

### 4.2 `posting_targets.json` — bỏ mô hình supply/demand

Doitay là marketplace 2 chiều. GieoChữ **1 chiều** → thay `audience_side` bằng **phân khúc GV**:

| segment | Ví dụ group | Pillar phù hợp | Entry point |
|---------|-------------|----------------|-------------|
| `daythem_home` — GV dạy tại nhà/lớp nhỏ | "Hội giáo viên dạy thêm", group theo môn | vận hành lớp, demo | story, ask |
| `chuyen_hkd` — GV đang chuyển sang HKD (đau nhất) | group pháp lý/thuế GV | pháp lý, thuế | ask, complain |
| `gia_su` — gia sư/nhóm 1–2 GV theo môn | group gia sư Toán/Anh/Văn | vận hành, demo | compare, story |

**Kênh đăng (mặc định TẤT CẢ = manual/Telegram):**
- `facebook_page`: Fanpage GieoChữ — proof/narrative/utility. *(có thể bật auto sau, mặc định tay)*
- `facebook_groups[]`: 20–30 hội GV — **chỉ generate + Telegram, đăng tay**. `max_posts_per_week` thấp, `frequency_days` ≥ 2, tôn trọng rule từng group.
- `zalo_oa`: broadcast mẹo + hỗ trợ (kênh giữ chân). Không phải "post" mà là "broadcast content".

**`user_state` map cho tệp GV (thay emergency/active_search/planning của thợ):**
| user_state | Ý nghĩa với GV | Trigger | Content |
|-----------|----------------|---------|---------|
| `emergency` | Sắp bị kiểm tra / hạn thuế / phụ huynh phàn nàn | "Làm ngay trước hạn X" | pháp lý, thuế — demand_capture |
| `active_search` | Đang tìm cách quản lớp gọn hơn | "Có cách 1 chạm" | vận hành, demo — narrative |
| `planning` | Tò mò, chưa gấp | "Tham khảo / checklist" | proof, utility |

### 4.3 `social_listening_sources.json`

Danh sách group GV để scan pain phrases: "Hội giáo viên dạy thêm", "Cộng đồng gia sư [tỉnh]", group môn (GV Toán/Anh/Văn), group luyện thi. + Page giáo dục để monitor.

---

## 5. Checklist adapt (khi bắt tay implement)

- [ ] Fork `agent-system` → thư mục riêng cho GieoChữ (giữ Doitay nguyên vẹn để đối chiếu).
- [ ] Viết `project.yaml` GieoChữ (mục 4.1) — dùng thẳng memory `marketing-gtm`.
- [ ] Viết `posting_targets.json` (mục 4.2) — segment GV, mọi kênh = manual.
- [ ] Viết `social_listening_sources.json` — group GV.
- [ ] Grep & sửa hardcode: `page_id` Doitay, query template chứa "thợ/trade", `terminology_mapping`.
- [ ] **Tắt auto-post group**: trong distribution/playbook, đổi `post_to_groups` → `notify_for_manual_post` (chỉ gửi Telegram bài + seed comment).
- [ ] `.env` GieoChữ: Anthropic key + SerpAPI + (tùy) Gemini Imagen + FB Graph token của Fanpage GieoChữ + Telegram bot.
- [ ] Điều chỉnh model mapping nếu cần (opus/sonnet → model id hiện tại).
- [ ] Dry-run: chạy 1 vòng SCAN → CONTENT (1 tuần bài) → review → xuất Telegram, KHÔNG publish thật.
- [ ] (Tùy chọn) Ẩn/park các skill không dùng ngay (G6 paid, G7 outbound) để gọn.

---

## 6. Vòng vận hành hàng tuần (CEO-driven, không auto)

```
Thứ 2:  SCAN group GV + thuế/pháp lý  → đọc pain thật tuần này
        → Generate Weekly Plan (14–21 bài theo 4 pillar) → duyệt từng bài
Trong tuần: mỗi ngày nhận Telegram bài + seed comment → tự đăng group/Zalo đúng giờ
        → tự comment seed sau khi đăng (30 phút vàng)
Cuối tuần: Sync metrics Fanpage + nhập tay số liệu group nổi bật
        → Extract patterns ("pillar Thuế + hook hỏi trực tiếp → reach cao")
        → dùng cho plan tuần sau
```

Khớp lộ trình GTM đã có: **GĐ0 Beta** (20–50 GV, testimonial) → **GĐ1 Ra mắt mềm** (3 kênh lõi) → **GĐ2 Mở rộng** (TikTok, micro-KOL, ads nhỏ).

---

## 7. Rủi ro & lưu ý

| Rủi ro | Giảm thiểu |
|--------|-----------|
| Khóa tài khoản FB do đăng group | **Đã tắt auto-post.** Đăng tay, giãn cách, tôn trọng rule group, cho giá trị trước |
| Nội dung pháp lý/thuế **sai luật** | Người duyệt bắt buộc; bám nguồn chính thống (TT29, NĐ thuế); tránh khẳng định tuyệt đối |
| Hù dọa quá đà làm GV hoảng | Tone ấm, "giúp bạn nhẹ nhàng" thay vì "coi chừng bị phạt" |
| Chi phí API | Bắt đầu nhỏ: 1 Page + 5 group, sinh ít bài, đo trước khi mở rộng |
| Tệp ngại tech | CTA mềm (tải mẫu/checklist) thay vì ép cài app ngay |

---

## 8. Quyết định đã chốt & trạng thái ĐÃ BUILD

Quyết định (2026-07-10):
1. **Fork tại `C:\DayThem\marketing\`** (không repo riêng). ✅ Đã fork (4.7 MB, đã loại node_modules/db/video).
2. **Fanpage cũng đăng TAY** (không auto-post). ✅ Scheduler gate sau `ENABLE_SCHEDULER` (mặc định tắt); mọi kênh `posting_mode: manual`.
3. **Có sinh ảnh (Imagen).** ✅ Bật, brand ảnh GieoChữ (honey/green/coral) trong `skills/DESIGN.md` + `image_tools.py`.
4. **5 group khởi động.** ✅ 5 group placeholder GV trong `posting_targets.json` + `social_groups.yaml`.

**Đã hoàn thành** — xem `../marketing/README-GieoChu.md`:
- `project.yaml`, `data/posting_targets.json`, `data/social_groups.yaml`, `data/social_listening_sources.json` (GieoChữ)
- Sửa hardcode: `project.py`, `marketing.py`, `quick_post.py`, `youtube.py`, `social_poster.py`, `image_tools.py`
- Brand ảnh: `skills/DESIGN.md`, `C11`, `C5`; scan tệp GV: `R2`
- Scheduler manual-only; `.env.example`, `.gitignore`
- ✅ App FastAPI import sạch; project.yaml load đúng; slug DB = `gieochu`

**Còn lại (khi cần dùng tới):** ví dụ reel Doitay trong `C12`, hashtag `#doitay` trong `G9`, script legacy `seed_marketplace_agent.py`.

**Bước tiếp theo để chạy thật:** điền `page_id` + tên/URL 5 group thật + API key vào `.env` → `python run.py`.
