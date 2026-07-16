# Nghiên cứu Marketplace GieoChữ — "Dạy cùng" & "Phòng dạy chung"

> **Trạng thái:** Nghiên cứu (research) — CHƯA build. Theo quyết định 2026-07-12: chỉ layer marketplace lên **sau khi lõi quản lý lớp đủ user** ở một khu vực. Tài liệu này chuẩn bị sẵn thiết kế để khi đủ tín hiệu là bung nhanh.
>
> **Ngày:** 2026-07-14 · **Bản:** nháp 1 (phần bối cảnh thị trường VN đang được research bổ sung)

---

## 0. Vì sao nghiên cứu 2 module này

GieoChữ hiện là **công cụ 1 người dùng** (single-player): GV tự quản lý lớp của mình, không cần ai khác cũng có giá trị. Đó là lý do nó sống được từ ngày đầu.

Hai module marketplace muốn thêm là **2 người dùng** (two-sided) — chỉ có giá trị khi có đủ cả cung lẫn cầu ở gần nhau:

| Module | Cung | Cầu | Đơn vị giao dịch |
|--------|------|-----|------------------|
| **A — Dạy cùng** | GV có chỗ trống / muốn ghép môn / muốn sang lớp | GV cần người dạy cùng / dạy thay / nhận lớp | Một "kèo" hợp tác giữa 2 GV |
| **B — Phòng dạy chung** | GV/chủ có phòng trống theo giờ | GV cần chỗ dạy | Một lượt đặt phòng theo buổi |

**Nguyên tắc xuyên suốt:** mỗi module phải có **giá trị single-player trước** (dùng một mình vẫn được), rồi mới cộng thêm hiệu ứng mạng. Nếu thiết kế mà "không có người khác thì vô dụng" → sẽ chết vì cold-start.

---

## 1. Module A — "Dạy cùng" (kết nối GV ↔ GV)

### 1.1 Các loại nhu cầu (không chỉ "dạy cùng")

Thực chất đây là **1 module đa mục đích** cho quan hệ GV–GV. Gộp 4 loại "tin" vào chung một khung:

1. **Ghép môn / dạy cùng** — cô Toán + thầy Lý mở lớp combo, hoặc chia ca cùng một nhóm HS.
2. **Dạy thay** — GV ốm/bận/đi công tác cần người dạy thay 1–vài buổi.
3. **Sang / nhượng lớp** — GV nghỉ dạy, chuyển vùng → sang cả lớp cho GV khác.
4. **Giới thiệu học sinh (overflow)** — lớp quá đông / lệch trình độ → đẩy HS dư sang GV khác gần đó, có thể kèm phí giới thiệu.

> Gộp 4 loại giúp **thanh khoản dồn về 1 chỗ** thay vì 4 marketplace lèo tèo. Người dùng chọn "loại tin" khi đăng.

### 1.2 Personas & job-to-be-done

- **GV "thừa cầu":** nhiều HS hỏi nhưng không kham hết / không dạy môn đó → muốn đẩy đi mà vẫn giữ uy tín. *Job: "giới thiệu HS cho người tin được, gần nhà, đúng môn."*
- **GV "thiếu cầu" / mới:** muốn nhận thêm lớp, nhận dạy thay để có thu nhập + kinh nghiệm. *Job: "tìm lớp/kèo gần tôi, đúng môn tôi mạnh."*
- **GV "kẹt lịch":** ốm/bận đột xuất, không muốn hủy buổi. *Job: "kiếm người dạy thay tin được trong 24h."*

### 1.3 Giá trị single-player trước (quan trọng)

Trước khi có "chợ", module A cho GV một thứ hữu ích ngay cả khi ở một mình:

- **Hồ sơ GV công khai (mini profile):** môn, khối, khu vực (phường/quận), khung giờ rảnh, giới thiệu ngắn, link Zalo. → dùng như "danh thiếp" gửi phụ huynh/đồng nghiệp, **có ích ngay** dù chưa ai match.
- **Sổ đồng nghiệp:** lưu liên hệ các GV quen (thủ công) để lần sau cần dạy thay là bấm gọi — thay cho việc lục Zalo.

Khi mật độ đủ, mới bật lớp "khám phá / tin đăng" bên trên nền hồ sơ này.

