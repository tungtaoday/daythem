# GieoChữ — Lập Zalo OA & bật ZNS (hướng dẫn thực thi)

> Ngày lập: 2026-08-02. Bối cảnh: đã có **giấy tờ hộ kinh doanh** → đủ điều kiện xác thực OA.
> Mục tiêu chính: **OTP tự phục vụ** (xoá hàng chờ reset mật khẩu thủ công) + kênh hỗ trợ GV.
>
> ⚠️ **Dữ liệu dễ đổi:** giá ZNS, quy trình duyệt, phí xác thực — Zalo cập nhật thường xuyên.
> Số trong tài liệu này lấy từ [zalo-miniapp-assessment.md](zalo-miniapp-assessment.md)
> (tra 2026-07). **Verify lại tại nguồn chính thức trước khi quyết chi tiền.**

---

## 0. Trước hết — OA này dùng để làm gì, và KHÔNG dùng để làm gì

Đọc kỹ mục này, vì hiểu sai chỗ này là đi ngược lại điều đã khai với App Store và CH Play.

| ✅ OA dùng để | ❌ OA KHÔNG dùng để |
|---|---|
| **GieoChữ → giáo viên**: gửi OTP đăng nhập / đặt lại mật khẩu | **Giáo viên → phụ huynh**: vẫn là *soạn sẵn, thầy cô tự bấm gửi* |
| Nhắc GV việc quan trọng (giao dịch, không quảng cáo) | Tự động nhắn học phí cho phụ huynh thay GV |
| Kênh hỗ trợ 1-1 khi GV chủ động nhắn OA | Gửi tin quảng cáo/marketing — **ZNS cấm** |

**Vì sao phải giữ ranh giới này:** trong ghi chú review gửi hai store, ta đã khai
*"app CHỈ soạn sẵn nội dung rồi mở Zalo để giáo viên tự gửi — app không tự động gửi tin cho ai"*
(xem [store-listing-copy.md](store-listing-copy.md) mục 8). Có OA rồi cũng **không được**
đổi hành vi đó nếu chưa khai báo lại với store.

Ngoài ra [wow-features-implementation-plan.md](wow-features-implementation-plan.md) đã
**chốt bỏ** phương án ZNS auto-gửi cho phụ huynh. Tài liệu này **không mở lại** quyết định đó —
chỉ mở đúng một đường mới: **ZNS gửi OTP cho chính giáo viên**.

---

## 1. Chọn loại OA

Vào **oa.zalo.me** → *Tạo Official Account*. Có 3 nhóm:

| Loại | Chọn không | Vì sao |
|---|---|---|
| **Doanh nghiệp** | ✅ **CHỌN CÁI NÀY** | Đúng bản chất (sản phẩm phần mềm có thu phí sau này), và **chỉ loại này mới bật được ZNS** |
| Nội dung | ❌ | Dành cho báo/blog/kênh nội dung, không gửi được ZNS giao dịch |
| Cơ quan nhà nước | ❌ | Không đúng đối tượng |

**Tên OA nên đặt:** `GieoChữ` (khớp tên app trên store). Đừng đặt tên khác nhau giữa
app và OA — GV nhận OTP từ tên lạ sẽ nghi ngờ, mà xác thực cũng dễ bị soi.

---

## 2. Hồ sơ cần chuẩn bị

- **Giấy phép kinh doanh hộ kinh doanh** (bản chụp/scan rõ, đủ 4 góc)
- **CCCD người đại diện** — 2 mặt, ảnh rõ, **tên phải khớp** tên trên GPKD
- **Số điện thoại** đang dùng Zalo (dùng để tạo và quản trị OA)
- **Ảnh** — đã sinh sẵn, xem mục 2c
- **Bộ chữ** — viết sẵn ở mục 2b dưới đây

> **Lưu ý:** Zalo **có hỗ trợ hộ kinh doanh**, không bắt buộc phải là công ty TNHH/CP.

---

## 2b. BỘ CHỮ ĐIỀN VÀO OA — copy thẳng

