# GieoChữ — Implementation Plan: Wow-features (từ "hữu ích" → "phải khoe")

> Bối cảnh: app đã có **trợ lý chủ động LIVE** (cảnh báo học sinh vắng liên tiếp/nguy cơ bỏ học + đếm phụ huynh chưa nộp — xác minh chạy thật 2026-07-11). Mục tiêu bản plan này: thêm **1–2 "signature moment"** biến app từ *tiện* thành *đáng khoe* → tạo truyền miệng.
> Cửa sổ: ~2 tuần tới (song song hoàn thiện iOS). Mỗi wow gắn thẳng 1 KPI trong [[gtm-research-report]] (activation / K-factor / retention).
> Ngày: 2026-07-11.

---

## 0. Nguyên tắc

1. **Mỗi wow = 1 đòn bẩy tăng trưởng đo được** — không làm "wow cho đẹp".
2. **Trung thực kỹ thuật:** nêu rõ giới hạn (đặc biệt Zalo *không* cho tự gửi tin nhắn cá nhân qua API công khai). Ship theo **tier**: MVP khả thi trước, "phép thuật đầy đủ" (ZNS/OCR) sau.
3. **Lát mỏng, đo ngay:** ra tính năng → gắn sự kiện đo → xem có nhấc KPI không rồi mới đầu tư sâu.

---

## 1. Bảng ưu tiên (tác động GTM × công sức)

