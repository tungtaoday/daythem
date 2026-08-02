# GieoChữ — Checklist lên App Store (iOS) + CH Play, song song marketing

> Ngày lập: 2026-07-26. Trạng thái sản phẩm: backend live, GATE 0 sự thật hoá xong,
> trang bắt buộc đã có (gieochu.vn/legal, gieochu.vn/delete-account, xoá tài khoản trong app).
> Nút thắt: quota EAS build reset **01/08**.

## Phát hiện quan trọng nhất về trình tự

- **CH Play (tài khoản cá nhân mới) BẮT BUỘC closed testing: 12 tester tham gia liên tục 14 ngày** trước khi được xin lên production → đây là đoạn dài nhất, phải bấm đồng hồ sớm nhất.
- **iOS KHÔNG có luật 14 ngày** → iOS có thể live TRƯỚC Android (~1 tuần sau khi build).
- **12 tester closed testing = chính 20–30 GV beta của GTM** → 2 việc là MỘT: tuyển beta vừa chạy GĐ 0 marketing vừa mở khoá Play production.

## Chi phí

| Khoản | Tiền | Ghi chú |
|---|---|---|
| Google Play Console | **$25 một lần** | Xác minh CCCD 1–3 ngày |
| Apple Developer Program | **$99/năm** | Đăng ký cá nhân, xác minh 1–2 ngày, KHÔNG cần máy Mac (EAS build cloud) |

## HƯỚNG DẪN ĐĂNG KÝ GOOGLE PLAY CONSOLE (chi tiết từng bước, 2026)

**Chuẩn bị trước (5 phút):**
- 1 tài khoản **Google (Gmail)** dùng riêng cho công ty (nên tạo mới, vd gieochu@gmail.com, đừng dùng Gmail cá nhân lẫn lộn).
- **CCCD** (hoặc hộ chiếu) — ảnh rõ 2 mặt. Có thể bị yêu cầu **chụp selfie** để đối chiếu.
- **Thẻ thanh toán quốc tế** (Visa/Mastercard, debit cũng được) trả phí $25. ⚠️ **TÊN trên thẻ/hồ sơ thanh toán phải KHỚP tên trên CCCD** — lệch tên là rớt xác minh.

**Các bước:**
1. Vào **play.google.com/console/signup**, đăng nhập bằng Gmail công ty.
2. Chọn loại tài khoản: **Cá nhân (Personal)** — không cần cho tổ chức (tổ chức cần mã D-U-N-S, rắc rối hơn).
3. Điền tên hợp pháp + địa chỉ đúng như trên CCCD. Đây thành **hồ sơ thanh toán Google (Google payments profile)** để xác minh danh tính.
4. Đồng ý **Developer Distribution Agreement**.
5. Trả **phí $25 một lần** bằng thẻ (tài khoản sống trọn đời, không phí năm như Apple).
6. **Xác minh danh tính:** tải ảnh CCCD (+ selfie nếu được hỏi). Google duyệt **vài giờ → 2 ngày làm việc**.
7. Xác minh xong → vào được Play Console, tạo app.

**Lưu ý 2026 (quan trọng):**
- Từ 2026 Google siết: **app của nhà phát triển CHƯA xác minh sẽ bị chặn cài trên máy Android** ở một số nước rồi lan rộng → xác minh danh tính là bắt buộc, làm sớm.
- Sau khi có tài khoản, tài khoản cá nhân MỚI vẫn phải qua **closed testing 12 tester × 14 ngày** rồi mới xin production (xem mục dưới). Đăng ký tài khoản ≠ được lên store ngay.
- **Làm NGAY tuần này** vì xác minh có thể mất tới 2 ngày, đừng đợi tới 01/08.

---

## HƯỚNG DẪN ĐĂNG KÝ APPLE DEVELOPER (chi tiết từng bước, 2026)

**Chuẩn bị trước (10 phút):**
- **Apple ID** đã **BẬT xác thực 2 lớp (2FA)** — bắt buộc, không bật thì không đăng ký được.
  Dùng Apple ID cá nhân của bạn (nếu chưa có: tạo ở appleid.apple.com rồi bật 2FA trong
  Settings → Sign-In and Security → Two-Factor Authentication).
