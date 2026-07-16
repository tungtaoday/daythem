# GieoChữ — Đánh giá Zalo Mini App làm module GTM

> Ngày: 2026-07-14. Bổ sung cho `docs/gtm-checklist.md` + `docs/gtm-growth-hacks.md`.
> Câu hỏi gốc: có nên GTM bằng **một module trên Zalo Mini App** không? Tài liệu này = dữ kiện nền tảng (có nguồn) + ước lượng chi phí rebuild từ codebase + khuyến nghị go/no-go.
> ⚠️ **Cảnh báo dữ liệu dễ đổi:** giá ZNS, phí ZaloPay, quy trình/điều kiện duyệt, số MAU Mini App — Zalo cập nhật thường xuyên. Mọi con số dưới đây là "tại thời điểm tra cứu 2026-07", verify lại sát thời điểm ra quyết định.

---

## 0. Kết luận một dòng
Zalo Mini App là **kênh acquisition dài hạn tốt nhất** cho tệp GV ngại tech sống trong Zalo, effort **MEDIUM** (không nhỏ) — **nhưng KHÔNG nên đặt cược cửa sổ đầu năm học (T8–9) vào nó.** Vá app RN để bắt sóng ngay, build Mini App làm v2.

---

## 1. Vì sao Mini App khớp với GieoChữ — nó fix 2 thứ RN làm dở về bản chất

| Điều này | App RN hiện tại | Zalo Mini App |
|---|---|---|
| Cài đặt | APK/Store = ma sát lớn với GV ngại tech | ✅ **Không cài gì** — mở trong Zalo là chạy |
| Đăng nhập | phone+password (Zalo OAuth đang giả, audit) | ✅ **1 chạm ra tên + avatar + SĐT** thật (`getUserInfo`/`getPhoneNumber`) |
| Gửi cho phụ huynh | copy-dán tay + luồng gửi đang giả (audit) | ✅ Chia sẻ thiệp/link vào chat–group **native, miễn phí** (`openShareSheet`) |
| GV khác thấy → thử | phải rời group, lên Store, cài APK | ✅ Thấy thiệp trong group → chạm mở thử ngay, 0 cài đặt |

**Đòn bẩy tăng trưởng GV lớn nhất = dòng cuối:** một cô khoe thiệp trong group tiểu học → nhiều cô chạm mở thử mà không phải cài gì. RN không bao giờ làm mượt được điều này. Đây là lý do chiến lược để cân nhắc Mini App nghiêm túc, không chỉ coi là "thêm một kênh".

---

## 2. Dữ kiện nền tảng Zalo Mini App (có nguồn)

