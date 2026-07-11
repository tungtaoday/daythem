# GieoChữ — Nghiên cứu Go-To-Market (VN & Thế giới) + Lộ trình theo từng tháng

> Báo cáo tổng hợp từ deep-research (fan-out search → fetch → verify đối kháng). **89 claim** trích từ ~24 nguồn; 17 claim qua kiểm chứng 3-phiếu, **0 bị bác**. Ngày: 2026-07-11.
> Sản phẩm: GieoChữ — app quản lý lớp dạy thêm cho **giáo viên cá nhân** (điểm danh, thu học phí, báo cáo phụ huynh, nhắc Zalo, thuế HKD; freemium, mobile-first). Bối cảnh: backend live, APK Android đã build, giai đoạn **beta**.
> Liên quan: [[marketing-gtm]], `marketing-system-plan.md`, `wow-features-implementation-plan.md` (đòn bẩy sản phẩm — Mục 6.5). Nguồn liệt kê ở Mục 9.

---

## 1. Tóm tắt điều hành — "Playbook" lặp lại ở các case thành công

Ba trụ chung của mọi case teacher-tool thắng lớn (ClassDojo toàn cầu, Azota tại VN):

1. **Nghe giáo viên TRƯỚC khi build, rồi để giáo viên tự lan truyền.** ClassDojo: founder gặp *hàng trăm* GV trong 1 tháng trước khi viết dòng code đầu; duy trì vòng phản hồi với 20.000 GV. Kết quả: **35.000 lớp trong 12 tuần**, *0 đồng quảng cáo*.
2. **Community-led + word-of-mouth là kênh chính, không phải ads.** ClassDojo lên ~90% trường Mỹ, 51–55M user, ~$150M ARR — 100% organic. Azota: **700.000+ GV trong <1 năm**, cộng đồng GV lớn nhất VN (300.000 thành viên), tăng trưởng bằng *chất lượng sản phẩm + cộng đồng*, không phải ad spend.
3. **Free thật sự hữu ích + kiếm tiền sau.** ClassDojo giữ core free ~7 năm, chỉ thu phí gói phụ huynh (2019), có lãi sau 4 tháng. Freemium chỉ thắng khi **gói free đủ ngon để GV tự giới thiệu** — không phải bản cắt xén.

**Đòn bẩy riêng của VN lúc này:** Thông tư 29/2024 (hiệu lực 14/02/2025) buộc GV dạy thêm ngoài trường **đăng ký hộ kinh doanh** → GV "chật vật" với thủ tục/thuế → **nội dung pháp lý/thuế = mồi organic mạnh nhất** để hút đúng tệp, gần như 0đ.

**Khác biệt then chốt của GieoChữ so với case thất bại:** nhiều edtech chết vì "GV dùng nhưng người trả tiền là trường/administrator" (buyer≠user). GieoChữ **giáo viên cá nhân vừa là người dùng vừa là người trả** → tránh được bẫy kinh điển đó, nhưng đổi lại tệp **rất nhạy giá** → freemium bắt buộc.

---

## 2. Case Thế giới

### 2.1 ClassDojo — north star cho teacher-led GTM
| Yếu tố | Dữ kiện (verified) |
|--------|--------------------|
| Khởi động | Seeded qua accelerator Imagine K12 ($20k). Founder gặp hàng trăm GV/1 tháng trước khi build |
| Kênh | **Chỉ** teacher-to-teacher WOM. Chiến thuật: tìm 1 GV "power-user" nhiệt huyết/trường → kết nối chéo qua cộng đồng Facebook |
| Tốc độ | ~10.000 GV lúc YC demo day; **35.000 lớp trong 12 tuần**; pandemic 2020: +3 user/giây, signup ×10 |
| Kiếm tiền | Core free ~7 năm; gói phụ huynh (Beyond School) 2019 → **lãi sau 4 tháng**, doanh thu gần ×3 năm 2020 |
| Quy mô | 51–55M user, 180 nước, ~90–95% trường pre-K-8 Mỹ, ~$150M ARR (2025) |
| Vì sao chọn GV | GV *underserved + ít ngân sách* — đặt cược vào nỗi đau chưa ai giải, không phải người giữ ngân sách |