- **Thẻ tín dụng quốc tế ĐỨNG TÊN CHÍNH BẠN** (Visa/Mastercard). ⚠️ Apple yêu cầu thẻ
  của chính người đăng ký — dùng thẻ người khác sẽ **bị chậm duyệt** và Apple đòi thêm
  **giấy tờ tuỳ thân có ảnh do nhà nước cấp** (CCCD/hộ chiếu). Tên trên thẻ phải khớp tên
  đăng ký.
- Đủ tuổi thành niên theo luật VN (18+).
- **KHÔNG cần máy Mac** — EAS build trên cloud.

**Các bước:**
1. Vào **developer.apple.com/programs/enroll** → *Start Your Enrollment*.
2. Đăng nhập Apple ID (sẽ hỏi mã 2FA gửi về máy).
3. Điền thông tin cá nhân **đúng như giấy tờ** (họ tên, địa chỉ, số điện thoại).
4. Chọn loại: **Individual / Sole Proprietor** — KHÔNG chọn Company/Organization
   (loại đó cần mã **D-U-N-S**, mất thêm 1–2 tuần chờ cấp, không cần cho giai đoạn này).
5. Đọc + đồng ý **Apple Developer Program License Agreement**.
6. Trả **$99 USD/năm** bằng thẻ. Giá hiển thị theo tiền tệ khu vực.
7. Chờ Apple xác minh — **thường 24–48 giờ**. Có thể được yêu cầu bổ sung giấy tờ.
8. Duyệt xong → vào được **App Store Connect** để tạo app.

**Khác biệt quan trọng so với CH Play (đọc kỹ để lên kế hoạch đúng):**

| | Google Play | Apple |
|---|---|---|
| Phí | **$25 một lần**, sống trọn đời | **$99/NĂM**, tự động gia hạn |
| Bắt buộc closed testing | **CÓ** — 12 tester × 14 ngày | **KHÔNG** |
| Thời gian tới khi live | ~3–4 tuần (do luật 14 ngày) | **~3–7 ngày** |
| Xác minh | CCCD + selfie | Thẻ đứng tên + có thể đòi giấy tờ |

→ **iOS lên store TRƯỚC Android** vì không vướng luật 12 tester. Đây là lý do nên đăng ký
Apple sớm ngang với Play.

**Lưu ý phí $99/năm:**
- **Tự động gia hạn** hằng năm trừ khi huỷ. Hết hạn mà không gia hạn → **app bị gỡ khỏi
  App Store**. Đặt nhắc lịch trước ngày hết hạn.
- Đây là chi phí cố định của việc có mặt trên iOS, không tránh được.

