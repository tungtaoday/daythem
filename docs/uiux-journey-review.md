# GieoChữ — Báo cáo đánh giá UI/UX & Customer Journey toàn app

> Ngày: 2026-07-15. Phương pháp: 3 auditor đọc toàn bộ mã màn hình theo 3 chặng hành trình (onboarding → vòng lặp ngày/tháng → vòng lặp tuần + cross-cutting). **Mọi finding đều có file:line thật** — không suy diễn từ screenshot.
> Persona chuẩn: **Cô Hoa** (trung niên, ngại tech, mắt kém, sống trong Zalo — tệp chính) · **Thầy Tuấn** (trẻ, nhiều lớp, thích nhanh) · **Trung tâm nhỏ** (đông HS).
> Liên quan: `docs/gtm-checklist.md` (wedge = thu học phí + báo cáo PH), `docs/gtm-growth-hacks.md` (thiệp = động cơ viral #1).

---

## 0. Kết luận điều hành

**Đường chính (happy path) đang TỐT** — onboarding 7 màn chỉ 3 lần gõ tay, điểm danh mặc-định-có-mặt, tick thu 1 chạm, luồng Zalo copy-dán trung thực. Vấn đề của app nằm ở **3 vùng tối**:

1. **Đường lỗi (khi mạng yếu/API fail) gãy hệ thống** — và tệp GV VN dùng 4G chập chờn là chuyện thường ngày.
2. **Một số màn còn "hứa hẹn giả" / số liệu bịa cho tài khoản thật** — cùng họ với lỗi GATE 0 đã sửa ở tab Báo cáo, nhưng còn sót ở ClassReport, MakeupPoll, StudentsTab, Excel export.
3. **Chữ nhỏ & nút nhỏ ở đúng những chỗ tệp chính cần nhất** (66 chỗ chữ <12px; nút tick tiền/nhắc Zalo ~30px).

Điểm hành trình theo chặng (A = đạt, C = cần sửa gấp):

| Chặng | Điểm | 1 câu |
|---|---|---|
| Cài đặt → Onboarding | **B+** | Happy path xuất sắc; đường lỗi (typo/offline) = bẫy |
| Thiết lập lớp + HS | **A−** | Preset chips + nhập nhanh OCR rất mạnh; CreateClass lệch chuẩn Setup |
| Vòng lặp ngày (điểm danh) | **B−** | Race condition + thừa chạm từ Home |
| Vòng lặp tháng (học phí) | **C+** | Wedge của sản phẩm nhưng: không undo, nuốt lỗi → sót người, lệch tháng UTC |
| Vòng lặp tuần (báo cáo/thiệp) | **C+** | ReportTab đã trung thực (GATE 0) nhưng ClassReport còn bịa số; nudge thiệp bị chôn cuối trang |
| Đột xuất (báo nghỉ/học bù) | **C** | Báo nghỉ chuẩn; poll học bù nửa giả (mẫu số 7 cứng, slot không sửa được, index lệch server) |
| Quản trị (hồ sơ/thuế/thông báo) | **B−** | Thuế đã chuẩn luật; STK lưu local dễ mất, save nuốt lỗi, 2 tên mẫu tờ khai mâu thuẫn |

---

## 1. 🔴 NHÓM A — Sát thủ niềm tin (sửa TRƯỚC khi kéo beta)

> Chung 1 bản chất: app nói dối hoặc âm thầm sai — với tệp "tin đồng nghiệp, soi kỹ app", dính 1 lần là mất luôn.

| # | Vấn đề | Bằng chứng | Sửa |
|---|--------|-----------|-----|
| A1 | **Chuỗi domino demo-fallback**: (a) mở app offline → `loadMe` catch không set token → đá về Welcome dù có tài khoản; (b) đăng nhập lại lỗi mạng → âm thầm mint `demo-` token; (c) toàn app hiện HS giả ("Hoàng Tuấn Kiệt"…, "3 PH nợ 1,5tr") **không có bất kỳ banner nào**; (d) tắt app mất sạch | `store/auth.ts:48-56` (mint demo), `:62-74` (loadMe), không có UI demo-banner (grep toàn src) | (1) `loadMe` catch vẫn `set({token})`; (2) login lỗi mạng → Alert thử lại, KHÔNG rơi demo; (3) nếu giữ demo → banner cố định "🧪 Dữ liệu mẫu — chưa lưu tài khoản" |
| A2 | **ClassReport gửi số bịa cho PH thật**: tin copy hardcode "Đi học 1/1 · Bài tập đầy đủ · Học phí đã thu" + `[Tên con]` không điền, dù `realReport` per-HS **đã tính sẵn cùng file**; màn success còn hứa "PH sẽ nhận qua Zalo" | `ClassReportScreen.tsx:137, 160-163, 301` (vs dữ liệu thật `:79-92`) | Sinh tin từ `realReport`; đổi copy success theo chuẩn ReportTab (đã sửa GATE 0) |
| A3 | **Poll học bù nửa giả**: mẫu số "…/7" hardcode; preview vẽ checkbox PH "tick" trong khi không có kênh vote; slot tự sinh 19:00 **không sửa được** ngày/giờ; CancelClass tự tạo 2 slot bịa trước → index chốt **lệch** với server | `MakeupPollScreen.tsx:58, 312-328, 343-352, 120`; `CancelClassScreen.tsx:121-134` | Sĩ số thật; bỏ checkbox giả; editor giờ/ngày per-slot; truyền slots GV soạn vào `proposeMakeup`; thêm ô "nhập tay số PH đã trả lời" |
| A4 | **Điểm danh bị reset bởi race**: mở màn → chạm đánh vắng → `listSessions` về muộn → effect reset "tất cả có mặt" không báo | `AttendanceScreen.tsx:125-154` | Dirty-flag: chỉ áp session cũ khi user chưa chạm |
| A5 | **Sót người chưa nộp do nuốt lỗi**: 1 lớp fail → `catch(()=>[])` → HS lớp đó biến khỏi danh sách "CHƯA NỘP", tổng thiếu hiện sai — đánh thẳng wedge "thu không sót ai" | `TuitionTabScreen.tsx:203` | Lớp fail → dải cảnh báo "Không tải được Lớp X — thử lại" |
| A6 | **Tick thu tiền không có undo**: chạm nhầm = sổ tiền sai vĩnh viễn trong UI (API đã nhận `paid:false`, chỉ thiếu UI) | `ClassTuitionScreen.tsx:81-90`, `TuitionTabScreen.tsx:241-253` | Chạm badge "Đã nộp" → confirm bỏ tick |
| A7 | **Setup nuốt lỗi tạo lớp**: màn "Sẵn sàng rồi! 🌿" hiện TRƯỚC khi API chạy; fail → vào app "Chưa có lớp nào" | `SetupScreen.tsx:56-68` (`.catch(()=>{})` không await) | Await + Alert 1 câu, vẫn cho vào app |
| A8 | **Typo lần đầu = khoá tài khoản**: đăng ký/đăng nhập chung 1 ô mật khẩu không confirm; gõ nhầm SĐT còn lặng lẽ tạo tài khoản ma; SĐT bị che nên không tự soát được | `PasswordScreen.tsx:20-21, 50-54` | Tách nhánh "tạo mật khẩu" có ô nhập lại; hiện SĐT đầy đủ + nút sửa |
| A9 | **StudentsTab hồ sơ HS luôn "Chưa có dữ liệu học phí"** dù state cha đã có, list bên ngoài vẫn hiện "Nợ 500k" | `StudentsTabScreen.tsx:83, 177, 300-306` | Nối `tuitionByClass` vào profile |
| A10 | **Excel xuất số bịa**: tài khoản thật ghi cứng "Chuyên cần 0%", "Còn nợ 0đ" mọi em; "Ngày nộp" luôn rỗng | `ClassStudentsScreen.tsx:663`, `exportExcel.ts:69-70` | Bỏ cột khi chưa có data thật / tính từ sessions |

## 2. 🟡 NHÓM B — Ma sát vòng lặp hằng ngày (sửa trong 2 tuần)

**B1. Home nói một đằng dẫn một nẻo (3 thẻ):**
- Thẻ "Đang diễn ra" nút ghi **"Điểm danh"** nhưng mở ClassDetail (+1 chạm/ngày) — `HomeScreen.tsx:461, 539-540`
- Thẻ rủi ro vắng bảo "nhắn Zalo hỏi thăm" nhưng nút mở danh sách lớp (+3 chạm) — `:489, 541-542`
- Card bị `dismiss` NGAY khi bấm, chưa làm xong việc đã biến mất + đếm "đã xử lý" — `:538`

**B2. Nhắc Zalo per-phụ-huynh chỉ có ở ClassTuition** — TuitionTab (nơi thẻ Home trỏ tới) chỉ nhắc gộp không tên/số tiền → luồng nhắc 1 PH từ Home mất **6-7 chạm** (lý tưởng 3). → Copy nút Zalo per-row sang TuitionTab.

**B3. Lệch tháng UTC**: `toISOString().slice(0,7)` ở `ClassTuitionScreen.tsx:50` + `ClassDetailScreen.tsx:64` (TuitionTab đã fix, 2 chỗ này sót) → sáng mùng 1 trước 7h hiện tháng trước, số giữa 2 màn đá nhau.

**B4. ClassTuition không đổi tháng được** (thu nợ tháng trước từ hub lớp = bất khả) — MonthSwitcher đã có sẵn ở TuitionTab, tái dùng.

**B5. Nudge thiệp (vũ khí viral #1) bị chôn cuối scroll tab Báo cáo** (`ReportTabScreen.tsx:711-720`); >1 lớp thì quăng về tab Lớp không hướng dẫn. → Kéo lên ngay dưới stat chips + picker chọn lớp. **Thiệp đã có watermark 🌿 nhưng thiếu "gieochu.vn"** (`ThiepShare.tsx:103`) → PH thấy đẹp cũng không biết tải đâu — vòng viral đứt đúng mắt xích cuối.

**B6. Chuỗi nuốt lỗi im lặng còn lại:** NotificationSettings save (`:45-51`), Home summary (`HomeScreen.tsx:419`), báo nghỉ toggle "nhắn riêng từng PH" chỉ đổi chữ không đổi hành vi (`CancelClassScreen.tsx:141-147`).

**B7. Onboarding lặt vặt:** không skip được bước tạo lớp (trái mô tả CLAUDE.md); user cũ name-null bị ép Setup → tạo **lớp trùng**; Setup không có nút đăng xuất; link Điều khoản ở Welcome **bấm không được** (`WelcomeScreen.tsx:143-147` — rủi ro khi review lên store); "Quên mật khẩu?" 12px mờ.

**B8. Attendance phụ:** modal lý do vắng thừa 1 chạm (chọn preset xong vẫn phải "Lưu"); chỉ gợi ý hỏi thăm **em vắng đầu tiên** (em thứ 2-3 mới là em sắp bỏ); màn success bắt bấm "Về trang chính"; lớp 0 HS vẫn submit được records rỗng; nút ngày không lịch ghi "buổi hôm nay" nhưng lưu buổi quá khứ.

**B9. Nhắc-đã-gửi chỉ sống trong state màn** (rời màn mất, đánh dấu cả N người dù mới gửi 1) — nên lưu per-parent + timestamp về server (gap G1 bên dưới).

## 3. 🟢 NHÓM C — Đánh bóng hệ thống (làm dần)

| Chủ đề | Số liệu đếm được | Việc |
|---|---|---|
| **Chữ nhỏ** | **66 chỗ <12px / 20 file** (Report 10, MakeupPoll 6…); tệ nhất: chữ 10px mang thông tin (lý do miễn giảm phí `ClassSettingsScreen.tsx:735-736`, kicker báo cáo, % chart). Nhãn 5 tab chính 10px (`navigation/index.tsx:56` — *lưu ý: đã có commit tăng 11, kiểm tra lại khi sửa*) | Sàn 13px cho text hướng dẫn/hành động, 12px cho meta; tab 11-12px |
| **Touch target** | Nút tick thu ~29-31px, icon Zalo 34px, noteBtn 32px — đều dưới chuẩn 44px, không hitSlop | minHeight 44 / hitSlop 8-10 cho mọi nút hành động lặp lại |
| **Trôi token màu** | ~129 hex hardcode / 16 file; trớ trêu `#3a7dd3` = `colors.zalo` và `#8a6d30` = `colors.honey700` **đã có token** vẫn hardcode | Find-replace 2 màu lớn trước |
| **Màu Zalo loạn** | Nút "gửi Zalo" chỗ xanh dương (#3a7dd3) chỗ xanh lá (green500) — 6+ file | Mọi nút Zalo = xanh dương thương hiệu |
| **Emoji icon sót** | NotificationSettings ⏰🌅💰📊📣; "🌿 Gửi thiệp" (`ClassStudentsScreen.tsx:302`); Setup 💰/🌿; "✦ Bước tiếp theo"; ✓ dạng Text 4 chỗ | Thay Ionicons theo đợt dọn trước |
| **2 kiểu success/empty** | ReportTab tự chế ✓ 48px thay vì `SuccessScreen`; 4 màn tự chế empty inline không icon/CTA; Tax + NotificationSettings lỗi không có nút thử lại | Chuẩn hoá SuccessScreen + EmptyState |
| **Web-only style thiếu fallback** | `ReportTabScreen.tsx:725` backgroundImage không backgroundColor (native lộ nội dung sau nút) | +1 dòng `backgroundColor: colors.bg` |
| **Lệch chuẩn nhỏ** | CreateClass gõ phí thô "800000" trong khi Setup có preset chips; nút tick 2 màn 2 kiểu; 2 tên mẫu thuế (Profile/Legal nói 09/KK-TNCN cũ vs TaxScreen 01/TKN-CNKD mới); đổi mật khẩu min 4 vs 6; WEEKDAYS const chết T7=CN=7 | Đồng bộ từng cặp |

## 4. Gap tính năng theo journey (chưa build — cân nhắc lộ trình)

| # | Gap | Vì sao đáng làm |
|---|-----|----------------|
| G1 | **Lịch sử tin đã gửi** (báo nghỉ/nhắc phí/báo cáo) | "Copy & quên" → gửi trùng, bỏ sót lớp; server đã lưu, chỉ thiếu màn hiển thị |
| G2 | **Ghi "bài đã dạy"** cho tài khoản thật | Là lý do gốc khiến tin báo cáo phải bịa "Bài tập: đầy đủ" (A2) |
| G3 | **Buổi học bù đã chốt lên Home/Calendar** | Màn confirm claim "đã thêm vào lịch" nhưng không nơi nào hiện lại → GV quên buổi bù |
| G4 | **Poll: nhập tay kết quả vote** | PH trả lời bằng tin Zalo → GV cần tick hộ, thay vì đếm 0/7 chờ dữ liệu không bao giờ đến |
| G5 | **Nhắc thông minh theo trạng thái** ("tuần này chưa gửi báo cáo lớp X") | Hiện nhắc theo giờ cố định — nhắc cả khi xong, im khi quên |
| G6 | **Kênh khôi phục tài khoản thứ 2** (email đã nhập nhưng chỉ lưu local) | Mất SIM = mất tài khoản; reset đang phụ thuộc xử lý tay |

**Điểm sáng cần GIỮ:** Setup bước 2 gần 0 gõ phím; GettingStarted checklist đổi CTA theo tiến độ; empty ClassStudents dẫn thẳng "Nhập nhanh cả lớp"; ZaloCopySheet pattern trung thực (copy → mở Zalo → tự xác nhận) — **lấy làm chuẩn cho mọi luồng gửi**; ThiepShare có watermark + brand; social login mock giấu sau `__DEV__`.

---

## 5. Lộ trình đề xuất

**Đợt 1 — Trust killers (~2-3 ngày, TRƯỚC beta):** A1 demo-fallback (3 sửa nhỏ) · A2 ClassReport số thật · A4 race điểm danh · A5 nuốt lỗi tuition · A6 undo tick · A7 Setup await · A10 Excel. *(A3 poll + A8 password tách riêng vì cần thiết kế lại 1 màn.)*

**Đợt 2 — Ma sát vòng lặp (~1 tuần):** B1 Home 3 thẻ · B2 Zalo per-row TuitionTab · B3 tháng UTC · B4 MonthSwitcher · B5 nudge thiệp + "gieochu.vn" trên thiệp · B6 hết nuốt lỗi · A8 tách nhánh mật khẩu · A3 poll học bù trung thực.

**Đợt 3 — Hệ thống (~1 tuần, làm dần):** C-nhóm (chữ/touch/token/emoji/success-empty chuẩn) · B7 B8 B9 còn lại.

**Đợt 4 — Gap:** G1 → G3 → G4 (gắn với beta feedback); G2 khi làm content báo cáo; G5-G6 sau.

**Top 5 quick-wins (<1 giờ/cái, làm ngay được):**
1. `loadMe` giữ token khi offline (1 dòng) — chặn cả chuỗi domino A1
2. Tin ClassReport dùng `realReport` có sẵn (A2)
3. "gieochu.vn" vào chân thiệp + kéo nudge lên đầu (B5 — chạm thẳng viral)
4. Undo tick thu (A6 — UI mỏng, API sẵn)
5. Thẻ Home "Đang diễn ra" mở thẳng Attendance + sửa 2 chỗ tháng UTC (B1a/B3)