### 2.2 Đối thủ trực tiếp — tutoring management SaaS
| Sản phẩm | Tệp | Giá / Trial | GTM |
|----------|-----|-------------|-----|
| **TutorBird** | Gia sư cá nhân / trung tâm nhỏ (đúng tệp GieoChữ) | £13.95/$16.95/th + $4.95/tutor thêm; **trial 30 ngày dài** | Công cụ admin đơn giản, giá thấp cho solo |
| **TutorCruncher** | Agency nhiều gia sư (tier khác) | Trial 2 tuần | **Referral có thưởng** (buổi học free/giảm giá) là đòn bẩy chính; organic = đối tác trường/địa phương, SEO, forum |

Bài học: **trial dài (30 ngày)** hợp tệp solo (cần thời gian thấy giá trị theo nhịp tháng); **referral có thưởng** + **xin review đúng lúc GV hài lòng** (FB/Google) là chiến thuật rẻ.

### 2.3 Benchmark PLG/SaaS (dùng làm mốc số cho lộ trình)
- **Pre-launch 8–16 tuần**, phễu bậc thang: tuần 1–4 → 50–150 signup (mạng lưới quen), tuần 5–8 → 500–800 (content 2–3 kênh), tuần 9–12 → **1.000+**.
- **Đừng chạy ads tới khi landing page convert >25%.**
- Email mạng lưới quen convert **30–60%** (vs 5–10% mass).
- **Activation là sinh tử:** 98% user SaaS churn trong 2 tuần nếu chưa thấy giá trị; PLG: không activate trong **24h → 90% không quay lại**. Mục tiêu activation **40–60%** (top 70%+), time-to-value <10 phút. Đăng ký <60s bằng SSO (≈ **Zalo 1-chạm** của GieoChữ).
- **Freemium free→paid 2–5%** (top 5–10%).
- **K-factor** >1 = viral thật; 0.5–1.0 = tốt. Referral 2–5% (cơ bản) → 15–30% (có tính cộng tác). Loop cần link riêng, đếm vị trí, leaderboard, thưởng mốc; nhắm 20–40% share, 10–25% click→signup.
- **CAC payback 6–12 tháng** (top 3–6); CLV:CAC ≥3:1 (5:1 xuất sắc). Churn năm <5% tốt, <3% xuất sắc; NRR 100–110% (top >130%).
- **Dấu hiệu PMF:** 10 khách trả tiền hợp ICP *ở lại + giới thiệu*; sớm hơn: 10 visitor organic, 10 từ khóa non-brand, 10 testimonial, 10 khách từ referral.
- Beta mềm: ~**50 khách chủ chốt**, ~1 tuần trước public, cửa sổ test ~3 ngày.

---

## 3. Case Việt Nam — Azota (bằng chứng nội địa mạnh nhất)

Azota (chấm bài/đề thi online cho GV) là bản mẫu gần nhất cho "teacher-led tại VN":
- Ra mắt **giữa 2021** (đúng sóng học online mùa dịch).
- **<1 năm: 700.000+ GV, 10 triệu học sinh.** Đỉnh ~6 triệu user/tháng (~**30% toàn bộ GV+HS Việt Nam**), xử lý 300 triệu bài.
- Xây **cộng đồng GV lớn nhất VN: 300.000 thành viên active**; tăng trưởng bằng **chất lượng + cộng đồng**, không phải quảng cáo nặng.
- VP lõi = **tiết kiệm thời gian**: chấm 2 tiếng → 2 phút, tự động 99%.
- Gọi vốn **$2.4M Pre-Series A** (GGV Capital dẫn, Do Ventures + Nextrans), 7/2022.

**3 bài học Azota cho GieoChữ:** (1) VP phải là **tiết kiệm thời gian/công đo được ngay** (GieoChữ: "thu học phí không sót ai", "báo cáo 1 chạm"); (2) **cộng đồng GV là tài sản tăng trưởng** — lập sớm; (3) bám **sóng thời điểm** (Azota cưỡi sóng dịch; GieoChữ cưỡi sóng **TT29 + thuế 2026**).

---

## 4. Sai lầm GTM khiến edtech cho GV thất bại (né các bẫy này)