### 1.4 Khám phá & match

- **Lọc theo:** khu vực (ưu tiên bán kính gần), môn, khối, loại tin, khung giờ.
- **Match tối giản:** đăng tin → GV khác thấy → bấm "Quan tâm" → mở luồng **deeplink Zalo** (đúng chủ trương chỉ dùng Zalo deeplink, không OA/API) để 2 bên tự chốt. App **không** ôm chat/thanh toán ở MVP.
- **Concierge MVP:** giai đoạn đầu, chủ app (qua admin dashboard) có thể **tự tay mai mối** các kèo ở khu vực seed → tạo cảm giác "chợ có người" trước khi tự động hoá.

### 1.5 Trust & safety (nhẹ, phù hợp GV VN)

- Đã có sẵn: **xác minh SĐT** (auth hiện tại). Dùng làm nền tin cậy cơ bản.
- Thêm dần: **review 2 chiều** sau mỗi kèo (đúng giờ / đáng tin), **badge "đã xác minh"**, nút **báo cáo**.
- Không cần KYC nặng ở MVP — rào cản cao sẽ giết cung.

---

## 2. Module B — "Phòng dạy chung" (thuê/chia sẻ chỗ dạy)

### 2.1 Nhu cầu

- **Bên có phòng:** trung tâm/GV có phòng **trống một số khung giờ** (sáng, hoặc ngày thường) muốn tận dụng kiếm thêm; hoặc người có phòng ốc dư.
- **Bên cần phòng:** GV dạy tại nhà chật/ồn, GV dạy nhóm cần phòng có bảng/máy chiếu, GV di chuyển giữa các khu.

### 2.2 Giá trị single-player trước

- **"Chỗ dạy của tôi":** GV khai báo phòng đang dùng (địa chỉ xấp xỉ, sức chứa, tiện ích, khung rảnh) → dùng để **tự quản lý lịch phòng** + gắn vào lớp. Có ích ngay cả khi chưa cho ai thuê.
- Khi bật chợ: cùng dữ liệu đó trở thành **tin cho thuê** chỉ bằng 1 công tắc "Cho thuê giờ trống".

### 2.3 Đơn vị & luồng đặt

- **Phòng (Room):** địa chỉ mức phường (ẩn số nhà tới khi chốt), sức chứa, tiện ích (bảng, máy chiếu, wifi, điều hoà, chỗ để xe), giá/giờ hoặc /buổi, ảnh, các khung giờ trống.
- **Đặt (Booking):** GV chọn khung → gửi yêu cầu → chủ duyệt → (tuỳ chọn) **đặt cọc**. MVP có thể **không giữ tiền** (deeplink Zalo + chuyển khoản QR có sẵn của app), app chỉ ghi nhận lịch để tránh trùng.

### 2.4 Trust & safety (cao hơn module A vì có tiền + tài sản)

- Ẩn địa chỉ chính xác đến khi 2 bên đồng ý.
- **Cọc giữ chỗ** (giai đoạn sau, có thể qua chuyển khoản + xác nhận thủ công trước khi làm escrow thật).
- Review 2 chiều (phòng đúng mô tả? / người thuê giữ gìn?).
- Quy tắc huỷ/hoàn cọc rõ ràng.

---

## 3. Kiến trúc — giữ 2 module THỰC SỰ độc lập

Yêu cầu của chủ app: **module độc lập**. Cụ thể:

### 3.1 Backend (FastAPI, DDD hiện có)

- **Aggregate mới, bảng riêng**, chỉ tham chiếu `teacher_id` (FK) sang lõi — không sửa bảng lõi:
  - Module A: `ConnectionPost` (CPT) + `ConnectionInterest`; `TeacherPublicProfile` (TPP).
  - Module B: `Room` (ROOM) + `RoomBooking` (RBK).
- **Router riêng:** `routers/connect.py`, `routers/rooms.py`; handler riêng; không trộn logic lõi.
- **Feature flag + rollout theo vùng:** `MARKETPLACE_ENABLED` (env) + whitelist tỉnh/quận → bật cho **1 khu vực seed** trước, không bung toàn quốc.
- **Tách được:** vì không ghép bảng lõi, có thể tắt cờ là biến mất sạch, hoặc sau này tách thành service riêng nếu cần.

### 3.2 Mobile (React Native)