| # | Feature | Đòn bẩy GTM chính | Công sức | Cửa 2 tuần? |
|---|---------|-------------------|----------|-------------|
| ⭐ 2.1 | **Zalo 1-chạm** (mở đúng chat + tin đã sẵn) | Activation + **vòng lặp hằng ngày** + kênh referral | Trung bình | ✅ Signature |
| ⭐ 2.2 | **Thiệp báo cáo phụ huynh** (ảnh đẹp, có brand) | **K-factor** (phụ huynh thấy → hỏi → WOM) | Trung bình | ✅ nếu kịp |
| 2.3 | **Chốt sổ cuối tháng** (Wrapped mini) | Retention (thói quen tháng) + shareable | Nhỏ | ➕ quick win |
| 2.4 | **Nhập cả lớp bằng dán danh sách** | **Activation** (time-to-value <10') | Nhỏ (bản dán) | ➕ quick win |
| ✔ (đã có) | Trợ lý cảnh báo bỏ học + đếm chưa nộp | Retention + lõi VP | — | Xong |
| ⏳ later | ZNS auto-gửi Zalo · OCR ảnh danh sách | tự động hoá vòng lặp | Lớn | Phase 2 |

**Chọn 1 signature để dồn lực:** **2.1 Zalo 1-chạm** — vì nó nằm trong việc GV làm *mỗi ngày* (nhắc học phí / hỏi thăm), biến điểm ma sát lớn nhất thành khoảnh khắc mượt. Cộng với **2.2 thiệp phụ huynh** (đòn viral) là bộ đôi đủ tạo truyền miệng.

---

## 2. Đặc tả từng tính năng

### 2.1 ⭐ Zalo 1-chạm — SIGNATURE
**User story:** GV bấm "Nhắc học phí" → **Zalo mở đúng cửa sổ chat phụ huynh, nội dung đã sẵn**, chỉ việc gửi — thay vì copy rồi tự tìm người dán.

**Vì sao wow:** vòng lặp cốt lõi hằng ngày; xoá ma sát "ngại đòi tiền" + thao tác copy-paste rườm rà.

**Đòn bẩy GTM:** Activation (đăng ký kiểu SSO <60s — GTM Mục 47) · giữ chân (dùng mỗi ngày) · là chính **cơ chế mời** (mời đồng nghiệp qua Zalo).

**⚠️ Thực tế kỹ thuật Zalo (quan trọng — làm theo tier):**
| Tier | Cơ chế | Trải nghiệm | Khả thi |
|------|--------|-------------|---------|
| 0 (hiện tại) | `ZaloCopySheet` copy clipboard | GV tự mở Zalo, tự tìm người, dán | Đã có |
| **1 (MVP wow)** | Deep-link `https://zalo.me/<parent_phone>` **+ tự copy nội dung** vào clipboard trước khi mở | Bấm 1 lần → **Zalo mở đúng chat** phụ huynh → dán 1 chạm | ✅ **2 tuần** |
| 1b | OS share-sheet → chọn Zalo (khi không có số) | Zalo mở, text sẵn, chọn người/nhóm | ✅ |
| 2 (phép thuật) | **Zalo OA + ZNS** (Zalo Notification Service) template | Phụ huynh **tự nhận** nhắc học phí/báo cáo, GV không làm gì | ⏳ Phase 2 — *tốn phí + duyệt template + xác minh doanh nghiệp* |

> **KHÔNG hứa:** API công khai **không** cho prefill/tự gửi tin nhắn Zalo *cá nhân*. Đường "tự gửi" duy nhất hợp lệ = **ZNS** (transactional, trả phí, phải duyệt) → để Phase 2.

**Scope MVP (Tier 1):** nâng cấp `ZaloCopySheet`: nếu có `parent_phone` → nút **"Mở Zalo phụ huynh"** = auto-copy nội dung + mở `zalo.me/<phone>`; nếu không có số → giữ share-sheet/copy. Áp cho: nhắc học phí (ClassTuition + card Home), hỏi thăm HS vắng (Attendance), báo cáo.

**Effort:** ~2–3 ngày (1 helper `openZalo(phone, message)` + gắn vào 3 điểm gọi + xử lý web/native + fallback).

**Rủi ro:** Zalo có thể không mở đúng chat nếu SĐT chưa có Zalo → cần fallback rõ ("Không mở được → đã copy sẵn, mở Zalo dán nhé").

**Acceptance:** từ card "3 chưa nộp" → ≤2 chạm là tin nằm trong khung chat đúng phụ huynh (có số); có fallback khi không số; đo sự kiện `zalo_open`.

---

### 2.2 ⭐ Thiệp báo cáo phụ huynh (ảnh) — VIRAL LOOP
**User story:** cuối tuần GV bấm "Gửi báo cáo" → app tạo **1 tấm thiệp đẹp** (chuyên cần %, tiến bộ, lời nhắn ấm, logo GieoChữ) → gửi Zalo cho phụ huynh.

**Vì sao wow (cho *phụ huynh*, không phải GV):** phụ huynh nhận thiệp đẹp → *"cô dùng app gì hay vậy?"* → nhận biết thương hiệu **từ phía phụ huynh**. Đây đúng là loop ClassDojo đã thắng (GTM Mục 2.1) + yếu tố "cộng tác" mà referral cần (Mục 49).

**Đòn bẩy GTM:** **K-factor** (mỗi báo cáo = 1 lần brand chạm phụ huynh) · retention (GV tự hào) · gắn watermark "Tạo bằng GieoChữ 🌿 — miễn phí".

**Kỹ thuật:** render thiệp bằng `react-native-view-shot` (chụp 1 View đã style) → PNG → share Zalo. Không cần backend. Số liệu lấy từ report/summary sẵn có.

**Scope MVP:** 1 template thiệp/tuần cho 1 HS (tên, chuyên cần tuần, "đã nộp/chưa", 1 dòng nhận xét chọn nhanh), nút "Gửi Zalo".

**Effort:** ~3–4 ngày (thiết kế thiệp + view-shot + share + chọn nhận xét).

**Rủi ro:** view-shot trên web khác native; cần test cả 2. Font tiếng Việt trong ảnh.

**Acceptance:** tạo được PNG thiệp đúng số liệu HS, share ra Zalo; có watermark brand.

---

### 2.3 Chốt sổ cuối tháng (Wrapped mini) — RETENTION quick win
**User story:** đầu tháng mới, Home hiện thẻ *"Tháng 7 của cô: thu 5.4tr · 18 buổi · 92% chuyên cần · 2 bé cần quan tâm"* → có nút "Xem lại / Chia sẻ".

**Đòn bẩy GTM:** retention (mốc cảm xúc hằng tháng, đúng nhịp thu phí) + shareable (WOM nhẹ).

**Kỹ thuật:** endpoint `/reports/monthly-wrap?month=` (tái dùng logic tuition + attendance aggregation đã có ở `/home/summary` & reports) → 1 màn/thẻ. Hoặc tính client từ dữ liệu sẵn.

**Effort:** ~2 ngày (backend gộp số + 1 thẻ UI).

**Acceptance:** đầu tháng hiện đúng tổng kết tháng trước; chia sẻ được (tái dùng 2.2).

---

### 2.4 Nhập cả lớp bằng dán danh sách — ACTIVATION quick win
**User story:** lúc tạo lớp, GV **dán cả danh sách tên** (mỗi dòng 1 HS) → app tách thành từng học sinh → xong cả lớp trong 10 giây, thay vì gõ tay từng bé.

**Đòn bẩy GTM:** **Activation/time-to-value** — GTM coi activation 24h là "sinh tử" (Mục 47, 141). Đây là nơi 98% user rơi; bỏ việc nhập tay chán nhất = tăng activation trực tiếp.

**Kỹ thuật:** ô textarea → split theo dòng → tạo hàng loạt qua API `POST students` (loop hoặc endpoint bulk). Bản **dán text** = nhỏ; **OCR ảnh** (chụp danh sách) = Phase 2 (ML Kit/expo).

**Effort:** ~1–2 ngày (bản dán). OCR ảnh: +nhiều, để sau.

**Acceptance:** dán 10 dòng tên → tạo 10 HS trong lớp, 1 xác nhận.

---

### ✔ (Đã có) Trợ lý cảnh báo bỏ học + đếm chưa nộp
LIVE. Đây là **wow nền** (VP "app nghĩ hộ"). Giữ & khuếch đại trong content/demo GTM.

---

## 3. Sequencing — cửa 2 tuần (song song iOS)

| Ngày | Việc | Ghi chú |
|------|------|---------|
| 1–3 | **2.1 Zalo 1-chạm** (Tier 1) | Signature; đổi `ZaloCopySheet` |
| 3–4 | **2.4 Dán danh sách** | Quick win activation |
| 5–8 | **2.2 Thiệp báo cáo phụ huynh** | Viral loop |
| 8–9 | **2.3 Chốt sổ tháng** (nếu còn thời gian) | Quick win retention |
| song song | Hoàn thiện **iOS** + build APK (gộp icon + trợ lý + wow) | 1 lần build ra cả bộ |
| cuối | Gắn **sự kiện đo** (zalo_open, report_share, bulk_import, wrap_view) | Để chấm KPI GTM |

> Nếu phải cắt: giữ **2.1 + 2.4** (activation + vòng lặp hằng ngày) làm tối thiểu; **2.2** là ưu tiên kế cho tăng trưởng.

---

## 4. Phụ thuộc & rủi ro

- **Zalo policy:** tự-gửi cá nhân không khả thi qua API → chỉ deep-link/share (Tier 1). ZNS (Tier 2) cần OA verified + duyệt template + phí → lập kế hoạch riêng nếu muốn "auto".
- **Ảnh/View-shot:** khác nhau web vs native, font VN → test 2 nền tảng.
- **Số điện thoại phụ huynh** phải có để deep-link đúng chat → khuyến khích nhập số lúc thêm HS (nối với 2.4).
- **Đo lường** phải cài cùng lúc, nếu không sẽ không biết wow có nhấc KPI.

---

## 5. Đo lường (mỗi feature ↔ 1 KPI GTM Mục 7)

| Feature | Sự kiện | KPI GTM tác động | Mốc kỳ vọng |
|---------|---------|------------------|-------------|
| 2.1 Zalo 1-chạm | `zalo_open` / lần nhắc | Activation, dùng hằng ngày | tỉ lệ "nhắc → mở Zalo" ≥60% |
| 2.2 Thiệp phụ huynh | `report_share` | **K-factor** | ≥30% báo cáo được share (Mục 49) |
| 2.3 Chốt sổ tháng | `wrap_view` / `wrap_share` | Retention W4 | mở đầu tháng ≥50% |
| 2.4 Dán danh sách | `bulk_import` | **Activation 24h** | rút thời gian tạo lớp <10' |

---

## 6. Ngoài phạm vi (Phase 2+)
ZNS auto-gửi Zalo (phụ huynh tự nhận) · OCR ảnh danh sách · thiệp nhiều template/động · gợi ý pattern ("bé Long thường nộp trễ 5 ngày").
