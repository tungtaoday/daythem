# GieoChữ — SỔ TAY VẬN HÀNH (Master Playbook)

> Đây là cuốn MỞ ĐẦU MỖI SÁNG. Nó không lặp lại nội dung các book khác — nó
> CHỈ ĐƯỜNG: muốn làm X → mở book Y. Cập nhật: 2026-07-26.
> Nguyên tắc: 1 founder chạy được toàn bộ; CTV chỉ đỡ phần "tay chân" (xem Book 03).

---

## 0. Bản đồ thư viện — mở book nào khi cần gì

| Bạn muốn… | Mở |
|---|---|
| Hiểu mình là "công ty 1 người" gồm phòng ban nào, ai/cái gì ngồi ghế nào | **Book 04 — Công ty một người** |
| Biết hôm nay/tuần này làm gì | Cuốn này, mục 2–3 (chi tiết 1 ngày: Book 04 mục 3) |
| Chiến lược tổng: wedge, kênh, giá, phễu | `docs/gtm-checklist.md` + memory `marketing-gtm` |
| Đưa app lên iOS + CH Play | `docs/store-launch-checklist.md` |
| Chạy marketing digital hằng ngày | `docs/marketing-daily-playbook.md` |
| Nội dung đăng tuần này (đã duyệt eval) | `docs/marketing-week1-package.md` |
| Vận hành cỗ máy agent marketing | `marketing/README-GieoChu.md` + Book 01 mục "Marketing system" |
| Deploy backend / build APK / sửa sự cố | **Book 01 — Product & Deploy Runbook** |
| Giao việc cho cộng tác viên | **Book 03 — CTV Playbook** |
| Xử lý yêu cầu reset/xoá tài khoản, chăm GV mới | **Book 02 — Support & Onboarding Runbook** |
| **Kiếm giáo viên thật: nhắn ai, nói gì, script từng bước** | **Book 05 — Tuyển giáo viên beta** |
| Hiểu tệp khách + nỗi đau | `docs/personas-journey-pains.md`, `docs/fb-groups-pain-analysis.md` |

**Sự thật nền (cập nhật 03/08/2026):** backend LIVE `https://daythem.doitay.vn`;
landing `gieochu.vn`; admin `gieochu.vn/admin`. AAB đã lên track Closed testing
(Release 2 · 1.0.0).

⚠️ **Kiểm dữ liệu prod 03/08 phát hiện: 9 tài khoản đều là tài khoản thử của chính
mình hoặc dữ liệu seed → SỐ GIÁO VIÊN THẬT = 0.** Mọi chỉ số activation/North Star
trước ngày này đều đang đo dữ liệu giả, đừng tin.

**Nút thắt hiện tại = 12 tester opt-in cho CH Play, và cũng là 12 khách hàng thật
đầu tiên. Hai việc là MỘT → mở Book 05.**

---

## 1. 3 CHỈ SỐ SINH TỬ (dán lên tường)

Mọi việc phục vụ 3 số này. Xem tại `gieochu.vn/admin` → Activation.

1. **Activation 24h** — % người tạo lớp + làm 1 hành động lõi trong ngày đầu. Mục tiêu beta ≥60% (có kèm tay).
2. **Retention W4** — % còn dùng sau 4 tuần. Chỉ số quan trọng nhất (app dùng theo nhịp tháng). Đo từ 09/2026.
3. **K-factor** — mỗi GV mời được bao nhiêu GV. Xây referral sau khi beta có tín hiệu.

> Nếu phải bỏ bớt việc: giữ việc làm tăng 3 số này, bỏ mọi việc "cho oai".

---

## 2. NHỊP TUẦN — 1 trang (hợp nhất product + store + marketing + support)

