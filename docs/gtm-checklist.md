# GieoChữ — Checklist Go-To-Market

> Ngày: 2026-07-14. Nguồn: (1) audit codebase GTM-readiness `backend/src` + `mobile/src`; (2) deep-research 3 case đã kiểm chứng (Azota, ClassDojo, MISA) — verify đối kháng 3-0/2-1.
> Sản phẩm: app quản lý lớp dạy thêm cho **giáo viên cá nhân** (điểm danh, thu học phí, báo nghỉ/học bù, báo cáo phụ huynh, nhắc Zalo, thuế HKD, xuất Excel). Tệp: cô/thầy trung niên, ngại tech, sống trong Zalo.
> Liên quan: `docs/personas-journey-pains.md`, `docs/fb-groups-pain-analysis.md`, memory `marketing-gtm`.

---

## 0. Điều research xác nhận — 3 case đều chung một công thức

| Pattern (đã verify) | Bằng chứng | Áp cho GieoChữ |
|---|---|---|
| **1 wedge gỡ việc thủ công lặp lại**, phát MIỄN PHÍ | Azota: "chấm bài 2h→2 phút" → 700k GV/~1 năm, đỉnh ~6tr user/tháng | Wedge = **thu học phí + báo cáo phụ huynh** (việc cô làm mỗi tháng, ngại nhất) |
| **Viral loop GV→phụ huynh xây thẳng vào sản phẩm** | ClassDojo: thấy GV *tự chụp màn hình gửi phụ huynh* → biến thành tính năng gửi → 35.000 lớp/12 tuần, **0đ quảng cáo** | Cô GieoChữ đang **copy-dán tay sang Zalo** — chính hành vi ClassDojo đã sản phẩm hoá. Đang bỏ lỡ vòng lan truyền mạnh nhất |
| **Đòn bẩy pháp lý/thuế làm mồi acquisition** | MISA: neo vào bỏ thuế khoán + ngưỡng miễn thuế, **tặng free trọn đời** để gỡ friction | Đúng đòn bẩy Thông tư 29 + thuế HKD |
| **Hoãn monetize, giữ core free để không chặn viral** | ClassDojo hoãn 7 năm, bán cho **ví phụ huynh** | ⚠️ **KHÔNG copy nguyên** — bootstrap cần thu sớm hơn |

**Insight lõi:** ClassDojo (analog gần nhất) dạy rằng vòng lan truyền không đến từ referral có thưởng, mà từ việc **GV gửi thứ có giá trị cho phụ huynh**. GieoChữ đã có sẵn hành vi đó (gửi báo cáo/nhắc phí qua Zalo) — nhưng audit cho thấy **luồng gửi này đang giả** → đang phá đúng động cơ tăng trưởng mạnh nhất.

---

## 1. Trạng thái sản phẩm (từ audit) — cái gì đẩy được, cái gì chưa

**Sẵn sàng đẩy NGAY (nói đúng như đang có):**
- ✅ Thu học phí (tick nộp/chưa + nhắc riêng qua Zalo deep-link) — chín nhất
- ✅ Điểm danh (end-to-end thật)
- ✅ Xuất Excel
- ✅ Thuế TNCN — chỉ quảng bá "ước tính + tạo tờ khai 09/KK nháp", KHÔNG "tự nộp"
- ✅ Thiệp báo cáo per-HS (`ThiepShare`, PNG có tên + số liệu thật) — đây mới là "báo cáo riêng" thật

**Rào cản phải xử trước:**
- 🔴 Báo cáo phụ huynh: luồng "gửi hàng loạt" GIẢ (progress fake + "Đã gửi X" trong khi không gửi gì; tin dùng chữ literal `[Tên con]`)
- 🔴 Referral / "Mời đồng nghiệp": **0 dòng code** — chưa build
- 🟡 Không có Zalo API thật (gửi = copy-dán); landing overclaim "Đăng nhập bằng Zalo" + "gửi Zalo 1 chạm"
- 🟡 "Sắp có" hiện ngay màn Cài đặt lớp
- 🟡 Học bù chưa khép vòng (phụ huynh không có kênh bỏ phiếu)
- 🟡 Onboarding: quên mật khẩu email thủ công, SĐT chưa xác thực (OTP dev-mode)

---

## 2. CHECKLIST — theo thứ tự thực thi

### 🔧 BƯỚC 0 — "Sự thật hoá" (GATE, chặn mọi bước sau)
- [ ] Sửa luồng báo cáo: bỏ progress giả; đổi "Đã gửi X" → "Đã soạn — bấm mở Zalo gửi"; **điền tên HS thật** (backend đã có data per-student)
- [ ] Gỡ/ship "Sắp có" ở mục nhóm Zalo (Cài đặt lớp)
- [ ] Đồng bộ landing ↔ app: bỏ "Đăng nhập bằng Zalo" + "gửi Zalo 1 chạm"; đổi thành "Soạn sẵn tin, mở Zalo gửi trong 2 giây"
- [ ] Chốt câu chữ thuế: "ước tính + tạo tờ khai 09/KK nháp", KHÔNG "tự nộp"