> Tuân thủ luật cứng đã chốt cho store ([store-listing-copy.md](store-listing-copy.md) mục 10):
> **không bịa số**, Zalo là *soạn sẵn → tự gửi*, thuế là *tính + tờ khai tham khảo*,
> đăng nhập là *SĐT + mật khẩu*.

### Tên & phân loại

| Trường | Điền |
|---|---|
| Tên OA | `GieoChữ` |
| Danh mục | **Giáo dục** (nếu buộc chọn cấp 2: *Công nghệ giáo dục / Phần mềm*) |
| Loại OA | **Doanh nghiệp** |

### Mô tả ngắn (ô giới thiệu ngắn / slogan)

```
Trợ lý lớp dạy thêm: điểm danh, học phí, báo cáo phụ huynh.
```

### Giới thiệu đầy đủ (ô "Giới thiệu" / About của OA)

```
GieoChữ là ứng dụng quản lý lớp dạy thêm, làm cho thầy cô dạy tại nhà.

App gom điểm danh, học phí và báo cáo phụ huynh vào một chỗ — thay cho sổ tay
và tin nhắn rải rác. Tiếng Việt toàn bộ, mở lên là dùng được.

Có gì trong app:
• Điểm danh một chạm — cả lớp mặc định có mặt, ai vắng chạm một cái, ghi được lý do
• Thu học phí theo tháng, theo buổi hoặc theo khoá; đặt được giá riêng từng em
• Nhắc học phí tế nhị — app soạn sẵn tin có tên con và số tiền, thầy cô mở Zalo
  gửi riêng cho từng phụ huynh
• Thiệp báo cáo riêng từng bé — số buổi học, chuyên cần và lời nhắn của thầy cô
• Lịch dạy cả tháng, báo nghỉ, xếp lịch học bù
• Tính thuế thu nhập từ dạy thêm và tạo tờ khai 09/KK-TNCN để thầy cô tham khảo

Đăng nhập bằng số điện thoại và mật khẩu, không cần email. Không quảng cáo.

GieoChữ đang trong giai đoạn dùng thử miễn phí. Thầy cô góp ý điều gì, chúng tôi
sửa và cập nhật thường xuyên.

Website: gieochu.vn
Chính sách bảo mật: gieochu.vn/legal
```

### Thông tin liên hệ (OA Manager → Thông tin)

| Trường | Điền |
|---|---|
| Website | `https://gieochu.vn` |
| Địa chỉ | *(đúng như trên GPKD — phải khớp, lệch là rớt xác thực)* |
| Số điện thoại | *(số anh dùng để hỗ trợ)* |
| Email | *(điền email hỗ trợ đang dùng cho store)* |

### Tin chào mừng (gửi tự động khi GV bấm Quan tâm)

```
Chào thầy cô 🌿

Đây là kênh chính thức của GieoChữ — app quản lý lớp dạy thêm.

Thầy cô nhắn thẳng vào đây nếu cần:
• Hướng dẫn dùng app
• Đặt lại mật khẩu
• Góp ý hoặc báo lỗi

Chúng tôi đọc và trả lời trong giờ hành chính.
Tải app và xem hướng dẫn: gieochu.vn
```

### ⛔ Không được viết trong phần giới thiệu OA

Giống hệt luật cứng của store — sai chỗ này vừa mất niềm tin vừa dễ bị soi khi xác thực:

| Cấm | Vì sao |
|---|---|
| "Đăng nhập bằng Zalo" | App dùng **SĐT + mật khẩu** |
| "Tự động gửi Zalo cho phụ huynh" | App **soạn sẵn**, thầy cô **tự gửi** |
| "Tự nộp thuế / kê khai thay" | App chỉ **tính + tạo tờ khai tham khảo** |
| "Tiết kiệm 30 phút", "X% hài lòng" | Đang **beta**, chưa có số đo thật |
| Tính năng chưa có (chấm điểm tự động, học online, thanh toán trong app) | Bịa tính năng |

---

## 2c. ẢNH — đã sinh sẵn ✅