- **Cửa chính = 1 hub "Kết nối"** (KHÔNG nhét vào 5 tab quản lý: Hôm nay/Lớp/HS/Học phí/Báo cáo).
  - *Cân nhắc:* thêm tab thứ 6 làm chật thanh dưới cho GV lớn tuổi. Phương án nhẹ hơn: **1 thẻ "Kết nối" trên Home** mở ra màn hub riêng (ngăn 2 module A/B bằng segment). Chốt sau khi test.
- **Cửa phụ = nudge đúng ngữ cảnh ở Home** (đã định hướng):
  - Lớp đông / HS dư → gợi ý *"Giới thiệu bớt HS?"*
  - Báo nghỉ dài / kẹt lịch → *"Tìm người dạy thay?"*
  - Dạy tại nhà chật → *"Tìm phòng gần đây?"*
- Vẫn theo brand mẹ **Đôi Tay** (giúp đỡ/kết nối). Marketplace = mảng kế tiếp cùng mái nhà, không phá trải nghiệm lõi miễn phí.

---

## 4. Cold-start — chiến lược khởi động

1. **Chọn 1 ổ mật độ (geo-density):** 1 quận ở HN/HCM nơi GieoChữ đã có nhiều GV → seed ở đó, không rải mỏng toàn quốc.
2. **Single-player-first:** phát hành hồ sơ GV + "chỗ dạy của tôi" cho MỌI user trước (không cần chợ) → tích cung ngầm.
3. **Concierge / mai mối tay:** chủ app tự ghép kèo đầu qua admin + nhóm Zalo/FB GV → tạo giao dịch mẫu, lấy testimonial thật.
4. **Bơm cầu từ kênh sẵn có:** đăng nhu cầu vào 5 nhóm GV (theo [[marketing-system]]) để kéo về app.
5. Khi 1 khu vực có kèo đều → **nhân bản sang khu vực kế**.

---

## 5. Kiếm tiền (lõi vẫn miễn phí)

Lõi quản lý lớp **miễn phí mãi mãi** (đã cam kết). Marketplace là mảng **tách bạch**, có thể có phí mà không phá cam kết đó:

| Cách | Ưu | Nhược | Hợp GieoChữ? |
|------|-----|-------|--------------|
| Tin nổi bật (featured) | Không rào giao dịch; GV tự nguyện | Cần đủ traffic mới đáng | Khả thi sớm |
| Phí giới thiệu HS (lead) | Gắn với giá trị rõ | Khó thu, dễ lách ngoài app | Trung bình |
| Hoa hồng đặt phòng | Chuẩn marketplace | Cần giữ tiền/escrow → nặng | Giai đoạn sau |
| Badge xác minh trả phí | Nhẹ, tăng tin cậy | Doanh thu nhỏ | Bổ trợ |
| Quảng cáo | Thụ động | Phá trải nghiệm GV lớn tuổi | Hạn chế (đã bàn) |

→ **Đề xuất:** giai đoạn đầu **miễn phí hoàn toàn để tạo thanh khoản**; chỉ bật "tin nổi bật" + "badge xác minh" khi đã có lưu lượng thật. Hoa hồng/escrow để sau cùng.

---

## 6. Gate — khi nào mới bắt tay build

Chưa build tới khi có **đủ tín hiệu** (bám PMF/GTM [[marketing-gtm]]):

- [ ] ≥ một ngưỡng GV **đang hoạt động** trong CÙNG một quận (đủ mật độ để có kèo).
- [ ] Có **nhu cầu tự phát**: GV hỏi nhau "có ai dạy … gần đây không" trong nhóm / trong app.
- [ ] Lõi đạt **retention** ổn (GV quay lại quản lý lớp đều) — nền tảng giữ chân trước khi mở rộng.

**Trước khi build — validate rẻ (nên làm sớm, không tốn kỹ thuật):**
1. **Fake-door:** đặt nút/thẻ "Kết nối" (hoặc "Tìm dạy cùng" / "Tìm phòng") → đo tỉ lệ bấm, hiện "Sắp có, để lại quan tâm". Đo cầu thật bằng dữ liệu, không phải phán đoán.
2. **Poll trong nhóm GV:** hỏi thẳng 5 nhóm Zalo/FB về nhu cầu dạy cùng / thuê phòng + khoảng giá.
3. **Mai mối tay 5–10 kèo** hoàn toàn thủ công (không code) → xem có ai chốt thật không.