| Bẫy | Hệ quả | Cách GieoChữ né |
|-----|--------|-----------------|
| Edtech "chín chậm" (5–10 năm) | Founder bỏ cuộc sớm | Đặt kỳ vọng đúng; ưu tiên organic rẻ để trụ lâu |
| Bỏ bê onboarding/đào tạo | Mất tệp ngay cửa | Onboarding 3 bước + "aha" trong 24h (tạo lớp → thu phí/gửi báo cáo) |
| Freemium cắt xén | Không ai ở lại/giới thiệu | **Free đủ ngon** (1 lớp + tính năng lõi thật sự dùng được) |
| Không khác biệt | Chìm giữa đám đông | Ngách sâu: **GV cá nhân mobile-first + Zalo + thuế HKD** (MISA/EasyPOS làm content nhưng nhắm hộ KD chung) |
| High download / low conversion | Đốt tiền vô ích | Đo **activation/retention** trước khi mở rộng; đừng dùng ads để bù user churn |
| Buyer≠user (bán cho trường) | GV thích nhưng không có quyền chi | GieoChữ bán thẳng GV cá nhân — tránh được, nhưng phải **freemium vì nhạy giá** |
| SEA tutoring: **LTV < CAC** (vd $96 LTV vs $200 CAC, churn năm >50%) | Chết vì kinh tế đơn vị | Giữ CAC ~0 (organic), tối ưu retention theo nhịp tháng (thu phí/báo cáo) trước khi nghĩ tới ads |

---

## 5. Đòn bẩy VN: nội dung Pháp lý/Thuế (Thông tư 29)

**Vì sao mạnh:** GV "chật vật" với đăng ký kinh doanh + thuế (báo chí chính thống xác nhận) → nội dung hướng dẫn = lead magnet đúng nỗi đau, gần 0đ. Chính MISA/EasyPOS/ACMan đã dùng từ khóa "hộ kinh doanh dạy thêm 2026" hút traffic → **chiến trường có thật**; GieoChữ thắng bằng **chiều sâu + mobile-first cho GV cá nhân**.

**Dữ kiện dùng làm content (verified):**
- TT29/2024 hiệu lực **14/02/2025**: dạy thêm ngoài trường phải **đăng ký kinh doanh** (thường là hộ kinh doanh).
- Đăng ký: **mã ngành 8559**, phí ~**100.000đ**, xong trong **3 ngày làm việc**, mỗi người chỉ **1 hộ kinh doanh** toàn quốc.
- **GV công lập KHÔNG được tự đứng tên/điều hành** hộ KD dạy thêm → phải qua trung tâm (mất ~30% hoa hồng). *(→ phân khúc content: GV tự do vs GV công lập)*
- Dạy học **miễn VAT** (theo luật giáo dục). **Lệ phí môn bài bỏ từ 2026.**
- Chưa đăng ký mà dạy có thu tiền: phạt **5–10 triệu** (cá nhân), 50–100 triệu (tổ chức). *(→ đòn bẩy khẩn cấp, nhưng tone GieoChữ = GIÚP, không hù dọa)*
- Từ **1/6/2025**: hộ KD doanh thu **≥1 tỷ/năm** phải dùng hóa đơn điện tử máy tính tiền; dưới ngưỡng thì không.

> ⚠️ **CẢNH BÁO NGƯỠNG THUẾ — các nguồn MÂU THUẪN, PHẢI xác minh trước khi đăng:**
> nguồn nêu **≤100tr** (ngưỡng cũ, miễn thuế), **≤500tr** (một số nguồn 2025–2026), và **≤1 tỷ/năm** (2026, khớp memory nội bộ [[marketing-gtm]] — Nghị định 141/2026). Thuế suất phần vượt ~**2% doanh thu** (khi không xác định được chi phí).
> → Đây đúng là lý do có **cổng `legal_tax_safety`** trong eval harness. **Mọi bài thuế/pháp lý phải dẫn nguồn chính thống hiện hành, KHÔNG khẳng định tuyệt đối.**

---

## 6. 🎯 LỘ TRÌNH GTM CHO GIEOCHỮ — THEO TỪNG THÁNG (Tháng 0 → 18)

