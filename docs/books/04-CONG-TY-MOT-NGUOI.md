# Book 04 — CÔNG TY MỘT NGƯỜI (sơ đồ phòng ban thật của bạn)

> Bạn thấy mấy cuốn kia viết như cho một đội — đúng, và đây là cuốn sửa điều đó.
> Sự thật: bạn KHÔNG phải "một người làm mọi việc". Bạn là **CEO của một công ty
> mà hầu hết nhân viên là phần mềm.** Cập nhật cho: full-time · điểm nghẽn = Marketing/Bán hàng + Chăm sóc/Vận hành.

---

## 1. Nguyên lý: 1 người ngồi ghế CEO, phần mềm ngồi các ghế còn lại

Một startup thật có ~8 phòng. Bạn **không thể** đích thân làm hết 8 phòng mỗi ngày —
và bạn cũng không cần. Cách công ty một người sống được:

- **3 chiếc ghế bạn PHẢI ngồi** (không giao được cho ai, kể cả phần mềm):
  1. **Chiến lược** — quyết định làm gì trước, bỏ gì.
  2. **Bán hàng** — quan hệ Zalo 1-1 với giáo viên (bộ mặt, niềm tin — cốt lõi tăng trưởng).
  3. **Kiểm duyệt** — cổng chốt cuối về nội dung/sản phẩm/tiền (chịu trách nhiệm).
- **Các ghế còn lại** đã có "nhân viên phần mềm" ngồi: Kỹ thuật = Claude, Nội dung =
  cỗ máy agent, Phân tích = Ops Cockpit + bản tin Telegram.
- **Việc chưa tới lượt** thì HOÃN thẳng, không ôm (referral, ads, iOS-nâng-cao…).

> Câu thần chú: **"Việc này thuộc phòng nào? Ai/cái gì ngồi ghế đó? Tôi chỉ ngồi 3
> ghế cốt lõi — còn lại là duyệt hoặc hoãn."**

---

## 2. Sơ đồ phòng ban — ai/cái gì làm, mở ở đâu

| Phòng | Làm gì cho GieoChữ | Ai ngồi ghế | Việc lặp cụ thể | Công cụ / mở ở đâu |
|---|---|---|---|---|
| **Giám đốc (Chiến lược)** | Chọn ưu tiên tuần, đọc số, quyết định | **BẠN** 🪑 | Thứ 2 xem KPI → chốt 3 việc quan trọng nhất tuần | Ops Cockpit + `gtm-checklist.md` |
| **Marketing & Bán hàng** ⚠️ | Kéo GV về + biến thành người dùng thật | **BẠN** 🪑 (Zalo 1-1) + đo tự động | Nhắn 10–15 GV/ngày · đăng bài · gắn link `/r/` · ghi nhật ký bài | `marketing-daily-playbook.md` + Cockpit (link + nhật ký) |
| **Chăm sóc & Vận hành** ⚠️ | Giữ GV ở lại, giữ hệ thống chạy | **BẠN** 🪑 + admin tự lo hàng chờ | Sáng dọn hàng chờ · trả inbox · kèm GV tới "aha" | `books/02` + `gieochu.vn/admin` |
| **Kỹ thuật & Sản phẩm** | Build app, sửa lỗi, deploy, lên store | **Claude** 🤖 (bạn chỉ mô tả) | Bạn kể vấn đề → tôi build/test/deploy | Chat với tôi + `books/01` |
| **Nội dung** | Sinh bài + ảnh đúng brand, gác cổng eval | **Cỗ máy agent** 🤖 | Sinh bài tuần → bạn DUYỆT → đăng tay | `marketing/` dashboard + `week1-package.md` |
| **Phân tích (BI)** | Báo số mỗi sáng, không cần bạn hỏi | **Tự động** 🤖 | 7h sáng đọc bản tin Telegram | Bản tin Telegram + Cockpit |
| **Tài chính & Thuế/Pháp lý** | Giá, thu chi, thuế, điều khoản | **BẠN** + tính năng thuế của app | Cuối tháng xem doanh thu · dùng tờ khai 09/KK | App (Thuế) + `gieochu.vn/legal` |
| **Thiết kế** | Giao diện, ảnh, thương hiệu | **Claude** 🤖 + skills | Khi cần → tôi làm theo brand | Chat + `marketing/skills/BRAND.md` |

🪑 = ghế bạn phải ngồi · 🤖 = phần mềm ngồi thay · ⚠️ = 2 phòng bạn đang đuối (mục 3–4 dành riêng).

---

## 3. Một ngày của công ty một người (full-time, ~8h)

Dồn giờ VÀNG (sáng, đầu chiều) cho 2 phòng đang ngộp. Việc phần mềm lo thì chỉ ĐỌC/DUYỆT.