---

## 7. Bối cảnh thị trường VN (có nguồn, 07/2026)

### 7.0 Gió thuận chính sách — Thông tư 29/2024 (NỀN cho cả 2 module)

TT29/2024/TT-BGDĐT (hiệu lực 14/02/2025) **thay đổi căn bản** cách GV dạy thêm ngoài trường:

- **Bắt buộc đăng ký kinh doanh** (hộ kinh doanh, hoặc **kết hợp với trung tâm/cơ sở đã đăng ký**) và **phải có địa điểm/hợp đồng thuê mặt bằng** trong hồ sơ ([thuvienphapluat](https://thuvienphapluat.vn/phap-luat/ho-tro-phap-luat/bo-ho-so-dang-ky-kinh-doanh-day-them-2025-thu-tuc-dang-ky-kinh-doanh-day-them-2025-huong-dan-chi-ti-135773-200590.html), [Tuổi Trẻ](https://tuoitre.vn/thay-co-tat-bat-lo-dang-ky-kinh-doanh-day-them-20250213224551893.htm)).
- GV trường công **không được** đứng tên hộ KD dạy thêm → phải **hợp tác với cơ sở/GV có pháp nhân** ([thuvienphapluat](https://thuvienphapluat.vn/banan/tin-tuc/giao-vien-cong-lap-co-duoc-dang-ky-ho-kinh-doanh-day-them-theo-thong-tu-29-13655), [VietnamNet](https://vietnamnet.vn/giao-vien-tim-duong-hop-phap-hoa-day-them-truoc-khi-thong-tu-29-co-hieu-luc-2370709.html)).

> **Hệ quả định vị:** cả 2 module giải đúng pain do LUẬT tạo ra — (1) "cần kết hợp với GV/cơ sở có tư cách pháp nhân" ⇒ **Module A**; (2) "cần thuê địa điểm hợp lệ" ⇒ **Module B**. Định vị *"GieoChữ giúp bạn hợp pháp hoá việc dạy thêm"* **mạnh hơn nhiều** so với "kết nối cho vui".

### 7.1 Module A (GV↔GV) — có tín hiệu, CHƯA có bằng chứng định lượng

- **Kênh hiện tại = nhóm Facebook, chưa có app chuyên biệt.** Ví dụ nhóm "Tuyển giáo viên TP HCM" ~98.500 thành viên ([FB](https://www.facebook.com/tuyengiaovienhcm/)); nhiều nhóm tuyển gia sư >200k thành viên. Zalo chỉ dùng liên lạc GV–phụ huynh, **không** phải nơi sang lớp/dạy thay.
- **Tìm "sang nhượng lớp / dạy thay / ghép combo" → không ra nền tảng nào** → khoảng trống chưa ai làm (vừa là cơ hội, vừa là rủi ro "nhu cầu chưa được chứng thực").
- **Đối thủ/adjacent đều là B2C phụ huynh↔gia sư**, KHÔNG phải GV↔GV: **Tutoro** (Teky — gần đối tượng GV nhất), **Blacasa**, **Mteacher**, Kiến Guru...
- ⚠️ **Pain "ghép combo / dạy thay khi ốm bận": chưa tìm thấy nguồn định lượng** — là giả thuyết hợp lý nhưng phải **tự kiểm chứng** (phỏng vấn/khảo sát) trước khi xây.

### 7.2 Module B (phòng theo giờ) — thị trường ĐÃ có, chín hơn A

- **Cung dồi dào nhưng là B2B "trung tâm tự cho thuê"**, chưa phải marketplace P2P: VinaTrain, **Smart Train**, The Bib Space, NovaUp, Vplace...
- **Giá tham chiếu rõ:** phòng nhỏ **~50.000–60.000đ/giờ** ([VinaTrain](https://vinatrain.edu.vn/cho-thue-phong-hoc-theo-gio-tai-quan-1/)); phòng lớn/cao cấp **~360.000–450.000đ/giờ** ([Smart Train](https://smarttrain.edu.vn/bang-gia-cho-thue-phong-hoc-theo-gio-tai-tp-hcm-chi-tu-360-000/)). Thường sẵn máy chiếu/điều hoà/bảng/wifi.
- **Khoảng trống của GieoChữ KHÔNG phải tạo cung** mà là **lớp niềm tin + chuẩn hoá lịch/cọc/cách tính giờ** và khớp GV cá nhân ↔ phòng trống theo khu vực. 3 điểm ma sát chuẩn hoá được: **cọc giữ chỗ**, **trùng lịch**, **tính phí lố giờ**.

### 7.3 Playbook marketplace (lõi miễn phí)

- **Cold-start:** chọn 1 quận trước (geo-density) → seed **cung** trước → tận dụng **single-player mode** (lõi quản lý lớp miễn phí đã giữ GV) → **admin mai mối tay** trước khi tự động hoá → ưu tiên **thanh khoản + niềm tin trước scale** ([nfx](https://www.nfx.com/post/19-marketplace-tactics-for-overcoming-the-chicken-or-egg-problem), [Reforge](https://www.reforge.com/guides/beat-the-cold-start-problem-in-a-marketplace)).
- **Kiếm tiền:** ⚠️ **take rate cho GV↔GV gần như không thu được** (GV trao Zalo, giao dịch ngoài app ngay lần đầu) → dùng **tin nổi bật + subscription pro** cho A; **phí đặt chỗ/cọc qua app** cho B (giao dịch có mốc đo được) ([Sharetribe](https://www.sharetribe.com/academy/how-top-100-marketplaces-monetize/), [greenmoov](https://greenmoov.app/articles/en/service-fee-vs-commission-in-marketplaces-complete-comparison-proscons-and-2026-optimization-guide)).
- **Trust nhẹ:** Zalo OAuth (đã có) = xác minh nhẹ + **review 2 chiều "blind-reveal" chỉ sau giao dịch đã xác minh** + **cọc giữ chỗ** cho phòng + khiếu nại có bằng chứng. Không cần eKYC nặng ngay ([didit](https://didit.me/blog/two-sided-verification-marketplace-identity/), [TechVinta](https://techvinta.com/blog/marketplace-trust-and-safety-playbook)).

### 7.4 Năm điều rút ra cho GieoChữ

1. **Bám chính sách TT29 làm định vị** — "giúp hợp pháp hoá dạy thêm", không phải "kết nối cho vui".
2. **Module B (phòng) chín hơn A (GV↔GV)** — B có cung + giá + pain rõ; A mới có tín hiệu, phải kiểm chứng trước.
3. **Vũ khí chống cold-start = single-player mode** của lõi miễn phí (đối thủ marketplace không có).
4. **Đừng cược vào take rate cho A** — rò rỉ sẽ giết nó; A = featured + sub, B = phí đặt chỗ/cọc.
5. **Trust tối thiểu, nhẹ**, hợp GV không rành tech (Zalo OAuth + review blind-reveal + cọc).

> **Khoảng trống dữ liệu (không bịa số):** tỷ lệ GV dùng từng kênh thuê chỗ; định lượng nhu cầu ghép combo/dạy thay; tần suất sang lớp — **cần khảo sát chính tập user hiện có** trước khi cam kết xây.

---

## 8. Câu hỏi mở / rủi ro

- Tab thứ 6 hay thẻ trên Home cho hub "Kết nối"? (UX cho GV lớn tuổi)
- Bắt đầu vertical nào trước? → **Research nghiêng về B (phòng)**: thị trường + giá + pain đã rõ, dễ có giao dịch đo được (⇒ kiếm tiền được). **A (dạy cùng) làm sau**, và phải **validate demand trước** vì chưa có bằng chứng định lượng. *Vẫn nên chạy fake-door cả 2 để đo cầu thực trong tập user hiện tại.*
- Ẩn danh/địa chỉ tới mức nào để cân bằng tin cậy vs riêng tư?
- Giao dịch tiền (cọc phòng) — bao giờ mới cần giữ tiền thật, hay để deeplink Zalo + QR là đủ lâu?
- Rủi ro: kéo GV ra "chợ" quá sớm làm loãng trải nghiệm lõi + tăng gánh trust/safety khi chưa sẵn sàng.

---

*Liên quan: [[marketplace-roadmap]] · [[marketing-gtm]] · [[marketing-system]]*