Bối cảnh riêng: backend live, APK Android sẵn, beta. Bám **lịch năm học VN** (đầu năm học Tháng 8–9, trước thi Tháng 4–6, hè luyện thi) và **sóng thuế đầu năm**. Ngân sách gần 0đ giai đoạn đầu (theo case thắng).

### GĐ 0 — NỀN MÓNG (Tháng 0–1)
| Tháng | Mục tiêu | Việc chính | KPI cổng |
|-------|----------|-----------|----------|
| **0** | Nghe & chuẩn bị (kiểu ClassDojo) | Phỏng vấn 30–50 GV dạy thêm (đau thật về thu phí/báo cáo/thuế). Dựng landing + waitlist. Lập Zalo OA + 1 Fanpage. Chuẩn bị 10 lead magnet (mẫu báo cáo phụ huynh, checklist đăng ký HKD, bảng ước tính thuế). Cài referral trong app (link Zalo 1 chạm). | 30–50 phỏng vấn; landing convert >25% trước khi tính ads |
| **1** | 20–50 GV beta | Tuyển beta từ vài FB group GV + người quen. Cài APK. Ép "aha" trong 24h (tạo lớp → tick thu phí / gửi báo cáo / nhắc Zalo). **Ship wow (Mục 6.5): Zalo 1-chạm + dán cả lớp (nâng activation), thiệp báo cáo phụ huynh (mồi WOM).** Thu **testimonial + video thật**. | ≥20 GV dùng đều; activation 24h ≥40%; ≥5 testimonial |

### GĐ 1 — RA MẮT MỀM, ORGANIC (Tháng 2–6)
| Tháng | Mục tiêu | Việc chính | KPI cổng |
|-------|----------|-----------|----------|
| **2** | Kích hoạt content wedge | Chạy đều 4 pillar (pháp lý TT29 / thuế / vận hành lớp / demo). Vào 5 FB group GV, đăng **tay** (đúng nguyên tắc manual-only), cho giá trị trước. Zalo OA broadcast mẹo. | 500–800 signup tích lũy; retention W1 ≥ nhóm beta |
| **3** | Vòng referral chạy | Bật "Mời đồng nghiệp" sau khoảnh khắc aha (vừa gửi báo cáo → mời). Thưởng 2 chiều. Xin review đúng lúc GV hài lòng. | **1.000+ signup**; K-factor ≥0.3; ≥10 khách từ referral |
| **4** | Mở rộng cộng đồng (kiểu Azota) | Lập **group GV riêng của GieoChữ** (hạt giống cộng đồng). Micro-KOL là GV (1–3 người). SEO bài pháp lý/thuế (từ khóa ý định cao). | Group ≥300–500 thành viên; 10 từ khóa non-brand xếp hạng |
| **5** | Đo & vá phễu | Tối ưu onboarding tới activation ≥50%. Đo retention W4 (app dùng theo nhịp tháng). Extract pattern content nào hiệu quả. | Activation ≥50%; retention W4 đo được & tăng |
| **6** | **Cổng PMF** | Xác nhận 10 khách trả tiền hợp ICP *ở lại + giới thiệu* → dấu hiệu PMF. Chốt gói giá "ly cà phê" (30–69k). | **PMF signal đạt** → mới tính scale/ads |

### GĐ 2 — MỞ RỘNG (Tháng 7–12)
| Tháng | Mục tiêu | Việc chính | KPI cổng |
|-------|----------|-----------|----------|
| **7–8** | Cưỡi sóng đầu năm học | Dồn content mùa tựu trường (nhu cầu quản lớp tăng). Thêm **TikTok** đều (video pháp lý/thuế/mẹo dễ lan). | Signup tăng theo mùa; free→paid ≥2% |
| **9–10** | Thử paid CÓ KIỂM SOÁT | Vì landing đã >25% convert & có PMF → thử **FB/Zalo ads ngân sách nhỏ**, đo **CAC theo kênh**. Đối tác dịch vụ HKD/kế toán. | CAC < LTV; CAC payback <12 th; CLV:CAC ≥3:1 |
| **11–12** | Nhân đôi kênh thắng | Dồn tiền vào kênh CAC tốt nhất. Tối ưu referral coefficient. Ra iOS nếu có cầu. | Churn năm <5%; NRR ≥100%; K-factor tiến gần 0.5–1.0 |