### 🎯 BƯỚC 1 — Chốt wedge + Beta có bằng chứng (2–4 tuần)
- [ ] Chốt 1 wedge: "Thu học phí không sót ai + báo cáo riêng từng phụ huynh, tế nhị" (thuế = mồi nội dung, không phải wedge)
- [ ] Tuyển 20–50 GV beta từ quan hệ + 3–5 group tiểu học (Nhóm A)
- [ ] Kèm từng người tới 1 trong 3 "aha" buổi đầu: tick thu phí biết ai chưa nộp · gửi 1 báo cáo riêng · nhắc phí qua Zalo
- [ ] Thu **testimonial + video thật** (tài sản marketing quý nhất)
- [ ] Đo: % tạo ≥1 lớp; % làm ≥1 hành động lõi trong 24h

### 🔁 BƯỚC 2 — Xây viral loop GV→phụ huynh THẬT (đòn bẩy ClassDojo)
- [ ] Biến gửi báo cáo/nhắc phí thành khoảnh khắc cô tự hào khoe (thiệp per-HS đẹp, tên con, số liệu thật)
- [ ] Gắn dấu ấn GieoChữ tinh tế vào thiệp/tin gửi phụ huynh → mỗi tin = 1 lần phụ huynh thấy sản phẩm (exposure virality kiểu Calendly)
- [ ] Đặt điểm "Mời đồng nghiệp" NGAY SAU khoảnh khắc gửi báo cáo
- [ ] Build referral từ đầu: link/QR qua Zalo + tracking + thưởng 2 chiều (+1 tháng Pro / mở thêm lớp)

### 📣 BƯỚC 3 — Kênh khởi động 0đ (đòn bẩy MISA + Azota)
- [ ] Nội dung mồi pháp lý/thuế (checklist HKD, "dạy bao nhiêu/năm thì lo thuế?") — **cập nhật con số theo văn bản mới nhất** (ngưỡng đổi 500tr→1 tỷ giữa các nguồn; kèm "tham khảo, đối chiếu cơ quan thuế")
- [ ] Đăng ~5 group tiểu học/môn (Nhóm A) — giá trị trước, nhắc app cuối bài. Group "tìm việc" (Nhóm B) chỉ nghe pain
- [ ] Lập Zalo OA (hỗ trợ + giữ chân — tệp ngại tech cần người thật)
- [ ] 2–3 micro-KOL là giáo viên thật

### 📈 BƯỚC 4 — Activation & Retention (quan trọng hơn lượt tải)
- [ ] Local notification nhắc "cuối tháng thu học phí" / "hôm nay có lớp" — bám nhịp tháng
- [ ] Theo dõi Retention W4 (chỉ số sinh tử) + K-factor + CAC theo kênh

### 💰 BƯỚC 5 — Monetize (KHÔNG copy hoãn-7-năm)
- [ ] Giữ core free (thu phí, điểm danh, báo cáo, nhắc Zalo) để không chặn viral
- [ ] Thu phí phần "đỡ việc": nhiều lớp, xuất Excel, tờ khai thuế, sao lưu — giá "ly cà phê" ~30–69k/tháng
- [ ] Bootstrap → thu sớm hơn ClassDojo, nhưng sau khi activation/retention tốt

---

## 3. Cái research nói KHÔNG áp dụng
- Hoãn monetize 7 năm (ClassDojo) — xa xỉ của startup có VC
- Cú hích COVID (Azota) — không có khủng hoảng đẩy viral → tốc độ không lặp lại 1:1; bù bằng content pháp lý đúng sóng TT29
- Bán cho ví phụ huynh (ClassDojo) — bối cảnh Mỹ; VN người trả tiền nhiều khả năng là chính GV → cần test
- Số Azota (700k GV, ~30%) là tự bạch vòng gọi vốn, chưa audit độc lập → định hướng, không phải mục tiêu

## 4. Lỗ hổng research còn mở (cần vòng 2 nếu muốn)
- KiotViet/Sapo: không claim nào sống sót qua kiểm chứng
- Cơ chế referral có thưởng cụ thể: chưa case nào mô tả rõ
- Monetization GV vs phụ huynh ở thị trường VN

## 5. Nguồn chính (đã verify)
- Azota: forbes.vn, cafebiz.vn, techcrunch.com/2022/07/05, thegioididong.com (tutorial 28/9/2021)
- ClassDojo: review.firstround.com (podcast CEO Sam Chaudhary — primary), forbes.com 2017, prnewswire.com
- MISA: misa.vn/157043, baochinhphu.vn (gói "Cất Cánh" free trọn đời + 5.000 hóa đơn)