Nằm ở **`C:\DayThem\store-assets\`**, upload thẳng:

| File | Kích thước | Dùng cho | Yêu cầu Zalo |
|---|---|---|---|
| `zalo_oa_avatar_512x512.png` | 512×512 | **Ảnh đại diện** | tối thiểu 240×240 ✅ |
| `zalo_oa_cover_1920x1080.png` | 1920×1080 (16:9) | **Ảnh bìa** | tối thiểu 320×180 ✅ |

Cả hai đều PNG, dưới 400KB — thừa sức so với hạn 15MB.

**Hai file `_preview_*` chỉ để xem, ĐỪNG upload:**
- `_preview_avatar_tron.png` — avatar sau khi Zalo cắt tròn, kiểm xem có phạm vào cây mầm không
- `_preview_cover_safezone.png` — ảnh bìa có tô đỏ vùng avatar đè lên

### Vì sao không dùng lại ảnh của store

| | Store | Zalo | Xử lý |
|---|---|---|---|
| Ảnh bìa | `play_feature_graphic` **1024×500** (~2.05:1) | **16:9** | Dựng lại bố cục, không cắt |
| Ảnh đại diện | Icon vuông, store tự bo góc nhẹ | Zalo cắt **TRÒN** | Kiểm bằng preview tròn |

Hai điều đã xử lý khi dựng, ghi lại để sau này sửa khỏi giẫm vào:

1. **Zalo đè avatar tròn lên góc dưới-trái ảnh bìa.** Bố cục cũ đặt chữ "GieoChữ" ở đó → bị che mất. Bản mới dồn khối chữ lên nửa trên, chân chữ cách vùng avatar ~9% chiều cao (vị trí avatar xê dịch theo phiên bản Zalo nên để dư nhiều).
2. **Icon gốc đã có sẵn nền xanh.** Vẽ thêm một lớp nền xanh nữa rồi dán icon nhỏ lên trên làm lộ **vệt vuông** (hai sắc xanh lệch nhau chút xíu), nhìn rất rõ khi cắt tròn. Bản mới trải kín icon gốc ra cả khung.

**Sinh lại** (sau khi đổi màn app hoặc logo):
```bash
cd C:\DayThem\marketing
python -c "from src.tools.zalo_oa_assets import build_all; print(build_all())"
```
Sửa bố cục trong `src/tools/zalo_oa_assets.py`.

---

## 3. Các bước — theo đúng thứ tự

### Bước 1 — Tạo OA (15 phút)
1. `oa.zalo.me` → đăng nhập bằng tài khoản Zalo cá nhân
2. *Tạo Official Account* → chọn **Doanh nghiệp**
3. Điền tên, danh mục, mô tả, logo, ảnh bìa
4. Xong → OA đã tồn tại nhưng **chưa xác thực** (chưa gửi ZNS được)

### Bước 2 — Xác thực OA (3–7 ngày làm việc) ⏳
1. Trong OA Manager → *Cài đặt* → **Xác thực OA**
2. Upload GPKD + CCCD, điền thông tin doanh nghiệp
3. Nộp → chờ Zalo duyệt
4. Duyệt xong OA có **dấu tick xanh** và mở khoá ZNS

⚠️ **Đây là đoạn dài nhất — làm bước này TRƯỚC, đừng đợi.** Trong lúc chờ vẫn làm được bước 3.

### Bước 3 — Tạo ứng dụng trên Zalo for Developers (song song với bước 2)
1. `developers.zalo.me` → *Tạo ứng dụng mới*
2. Liên kết ứng dụng với OA vừa tạo
3. Ghi lại **App ID** và **Secret Key** → cất vào `/opt/daythem/.env`, **không commit vào git**
4. Khai báo domain callback: `https://daythem.doitay.vn`

### Bước 4 — Tạo template ZNS cho OTP (sau khi xác thực xong)
1. OA Manager → **ZNS** → *Tạo mẫu tin*
2. Chọn loại **OTP / Xác thực**
3. Nội dung mẫu, giữ ngắn và đúng mục đích:

   ```
   Mã xác thực GieoChữ của bạn là <OTP>.
   Mã có hiệu lực trong 10 phút. Không chia sẻ mã này với bất kỳ ai.
   ```