### GĐ 3 — TĂNG TỐC (Tháng 13–18)
| Tháng | Mục tiêu | Việc chính | KPI cổng |
|-------|----------|-----------|----------|
| **13–15** | Cưỡi sóng thuế + trước thi | Content kê khai thuế đầu năm + mùa luyện thi (Apr–Jun). Tính năng ước tính thuế/ngưỡng thành lợi thế. | Retention giữ; free→paid tiến 5% |
| **16–18** | Hệ thống hoá tăng trưởng | Chuẩn hoá playbook nội dung (đã có agent system). Mở rộng micro-KOL/đối tác. Cân nhắc gói năm. | CAC payback top 3–6 th; cộng đồng tự tăng |

**3 kênh khởi động trọng tâm (bám GTM đã chốt):** (1) FB groups GV — đăng tay, (2) Referral trong app qua Zalo, (3) Nội dung pháp lý/thuế (SEO + TikTok). Tất cả gần 0đ. **Ads chỉ vào từ Tháng 9–10, sau PMF.**

---

## 6.5 — Đòn bẩy SẢN PHẨM (product-led wow) gắn thẳng vào phễu

Mục 6 là **kênh** (content/community/referral). Nhưng activation, K-factor, retention chỉ nhấc được khi **bản thân sản phẩm** có khoảnh khắc wow — kênh tốt mấy mà app không tạo được activation/viral thì vẫn rơi khách. Bộ wow-features (chi tiết `wow-features-implementation-plan.md`) map thẳng vào từng tầng phễu, **ship trong GĐ 0–1** vì các KPI cổng phụ thuộc vào chúng:

| Wow feature | Tầng phễu | KPI nó nhấc | Ship |
|-------------|-----------|-------------|------|
| ⭐ **Zalo 1-chạm** (mở đúng chat, tin sẵn) | Activation + dùng hằng ngày + **kênh mời** | Activation 24h; "SSO <60s" (Mục 47) | GĐ 0–1 |
| ⭐ **Thiệp báo cáo phụ huynh** (ảnh có brand) | **Viral: phụ huynh → WOM** | K-factor (đúng loop ClassDojo) | GĐ 1 (T2–3) |
| **Dán cả lớp** (nhập nhanh) | Activation (time-to-value) | Activation 24h; TTV <10' | GĐ 0–1 |
| **Chốt sổ cuối tháng** (Wrapped mini) | Retention | Retention W4 (thói quen tháng) | GĐ 1 |
| ✔ **Trợ lý cảnh báo bỏ học + đếm chưa nộp** (LIVE) | Retention + lõi VP | Retention; VP "app nghĩ hộ" | Đã có |

**Vì sao thuộc GTM chứ không chỉ backlog eng:**
- Báo cáo đặt *activation là sinh tử* (Mục 47, 141) → **"Dán cả lớp" + "Zalo 1-chạm"** là 2 đòn trực tiếp nâng activation 24h (nơi 98% user rơi).
- Referral cần *yếu tố cộng tác* (Mục 49) → **"Thiệp phụ huynh"** biến mỗi báo cáo thành 1 điểm chạm brand tới phụ huynh = **động cơ K-factor thật** (giống ClassDojo kiếm tăng trưởng từ phía phụ huynh), mạnh hơn nút "Mời đồng nghiệp" đơn thuần.
- **Trợ lý cảnh báo bỏ học** = khác biệt lõi để content/demo có cái "khoe" (đối thủ chỉ ghi sổ thụ động).

> ⚠️ **Ranh giới trung thực (để content/landing không hứa vống):** "Zalo 1-chạm" = *mở đúng chat + tin đã sẵn để dán*, **KHÔNG** phải tự-gửi. Auto-gửi (ZNS) cần Zalo OA/API mà dự án **không có → bỏ hẳn**. Marketing dừng đúng mức "mở sẵn chat, dán 1 chạm".

---

## 7. KPI & ngưỡng cảnh báo (áp cho GieoChữ)