| Giờ | Đội ngũ ghế | Việc |
|---|---|---|
| **8:00–8:20** | BI (đọc) | Đọc bản tin Telegram sáng: KPI, hàng chờ, click kênh, việc hôm nay. **Không phân tích tay** — phòng BI đã báo cáo. |
| **8:20–9:30** | **Chăm sóc** ⚠️ | Dọn hàng chờ admin (reset/xoá) · trả hết inbox Zalo/FB qua đêm · lướt 5 group trả lời comment. |
| **9:30–11:30** | **Bán hàng** ⚠️ | Nhắn Zalo 1-1 cho 10–15 GV mới (kịch bản trong marketing-daily) · **kèm tay người đã hẹn tới "aha"** (việc đáng giá nhất ngày) · cập nhật CRM. |
| **11:30–13:30** | Nghỉ trưa | |
| **13:30–14:30** | **Marketing** ⚠️ | Đăng bài theo lịch tuần · gắn link `/r/<kênh>` · sau khi đăng, dán seed comment + trả lời 30 phút vàng. |
| **14:30–16:30** | Kỹ thuật / Sản phẩm | Làm việc với Claude: sửa lỗi, tính năng mới, chuẩn bị store. Bạn mô tả — tôi build. |
| **16:30–17:30** | Nội dung (duyệt) | Duyệt bài agent sinh cho ngày mai (đã qua eval) · quay 1 clip TikTok nếu tới lịch. |
| **Tối (nhẹ)** | Cộng đồng | Hỏi thăm GV vừa kích hoạt · ghi nhật ký bài đăng (reach/comment) · xin testimonial ai khen. |

**Quy tắc chống ngộp:** mỗi khối chỉ làm ĐÚNG 1 phòng. Chuông báo hàng chờ giữa lúc
đang outreach? Ghi lại, xử ở khối Chăm sóc hôm sau — đừng nhảy phòng liên tục.

---

## 4. 2 phòng bạn đang đuối — chữa cụ thể

### ⚠️ Marketing & Bán hàng — "không biết bắt đầu từ đâu mỗi ngày"
Nghẽn vì không có quy trình cố định → mỗi sáng phải nghĩ lại. Chữa = **biến thành thói quen máy móc:**
1. **Bán hàng luôn có 1 việc duy nhất mỗi ngày:** nhắn 10–15 GV mới + kèm người đã hẹn.
   Không nghĩ "hôm nay làm gì" — cứ mở CRM, lấy 15 số chưa nhắn, nhắn.
2. **Marketing chạy theo LỊCH TUẦN cố định** (T3/T5 group, T4/T6 TikTok…) — nội dung
   agent sinh sẵn, bạn chỉ duyệt + đăng. Không sáng tác mỗi ngày.
3. **Đo bằng số, không bằng cảm giác:** click theo kênh (Cockpit) cho biết dồn sức đâu.

### ⚠️ Chăm sóc & Vận hành — "trả lời GV + giữ hệ thống, sợ sót"
Nghẽn vì việc đến bất chợt cả ngày. Chữa = **gom thành khối + để phần mềm nhắc:**
1. **Gom vào 1 khối sáng** (8:20–9:30) thay vì phản ứng cả ngày. Bản tin Telegram
   sáng đã liệt kê hàng chờ → mở đúng cái cần xử.
2. **Kịch bản trả lời có sẵn** (FAQ trong books/02) — copy, sửa tên, gửi. Không soạn lại.
3. **"Aha" là việc chăm sóc quan trọng nhất** — GV chạm được 1/3 việc lõi buổi đầu =
   giữ chân. Ưu tiên hơn mọi tin nhắn xã giao.

---

## 5. Nấc "tuyển người" — khi nào mở rộng khỏi công ty một người

Bạn KHÔNG cần tuyển người sớm. Thứ tự mở rộng:
1. **Đã tuyển rồi (phần mềm):** Claude (kỹ thuật), agent (nội dung), Cockpit (BI). Miễn phí, chạy ngay.
2. **Người đầu tiên (~sau launch 09/2026):** CTV content part-time cắt video/format bài —
   khi việc nội dung đã thành nhịp cố định. Chi tiết + SOP: `books/03`.
3. **Sau nữa:** freelancer chạy ads theo dự án; kế toán lo thuế khi doanh thu lớn.
   KHÔNG bao giờ giao: quan hệ Zalo 1-1, duyệt nội dung thuế, admin (3 ghế cốt lõi).

---

## 6. Bảng tra nhanh: "việc này của phòng nào?"

| Bạn đang định làm… | Phòng | Mở |
|---|---|---|
| Nhắn GV mới / kèm tới aha | Bán hàng (BẠN) | marketing-daily + CRM |
| Đăng bài / đo kênh | Marketing (BẠN + auto) | Cockpit link + nhật ký |
| Trả lời GV / xử reset-xoá | Chăm sóc (BẠN) | books/02 + admin |
| Sửa app / lên store | Kỹ thuật (Claude) | chat + books/01 |
| Cần bài viết / ảnh | Nội dung/Thiết kế (agent/Claude) | marketing/ dashboard |
| Xem mình đang thế nào | BI (auto) | Telegram digest + Cockpit |
| Quyết định ưu tiên/giá/thuế | Chiến lược/Tài chính (BẠN) | gtm-checklist + app Thuế |