4. Nộp chờ duyệt template (thường nhanh hơn xác thực OA, tính bằng ngày)
5. **Nạp tiền** vào tài khoản ZNS trước khi gửi thật

### Bước 5 — Nối vào backend
Xem mục 6 bên dưới.

---

## 4. Chi phí

| Khoản | Tiền | Ghi chú |
|---|---|---|
| Tạo OA | **0đ** | Miễn phí |
| Xác thực OA | **Có phí duy trì hằng năm** | ⚠️ Verify số hiện hành tại oa.zalo.me — đổi theo năm |
| ZNS loại **OTP/Authentication** | **~300đ/tin** | Gửi qua **SĐT** được trợ giá tốt hơn qua UID |
| ZNS loại "khác" | ~200đ/tin | Không dùng cho OTP |
| Nút CTA trong tin | Nút đầu 0đ, nút thứ 2+ **+100đ/nút** | Tin OTP không cần nút → giữ 0đ |

**Ước tính thực tế cho GieoChữ:** 100 GV, ~5%/tháng quên mật khẩu = **5 tin ≈ 1.500đ/tháng**.
Tiền không phải vấn đề — vấn đề là **giấy tờ và thời gian duyệt**, nên làm sớm.

---

## 5. Hai giới hạn phải biết trước khi phụ thuộc vào ZNS

**1. ZNS chỉ tới được người CÓ Zalo.** Zalo có ~79 triệu MAU nên phủ rất rộng, nhưng
không phải 100%. Một GV không dùng Zalo sẽ **không bao giờ nhận được OTP**.

→ **Bắt buộc có đường lui.** Ba lựa chọn, xếp theo khuyến nghị:

| Phương án | Đánh giá |
|---|---|
| **ZNS trước, SMS brandname dự phòng** | ✅ Tốt nhất — rẻ mà vẫn phủ 100% |
| Chỉ ZNS | ⚠️ Rẻ nhất nhưng bỏ rơi GV không dùng Zalo |
| Chỉ SMS | Đắt hơn ~2–3× mà không lợi gì hơn |

**2. ZNS cấm tuyệt đối nội dung quảng cáo.** Chỉ được gửi tin giao dịch. Gửi tin
marketing qua ZNS → **bị khoá OA**. Muốn làm marketing thì dùng tin broadcast cho
người đã follow OA (kênh khác, luật khác).

---

## 6. Nối vào backend GieoChữ

Hiện tại `handle_request_otp()` sinh mã nhưng **không gửi đi đâu cả** —
`OTP_DEV_MODE=false` trên prod nên mã sinh ra rồi rơi vào hư không. Việc cần làm:

**Thêm adapter mới** `src/daythem/adapters/zalo_zns.py`, đúng tầng (adapter = kết nối
bên ngoài, xem [.claude/rules/daythem-overrides.md](../.claude/rules/daythem-overrides.md)):

```python
def send_otp(phone: str, code: str) -> bool:
    """Gửi OTP qua ZNS. Trả False nếu thất bại để tầng trên rơi sang SMS."""
```

**Ba điểm kỹ thuật đừng bỏ sót:**

1. **Access token của OA hết hạn nhanh** (tính bằng giờ) và phải làm mới bằng
   `refresh_token`. Đừng hardcode token vào `.env` rồi quên — phải có cơ chế tự refresh
   và lưu lại token mới. Token chết lúc nửa đêm là GV không đăng nhập được.
   *(Verify thời hạn cụ thể tại docs Zalo — con số này Zalo có đổi.)*
2. **SĐT gửi ZNS phải đúng định dạng Zalo yêu cầu** (thường là `84xxxxxxxxx`, không có
   số 0 đầu). Ta đã có sẵn `daythem.phone.normalize_phone()` cho ra `0xxxxxxxxx` →
   viết thêm một hàm đổi sang dạng `84…` ngay trong adapter, **đừng** sửa `normalize_phone`
   (nó là dạng chuẩn nội bộ, đổi là vỡ hết so khớp tài khoản).