| Chỉ số | Mốc tốt | Cảnh báo → hành động |
|--------|---------|----------------------|
| Activation 24h | 40–60% (top 70%+) | <40% → đơn giản hoá onboarding NGAY (đừng làm gì khác) |
| Retention W1 / W4 | Tăng dần theo cohort | W4 rơi → app chưa thành thói quen tháng, sửa nhắc nhở/nhịp thu phí |
| Free→Paid | 2–5% (top 5–10%) | <2% → gói paid chưa đủ "đỡ việc"; đừng chặn tính năng lõi |
| K-factor | 0.5–1.0 (>1 viral) | <0.3 → sửa vòng mời (đặt đúng lúc aha, thưởng rõ) |
| CAC payback | 6–12 th (top 3–6) | >12 th hoặc CAC>LTV → TẮT ads, quay lại organic |
| Landing convert | >25% trước khi chạy ads | <25% → chưa được chạy paid |
| Churn năm | <5% (xuất sắc <3%) | >50% (như SEA tutoring) = tử huyệt → dừng scale |

---

## 8. Kết luận & khuyến nghị gọn

1. **Sao chép ClassDojo/Azota, không sao chép ads-heavy edtech.** Teacher-led + community + free-đủ-ngon. GieoChữ có lợi thế buyer=user (GV tự trả) nhưng phải freemium vì nhạy giá.
2. **Cưỡi sóng TT29 + thuế 2026** như Azota cưỡi sóng dịch — đây là "thiên thời" chỉ có lúc này. Content pháp lý/thuế là mồi organic rẻ nhất, đúng tệp.
3. **Không chạy ads tới sau PMF (≈Tháng 9)** và tới khi landing >25% + CAC<LTV. SEA tutoring chết vì đốt ads bù churn.
4. **Đo activation 24h như chỉ số sinh tử.** Đây là nơi 98% user rơi.
5. **Nội dung thuế/pháp lý PHẢI qua cổng `legal_tax_safety`** — nguồn ngưỡng thuế đang mâu thuẫn (100tr/500tr/1 tỷ), xác minh official trước khi đăng.
6. **Sản phẩm phải TỰ tạo activation & viral, không chỉ trông vào kênh** (Mục 6.5). Ship sớm bộ wow: **"Zalo 1-chạm" + "dán cả lớp"** (nâng activation 24h — nơi 98% rơi) và **"thiệp báo cáo phụ huynh"** (động cơ K-factor kiểu ClassDojo). Trung thực về giới hạn Zalo (deep-link, không tự-gửi). Chi tiết: `wow-features-implementation-plan.md`.

---

## 9. Nguồn (đã fetch/verify)

**Quốc tế — teacher-led/PLG:** First Round Review (ClassDojo, Sam Chaudhary) · Forbes 2017 (ClassDojo 35k lớp/12 tuần) · PR Newswire (ClassDojo 51M, lãi) · businessmodelcanvastemplate.com (bottom-up vs district) · Medium/Bootcamp (freemium funnel) · Gilion (K-factor).
**Benchmark GTM/PLG:** Aimers (0→$10M ARR 24 tháng) · LaunchList (0→1.000 beta 90 ngày) · ProductLed.org (PLG metrics) · Appcues (activation→MRR) · DesignRevision · Taqwah.
**Tutoring SaaS:** TutorBird & TutorCruncher (pricing/trial/referral) · Pertama Ventures (SEA tutoring fail, CAC/LTV/churn).
**Edtech fail:** giansegato.com · 1000.software · appinventiv.com · lmsportals.com · ongraph.com.
**VN pháp lý/thuế:** Báo Đại biểu Nhân dân (TT29 "chật vật") · Thư Viện Pháp Luật (thuế 2026, GV công lập) · EasyPOS · ACMan · MISA eShop.
**VN edtech:** Azota (thông cáo gọi vốn 2022 — GGV/Do Ventures/Nextrans; số liệu 700k GV, 6M MAU).

> *89 claim trích từ journal deep-research (wf_240f2b78-210); 17 claim qua verify 3-phiếu đối kháng, 0 bị bác. Một số nguồn benchmark là blog ngành (chất lượng "blog") — dùng làm mốc tham khảo, không phải chân lý tuyệt đối. Ngưỡng thuế VN có mâu thuẫn giữa nguồn → cần xác minh official.*