| Thứ | Product/Store | Marketing | Support |
|---|---|---|---|
| **T2** | Check disk VPS (`df -h /`), xem crash/lỗi | Đo KPI tuần + lên lịch nội dung | Dọn hàng chờ reset/xoá tài khoản |
| **T3** | — | Đăng group #1–2 | Trả lời inbox trong 24h |
| **T4** | (nếu có bug) sửa + deploy | TikTok #1 | Kèm tay GV vừa cài |
| **T5** | — | Đăng group #3–4 (pháp lý/thuế) | " |
| **T6** | Build APK preview nếu có bản mới | TikTok #2 + group #5 | " |
| **T7** | — | Viết 1 bài blog SEO | Gom testimonial |
| **CN** | Nghỉ / tổng hợp phản hồi GV → dev | Nghỉ | Chỉ trả lời tin |

Chi tiết marketing hằng ngày: Book marketing-daily. Chi tiết deploy: Book 01.

---

## 3. NHỊP NGÀY của founder (~2–3h khi đang launch)

1. **Sáng 30'** — Trực quầy: trả lời hết Zalo/FB qua đêm · check admin (reset/xoá) · lướt 5 group trả lời comment.
2. **Trưa 45'** — Outreach: nhắn Zalo 1-1 cho 10–15 GV mới (kịch bản trong marketing-daily) · kèm tay người đã hẹn tới "aha" · cập nhật sổ CRM.
3. **Tối 45'** — Nội dung theo lịch tuần · hỏi thăm GV vừa kích hoạt · xin testimonial.
4. **Bất kỳ lúc nào có bug chặn** → Book 01 mục "Sự cố".

---

## 4. LỘ TRÌNH 60 ngày (mốc lớn)

| Giai đoạn | Ngày | Việc xương sống |
|---|---|---|
| Chuẩn bị store | 26–31/07 | Đăng ký Play Console + Apple Dev · thuê 12 tester (Testers Community ~$15) · tuyển 20–30 GV beta · tôi soạn store listing + screenshots |
| Build & nộp | 01/08 | Build AAB+iOS+APK · nộp closed testing Play · submit App Store |
| iOS live + beta | 02–15/08 | iOS duyệt (~3 ngày) → live · kèm tay beta · giữ đủ 12 tester 14 ngày · gom testimonial |
| Play live + bung kênh | 17–20/08 | Xin production Play → live · bung full lịch marketing, CTA = 2 store |
| Sau launch | cuối 08 → 09 | Referral "Mời đồng nghiệp" · Zalo OA · đo Retention W4 · cân nhắc thuê CTV content (Book 03) |

---

> 🪑 **Bạn là CEO của công ty mà hầu hết nhân viên là phần mềm.** 3 ghế bạn phải ngồi:
> Chiến lược · Bán hàng (Zalo 1-1) · Kiểm duyệt. Các ghế khác: Claude (kỹ thuật), agent
> (nội dung), Cockpit (phân tích). Sơ đồ phòng ban đầy đủ + 1 ngày cụ thể: **Book 04**.

## 5. RANH GIỚI: việc founder giữ vs giao được (bản rút gọn — chi tiết Book 03)

**GIỮ (là bộ mặt & bộ não, không giao):** quan hệ Zalo 1-1 với GV · kèm tay tới aha ·
duyệt nội dung thuế/pháp lý · quyết định sản phẩm · admin dashboard (chứa dữ liệu cá nhân GV).

**GIAO ĐƯỢC (là tay chân, sau khi có SOP):** dựng/cắt video TikTok · format bài từ
output agent · làm ảnh/screenshot · cập nhật sổ CRM · lắng nghe 13 group gom quote pain.

> Trực giác của bạn đúng: CTV KHÔNG hiệu quả với phần "bộ mặt" (tệp GV tin người
> thật, ngửi ra script tổng đài). CTV chỉ hiệu quả với phần "tay chân", và chỉ nên
> thuê SAU khi bạn đã có cỗ máy nội dung lặp lại được (~09/2026). Book 03 nói rõ.