**Sau khi được duyệt (tôi làm giúp phần này):**
- Tạo app trên App Store Connect, upload bản build (`eas submit -p ios`)
- Điền mô tả, ảnh chụp màn hình (1290×2796 cho iPhone 6.7")
- Khai **Privacy Nutrition Labels** (khớp gieochu.vn/legal)
- Tạo **tài khoản demo cho reviewer** + ghi chú review (đăng nhập SĐT+mật khẩu, không cần OTP)
- App miễn phí nên **CHƯA cần** khai thông tin thuế/ngân hàng. Chỉ cần khi bán gói trả phí.

---

## TUẦN NAY (26–31/07) — làm được ngay, không cần build

### Việc CHỦ TÀI KHOẢN phải tự làm (cần thẻ + CCCD)
- [ ] Đăng ký **Google Play Console** (play.google.com/console, $25) → xác minh danh tính ngay
- [ ] Đăng ký **Apple Developer** (developer.apple.com, $99/năm, Apple ID cá nhân)
- [ ] (GTM) Nhắn riêng tuyển 20–30 GV beta từ quan hệ + 5 group — nói rõ "cần cô cài bản thử nghiệm CH Play và giữ trong 2 tuần"

### Việc chuẩn bị sẵn (Claude làm được)
- [ ] Bộ chữ store listing (VN): tên, mô tả ngắn 80 ký tự, mô tả dài 4000, từ khoá iOS
- [ ] Ảnh: icon 512×512 (có sẵn mascot), feature graphic Play 1024×500, screenshots
      (Play: ≥2 ảnh 1080×1920 · iOS: 1290×2796 cho 6.7") — chụp từ Metro web đúng kích cỡ
- [ ] Khai nháp **Data safety** (Play) + **Privacy Nutrition Labels** (iOS): thu SĐT/tên,
      dữ liệu HS do GV nhập, không bán dữ liệu, không tracking — khớp gieochu.vn/legal
- [ ] Tài khoản demo cho reviewer: 09xxx riêng + mật khẩu, có sẵn 1 lớp + HS mẫu
- [ ] Nội dung tuần 1 marketing (đã có marketing-week1-package.md — rà lại lần cuối)

## 01/08 — NGÀY BUILD (quota reset)

```bash
cd mobile
# 1. AAB cho Play (production profile — autoIncrement sẵn)
npx eas-cli build -p android --profile production
# 2. iOS build (EAS tự lo certificate — đăng nhập Apple khi được hỏi)
npx eas-cli build -p ios --profile production
# 3. APK preview cho GV cài trực tiếp (link tải trên landing, không chờ store)
npx eas-cli build -p android --profile preview
```

- [ ] Play Console: tạo app → upload AAB vào **Closed testing** → thêm email 12+ tester → gửi link opt-in cho GV beta
- [ ] App Store Connect: tạo app GieoChữ → `npx eas-cli submit -p ios` → điền metadata → **Submit for Review** (kèm tài khoản demo + ghi chú: đăng nhập bằng SĐT+mật khẩu, không cần OTP)
- [ ] Landing: thay link APK cũ bằng bản mới

## 02–15/08 — SONG SONG: closed testing (Play) + beta GTM + iOS live

| Ngày | Store | Marketing (GĐ 0 beta) |
|---|---|---|
| 02–04/08 | iOS review (1–3 ngày) → **iOS LIVE** | Kèm tay từng cô qua Zalo tới "aha" đầu (tick thu phí / gửi thiệp / nhắc Zalo) |
| 05–08/08 | Theo dõi crash/ANR trong Play Console | Sửa nhanh theo phản hồi; đo dashboard /admin/activation hàng tuần |
| 08–15/08 | Giữ đủ **12 tester opt-in liên tục** (nhắc ai gỡ app) | Gom testimonial + video màn hình thật; ai khen thì xin phép trích đăng |
| 15/08 | Đủ 14 ngày → **Apply for production** trong Play Console | Chuẩn bị bài đăng group đợt 1 (giá trị trước, app cuối bài) |
| 17–20/08 | Play review → **CH PLAY LIVE** | **Bung kênh 0đ**: 5 group + nội dung pháp lý/thuế + TikTok đầu tiên, CTA = link 2 store |

## Sau khi cả 2 store live (cuối tháng 8)

- [ ] Landing đổi nút: badge App Store + Google Play thật (giờ mới được phép để badge)
- [ ] Build referral "Mời đồng nghiệp" (link/QR Zalo) — đặt sau khoảnh khắc gửi thiệp
- [ ] Lập Zalo OA hỗ trợ; xem xét eSMS cho OTP tự phục vụ
- [ ] KPI: activation ≥60% (beta có kèm tay), Retention W4, K-factor

## Rủi ro & cách né

| Rủi ro | Né bằng |
|---|---|
| Play: tuột dưới 12 tester giữa chừng → đồng hồ 14 ngày reset | Tuyển 18–20 tester (dư 50%), nhắn nhắc giữ app |
| Apple từ chối vì reviewer không đăng nhập được | Tài khoản demo tạo sẵn dữ liệu + ghi chú review kỹ; KHÔNG dùng số cá nhân |
| Apple hỏi quyền dữ liệu trẻ em | App là công cụ của GV, không cho trẻ dùng, khai đúng "Education / target: adults" |
| Xác minh danh tính Play/Apple kéo dài | Đăng ký NGAY tuần này, đừng đợi 01/08 |
| iOS build cần trả lời câu hỏi encryption | ITSAppUsesNonExemptEncryption=false (chỉ HTTPS) — thêm vào app.json trước build |