3. **Đổi `random` sang `secrets` trước khi bật SMS thật.** Hiện `handle_request_otp` dùng
   `random.randint()` — bộ sinh không an toàn mật mã. Sửa 1 dòng:
   `secrets.randbelow(900000) + 100000`.

**Đã sẵn sàng:** `request-otp` đã chặn số sai định dạng (HTTP 422) nên không đốt tiền
gửi vào số rác. Rate limit 3 lần/10 phút mỗi số cũng đã có, chống SMS-bombing.

---

## 7. Lý do hay bị từ chối xác thực

| Lỗi | Cách né |
|---|---|
| Tên trên CCCD ≠ tên trên GPKD ≠ tên đăng ký OA | Đối chiếu ba chỗ trước khi nộp |
| Ảnh giấy tờ mờ, loá, thiếu góc | Chụp ban ngày, đặt phẳng, đủ 4 góc |
| Dùng thương hiệu bên thứ ba không có hợp đồng | Tên OA là `GieoChữ` — thương hiệu của chính mình, không vấn đề |
| Thiếu giấy phép chuyên ngành | Phần mềm quản lý lớp không thuộc ngành có điều kiện → không cần |
| Mô tả OA mập mờ, không rõ làm gì | Dùng đúng mô tả đã viết cho store |

---

## 8. Checklist

**Chủ tài khoản tự làm (cần giấy tờ + tài khoản Zalo cá nhân):**
- [ ] Tạo OA loại **Doanh nghiệp** — tên, mô tả, giới thiệu **copy thẳng từ mục 2b**; logo lấy từ `store-assets/icon_512x512.png`
- [ ] Đặt **tin chào mừng** (mục 2b) trong OA Manager → Tin tự động
- [ ] Nộp hồ sơ **xác thực OA** (GPKD + CCCD) — **làm sớm, đây là đoạn chờ dài nhất**
- [ ] Tạo app trên `developers.zalo.me`, liên kết OA, lấy App ID + Secret Key
- [ ] Sau khi xác thực xong: tạo **template ZNS loại OTP**, chờ duyệt
- [ ] Nạp tiền vào tài khoản ZNS

**Claude làm được (sau khi có App ID + Secret):**
- [ ] Viết `adapters/zalo_zns.py` + cơ chế tự refresh access token
- [ ] Nối vào `handle_request_otp()`, có đường lui khi ZNS thất bại
- [ ] Đổi `random` → `secrets` cho mã OTP
- [ ] Mở lại luồng OTP trong app (hiện app chỉ dùng SĐT + mật khẩu)
- [ ] Test đầu-cuối: quên mật khẩu → nhận ZNS → đặt lại → đăng nhập

---

## 9. Thứ tự nên làm, đặt cạnh việc đang chạy

Đang song song: chờ duyệt Google Play Console + chuẩn bị closed testing 12 tester × 14 ngày.

| Tuần | Zalo OA | Store |
|---|---|---|
| Tuần này | Tạo OA + **nộp xác thực ngay** | Chờ duyệt Play, build AAB, mở closed testing |
| +1 tuần | Xác thực xong → tạo template ZNS | Đủ 12 tester, đồng hồ 14 ngày chạy |
| +2 tuần | Nối backend, test đầu-cuối | Xin lên production Play |

Hai việc **không giẫm chân nhau** — đều là thời gian chờ bên thứ ba duyệt, nên nộp
cả hai càng sớm càng tốt rồi làm việc khác trong lúc chờ.

---

## Nguồn

- [Xác thực Zalo OA](https://oa.zalo.me/home/documents/guides/huong-dan-xac-thuc_70)
- [Gửi ZNS | Zalo For Developers](https://developers.zalo.me/docs/zalo-notification-service/gui-tin-zns/gui-zns)
- [Bảng giá ZBS](https://zalo.solutions/business-message/pricing)
- [Cơ chế tính giá ZNS](https://zalo.solutions/zns/guidelines/en/co-che-tinh-gia-cua-mau-tin-zns)
- Nội bộ: [zalo-miniapp-assessment.md](zalo-miniapp-assessment.md) · [store-listing-copy.md](store-listing-copy.md) · [wow-features-implementation-plan.md](wow-features-implementation-plan.md)