### 2.1 SDK & công nghệ
- Mini App là **web app chạy trong super-app Zalo**, build bằng **React.JS + TypeScript**. Stack template chính thức `zaui-coffee`: React + TS + Vite + Recoil + Tailwind/SCSS + thư viện Zalo `zmp-ui`, `zmp-sdk`, `zmp-cli`.
- CLI chính thức `zmp-cli` (`zmp create/start/login/deploy`); deploy sinh QR mở test trong Zalo.
- **Hệ quả cho GieoChữ (React Native + FastAPI):** đây là **React web (DOM), KHÔNG phải React Native.** Tái dùng được logic/hooks/API-client/state/types/business rules; **toàn bộ tầng UI phải viết lại** bằng `zmp-ui` (không có `View`/`Text`/`StyleSheet`). Prototype `DayThem.html` (React web) gần Mini App hơn app RN.
- Nguồn: [zaui-coffee README](https://github.com/Zalo-MiniApp/zaui-coffee/blob/main/README.md), [Zalo Mini App docs](https://miniapp.zaloplatforms.com/docs/zaui/), [npm zmp-ui](https://www.npmjs.com/package/zmp-ui).

### 2.2 Khả năng native quan trọng
- **Đăng nhập / danh tính:** `getUserInfo` → tên, avatar, userId; `getPhoneNumber` → SĐT (cần user đồng ý). Cơ chế: trả **token/mã, giải mã ở server** bằng access token + secret key (không nhận SĐT plaintext ở client). → happy-path login mạnh cho phễu.
- **Chia sẻ vào chat/nhóm:** `openShareSheet` — type `link`, `image` (1 hoặc nhiều ảnh), `text`, `zmp_deep_link` (deep-link mở lại chính mini app). **MIỄN PHÍ.** Lưu ý: **user tự chọn người/nhóm nhận** trong share sheet, mini app không chọn hộ; "card giàu định dạng" chỉ ở mức link-preview + ảnh.
- **Nhắn 1-1 tới một phụ huynh cụ thể:** **KHÔNG có API client miễn phí** làm việc này (chỉ `interactOA`/`followOA` với OA của bạn). Nhắn chủ động tới phụ huynh cụ thể phải qua **OA → ZNS** (trả phí, mục 2.4).
- **Thanh toán:** module payment dùng **ZaloPay** (`createOrder`); cần đăng ký merchant. Phí giao dịch **theo thỏa thuận từng hợp đồng ZION–merchant, không có % công khai cố định** (không xác định được con số). `createOrder` từng bị sửa qua các bản SDK → kiểm tra API hiện hành trước khi làm subscription.
- **Storage + gọi REST ngoài:** SDK có Storage API key-value; **fetch REST backend ngoài được** (cần whitelist domain trong cấu hình app). → **FastAPI backend GieoChữ dùng lại được.**
- Nguồn: [getUserInfo](https://miniapp.zaloplatforms.com/docs/api/getUserInfo), [getPhoneNumber](https://miniapp.zaloplatforms.com/docs/api/getPhoneNumber/), [openShareSheet](https://miniapp.zaloplatforms.com/docs/api/openShareSheet/), [ZaloPay setting](https://mini.zalo.me/docs/payment/integration-setting/zalopay-setting/), [zmp-sdk CHANGELOG](https://github.com/Zalo-MiniApp/changelog/blob/master/zmp-sdk.CHANGELOG.md).

### 2.3 Phân biệt then chốt: share (free) vs ZNS (trả phí)
- **`openShareSheet` (chia sẻ trong chat)** = **MIỄN PHÍ**, user tự bấm gửi → kênh viral/organic.
- **ZNS qua OA** = **TRẢ PHÍ**, tự động, nhưng **bị CẤM nội dung quảng cáo/marketing** → chỉ dùng cho giao dịch (nhắc học phí, nhắc lịch, xác nhận, hóa đơn).

### 2.4 ZNS (Zalo Notification Service)
- Gửi thông báo giao dịch/CSKH qua OA; phải tạo **template và chờ Zalo duyệt**; 4 loại: bảng biểu, text, rating, OTP.
- **Giá (tại thời điểm tra cứu, dễ đổi):** tính theo mỗi tin gửi thành công. Authentication/Payment/Voucher ~**300đ**; loại "khác" ~**200đ/tin**; CTA nút đầu 0đ, nút thứ 2+ +100đ/nút. Gửi qua **SĐT** được trợ giá cao hơn qua **UID**.
- Nguồn: [Gửi ZNS | Zalo For Developers](https://developers.zalo.me/docs/zalo-notification-service/gui-tin-zns/gui-zns), [Bảng giá ZBS](https://zalo.solutions/business-message/pricing), [Cơ chế tính giá ZNS](https://zalo.solutions/zns/guidelines/en/co-che-tinh-gia-cua-mau-tin-zns).

### 2.5 Quy trình publish (rào cản đáng lưu ý)
- **Bắt buộc Zalo Official Account (OA) đã xác thực** + developer account.
- **Xác minh doanh nghiệp:** qua OA doanh nghiệp hoặc **Giấy phép kinh doanh + CCCD người đại diện**; **có hỗ trợ hộ kinh doanh.**
- **Thời gian duyệt: ~3–7 ngày làm việc**, lâu hơn nếu thiếu giấy tờ.
- **Dễ bị từ chối vì:** thiếu giấy phép chuyên ngành, thông tin doanh nghiệp không khớp giữa giấy tờ, dùng thương hiệu bên thứ ba không có hợp đồng.
- Nguồn: [Xác thực Zalo OA](https://oa.zalo.me/home/documents/guides/huong-dan-xac-thuc_70), [Khởi tạo & xác thực Mini App 2026](https://pandaloyalty.com/huong-dan-khoi-tao-va-xac-thuc-tren-zalo-mini-app/), [7 lỗi khiến Mini App bị từ chối](https://pandaloyalty.com/loi-pho-bien-khien-zalo-mini-app-bi-tu-choi/).

### 2.6 Giới hạn kỹ thuật
- Kích thước Mini App **< 10MB** (nguồn báo phổ thông — verify docs chính thức nếu cần chính xác).
- **Không có background service/local push như native** → thông báo chủ động đi qua ZNS/OA.
- Domain backend phải **whitelist** trong cấu hình app.

### 2.7 Tiền lệ & quy mô
- Cuối 2024: Zalo báo **>13 triệu MAU dùng Mini App**, **3.465 Mini App hoạt động**. Zalo tổng **~79 triệu MAU** (2025). (Số MAU mini app qua tổng hợp báo chí — cần verify báo cáo chính thức.)
- **Giáo dục:** nhiều trường/trung tâm dùng Mini App cho **tuyển sinh/tư vấn** (ĐH Thủy Lợi, Kiến trúc ĐN, FPT, UEF, MindX, Zami…) — thiên về tổ chức, **chưa thấy tiền lệ rõ cho giáo viên cá nhân quản lý lớp.**
- Không có nguồn định lượng đáng tin về mức Zalo "đẩy discovery" cho Mini App SMB nhỏ.
- Nguồn: [Zalo 79,6tr MAU](https://www.vietnam.vn/en/79-6-trieu-nguoi-dung-zalo-thuong-xuyen-hang-thang), [Mini App trường học](https://pandaloyalty.com/thiet-ke-zalo-mini-app-truong-hoc/), [Case study | Zalo For Business](https://miniforbusiness.zalo.me/case-study).

---

## 3. Ước lượng chi phí rebuild (từ codebase `mobile/`)

Stack hiện tại: React Native 0.81 + Expo SDK 54, TypeScript strict, Zustand, Axios, React Navigation v7. `mobile/src` ≈ **66 file / ~12.500 LOC sản phẩm**. Backend FastAPI **dùng lại nguyên** (REST) — chỉ đánh giá tầng UI.

Module viral dự kiến đưa lên Mini App: **onboarding/login + nhập HS OCR + thu học phí + báo cáo/thiệp share**.

### 3.1 Tái dùng gần như nguyên (thuần TS, không phụ thuộc native)
- **Toàn bộ `api/*.ts` + `client.ts`** (axios + interceptor token/401) — backend dùng lại.
- **`store/auth.ts`, `store/classes.ts`** (Zustand). `store/storage.ts` đã có nhánh web `localStorage`.
- **`utils/schedule.ts`** (parse lịch), **`utils/clipboard.ts`** (đã có nhánh `navigator.clipboard`).
- **`theme` tokens** (màu/spacing/radius) — hằng số dùng lại; chỉ `StyleSheet`/`shadow` phải map CSS.
- Logic tính toán trong màn (% chuyên cần, tổng thu, sinh nội dung tin) — copy được.

### 3.2 Phải viết lại (phụ thuộc React Native / Expo)
- **`ThiepShare.tsx` (tạo ảnh thiệp) — nặng & rủi ro nhất:** hiện render bằng `react-native-view-shot` (native, KHÔNG chạy web). Phải dựng lại card bằng HTML/CSS rồi render ảnh bằng `html-to-image`/canvas, chia sẻ qua ZMP `openShareSheet`. Gradient → CSS; SVG inline JSX giữ được.
- **Navigation:** `navigation/index.tsx` + mọi `navigate`/`route.params` → thay bằng zmp router (react-router). Lan toả khắp màn.
- **OCR intake:** phần backend giữ nguyên; phần mobile (`expo-image-picker`/`document-picker`/`file-system` → base64) thay bằng ZMP media API (`chooseImage`/`openMediaPicker`). File-picker docx/xlsx trên ZMP hạn chế → có thể chỉ giữ ảnh.
- **Deep-link Zalo (`utils/zalo.ts`):** trên ZMP là **điểm mạnh** — thay copy-paste bằng API Zalo native (tốt hơn hiện tại).
- **Styling toàn bộ** `StyleSheet.create` → CSS/zmp-ui (khối lượng cơ học lớn).
- **`notifications/engine.ts`** (expo-notifications) — ngoài phạm vi viral, dùng OA/ZNS.

### 3.3 Thư viện phải thay khi sang web/ZMP
`react-native`, `react-native-screens`, `@react-navigation/*`, `react-native-view-shot`, `react-native-safe-area-context`, `expo-image-picker`, `expo-document-picker`, `expo-file-system`, `expo-notifications`, `expo-secure-store`, `expo-sharing`, `expo-linear-gradient`, `@expo/vector-icons`, expo runtime.
**Dùng lại được:** `axios`, `zustand`, `xlsx` (SheetJS chạy web — nhưng Excel ngoài viral), `expo-clipboard` (nhánh web), `react-native-svg` (SVG inline JSX chạy DOM).

### 3.4 Bảng effort
| Phần | LOC | Phân loại |
|---|---|---|
| API layer + auth/classes store | ~600 | Tái dùng gần như nguyên |
| Onboarding/Login (Auth ×4) | ~918 | Sửa vừa (logic giữ, UI/CSS + router lại) |
| Thu học phí | ~841 | Sửa vừa |
| Nhập HS OCR (`ClassStudentsScreen`) | 1056 | Sửa vừa–nặng (thay lớp chọn ảnh/file) |
| Báo cáo + `ZaloCopySheet` | ~1400 | Sửa vừa |
| **Thiệp ảnh (`ThiepShare`)** | 170 | **Viết lại** (đổi cơ chế render ảnh) |
| Navigation | 247 + rải rác | **Viết lại** |
| Styling toàn bộ | ~toàn bộ StyleSheet | Viết lại cơ học |

**Cảm nhận tổng thể: MEDIUM** (nghiêng medium-cao nếu đòi UI pixel-perfect). Lạc quan vì: backend + API + logic + store **dùng lại nguyên**, OCR nặng ở backend, không có thuật toán phức tạp ở client. Chi phí chủ yếu là **cơ học** (dựng lại UI + thay ~10 native module).

**3 hạng mục tốn công nhất:** (1) dựng lại toàn bộ UI/styling ~4.200 LOC; (2) `ThiepShare` tạo ảnh (rủi ro font tiếng Việt/gradient/chất lượng ảnh); (3) OCR intake + viết lại navigation.

---

## 4. ROI vs rủi ro

**Ưu điểm lớn nhất:**
- Trong Zalo (~79tr MAU) — không cài app; phễu trial GV mượt chưa từng có.
- Login 1 chạm ra tên+avatar+SĐT.
- `openShareSheet` = kênh lan truyền GV→phụ huynh & GV→GV **miễn phí**.
- Backend FastAPI + logic dùng lại.

**Nhược điểm lớn nhất:**
- UI phải viết lại 100% + maintain thêm 1 codebase.
- Bắt buộc OA xác thực + GPKD/hộ KD; duyệt 3–7 ngày, có thể bị từ chối.
- Nhắn tự động tới phụ huynh = ZNS trả phí (~200–300đ/tin) + cấm marketing; không có chat 1-1 free.
- Phụ thuộc hệ sinh thái Zalo (giá ZNS/ZaloPay Zalo tự đổi); không background/push native.

---

## 5. Khuyến nghị: KHÔNG gate cửa sổ năm học vào Mini App

Cửa sổ đầu năm học còn ~6–8 tuần (đóng ~15/9). Rebuild MEDIUM khó ship kịp + qua duyệt + seeding trước mốc. Tách đôi:

**Nhánh A — Ngay (bắt sóng T8–9), trên RN:**
- Bước 0 "sự thật hoá": sửa luồng báo cáo giả + watermark thiệp + hook OCR.
- Rẻ, nhanh, dùng APK/RN sẵn có → **chắc chắn kịp** cửa sổ.

**Nhánh B — Song song / sau sóng, Zalo Mini App v2:**
- Build đúng module viral (onboarding + OCR + thu phí + thiệp share native).
- Kênh acquisition **cộng dồn dài hạn**, không phải deliverable nước rút.
- Payoff thật (no-install + 1-tap login + share free) sinh lời mạnh nhất *sau* khi đã có seed users + testimonial từ sóng năm học.
- Chuẩn bị trước: đăng ký/xác thực OA + hồ sơ GPKD/hộ KD (vì duyệt mất 3–7 ngày).

**Tinh thần:** Mini App **xứng đáng làm** — vai trò của nó là *hạ tầng lan truyền bền*, không phải cứu cánh tức thời. Đúng thứ tự thì vừa bắt được sóng năm học, vừa xây được kênh dài hạn — thay vì đánh cược tất cả vào một rebuild có thể trễ mốc.

---

## 6. Việc cần verify trước khi cam kết roadmap
- [ ] Giá ZNS hiện hành (mục 2.4) + quy trình duyệt template.
- [ ] Phí giao dịch ZaloPay theo hợp đồng merchant (mục 2.2).
- [ ] Điều kiện xác thực OA cho tư cách pháp lý hiện có của GieoChữ (mục 2.5).
- [ ] API media/share ZMP hiện hành cho `ThiepShare` (chất lượng ảnh + font tiếng Việt) — làm 1 spike nhỏ trước.
- [ ] Domain FastAPI có whitelist được trong cấu hình Mini App không.
