# GieoChữ — Đánh giá UI/UX vòng 2 (skill: ui-ux-pro-max + taste-skill)

> Ngày: 2026-07-18. Công cụ: **ui-ux-pro-max** (98 UX guidelines + pro-rules checklist + React Native stack rules) cho APP; **taste-skill** (anti-slop, Pre-Flight 50 mục) cho LANDING — đúng scope từng skill (taste-skill tự tuyên bố *không* dùng cho product UI native).
> Phương pháp: check CƠ HỌC trên mã nguồn + HTML live (đếm được, không cảm tính). Đã LOẠI những gì vòng 1 (`uiux-journey-review.md`) sửa xong.
> Design Read (taste-skill 0.B): *"Landing miễn phí cho giáo viên VN trung niên, ngôn ngữ ấm-tin cậy, trust-first → dials VARIANCE 4 / MOTION 2-3 / DENSITY 4 (nhóm 'trust-first / accessibility-critical' — KHÔNG phải nhóm Awwwards)."*

---

## PHẦN A — LANDING gieochu.vn (taste-skill Pre-Flight)

Đo trực tiếp HTML live:

| Check (mục Pre-Flight) | Đo được | Chuẩn | Kết quả |
|---|---|---|---|
| **Em-dash `—`** (9.G — cấm tuyệt đối) | **18** + 2 en-dash | 0 | ❌ FAIL |
| **Eyebrow count** (mechanical: ≤ ⌈sections/3⌉) | **7** / ~10 section → cap 4 | ≤4 | ❌ FAIL |
| **3-equal-cards** (9.C cấm) | 1 grid `repeat(3)` dùng cho **2 section** (How + Hợp-với-ai) | 0 | ❌ FAIL (đồng thời vi phạm Section-Layout-Repetition) |
| **Div-based fake product UI** (9.E/9.F — "Tell #1") | **5 khung điện thoại** dựng hoàn toàn bằng `<div>` | 0 | ❌ FAIL |
| **Duplicate CTA intent** | 4+ nhãn cùng intent "tải": *Tải miễn phí / Tải miễn phí ngay / Tải trên / Tải về từ* | 1 nhãn/intent | ❌ FAIL |
| **Decorative dots** | 2 chấm ● + 3 badge-pill | ~0 | 🟡 |
| **Middle-dot `·` rationed** | 14 | ≤1/dòng | 🟡 |
| Button contrast / CTA wrap / theme lock / shape lock | đạt | — | ✅ |
| Copy self-audit (sau đợt trung thực hoá) | đạt | — | ✅ |

### Việc đáng làm nhất cho landing (theo taste-skill, lọc qua bối cảnh trust-first)

1. **Thay 5 phone-mockup div bằng SCREENSHOT THẬT của app** — đây là finding giá trị nhất vòng này: vòng 1 mình còn phải "vẽ" app bằng div vì app chưa đẹp; giờ app đã đẹp và mình **có sẵn screenshot thật** (bộ `f2-*` vừa chụp). Ảnh thật = trung thực hơn (khớp GTM), nhẹ hơn, không bao giờ lệch với app nữa. *(Cách làm: chụp 3-4 màn đẹp nhất ở 390px, bọc `<figure>` viền mảnh.)*
2. **Giảm eyebrow 7 → ≤4**: giữ ở Hero + Miễn phí + FAQ; các section khác bỏ (headline tự đứng được).
3. **Phá cặp lưới 3-thẻ trùng nhau**: đổi section "Hợp với ai" sang layout khác (definition rows / 2-cột) — trùng khuyến nghị hallmark trước đây, giờ 2 skill độc lập cùng bắt → nên làm thật.
4. **Thống nhất nhãn CTA tải**: 1 nhãn duy nhất "Tải miễn phí cho Android" ở mọi nút (nav/hero/pricing/final).
5. **Em-dash 18 → 0**: thay bằng dấu phẩy/chấm/hai chấm. *(Ghi chú trung thực: đây là quy tắc "chống dấu vân tay AI" của skill, không phải lỗi UX với người đọc VN — nhưng rẻ, làm được.)*

---

## PHẦN B — APP React Native (ui-ux-pro-max)

Đo trên `mobile/src` (grep toàn bộ):

| Check (priority table + RN stack) | Đo được | Chuẩn skill | Mức |
|---|---|---|---|
| **accessibilityLabel trên control tương tác** | **3** / ~410 TouchableOpacity | "all interactive" — Severity **High** | 🔴 |
| **accessibilityRole** | **0** | Có role đúng — Medium | 🟡 |
| **Dark mode** | **0** (app light-only, màu nền hardcode nên không vỡ khi OS dark) | Test cả 2 mode | 🟡 (quyết định sản phẩm — xem ghi chú) |
| **Reduced motion** | 0 check `isReduceMotionEnabled` | Bắt buộc khi có animation | 🟢 (animation hiện ≤400ms, one-shot feedback — rủi ro thấp) |
| **FlatList/virtualize** | 0 — mọi danh sách là `.map` trong ScrollView | Virtualize list dài — High (perf) | 🟡 (ổn với lớp ≤30 HS; **rủi ro với persona trung tâm 100+ HS** ở tab Học sinh) |
| **Pressable vs TouchableOpacity** | 410 vs 0 | Pressable cho code mới — Low | 🟢 (không cần sửa hồi tố) |
| **React.memo cho list row** | 0 | memo row — High khi list dài | 🟡 (gộp với FlatList khi làm) |
| keyboardType đúng loại | 21 chỗ dùng | ✓ | ✅ |
| Tap feedback (opacity/scale) | activeOpacity + Button scale | ✓ | ✅ |
| Touch target ≥44 + hitSlop | đã sửa vòng 1 | ✓ | ✅ |
| Emoji-as-icon | đã dọn vòng 1 (còn emoji nội dung tin nhắn — hợp lệ, là chat text) | ✓ | ✅ |
| Safe area (header/tab/CTA bar) | insets dùng nhất quán | ✓ | ✅ |
| Loading/empty/error states | phủ chính sau vòng 1 | ✓ | ✅ |

### Việc đáng làm nhất cho app

1. **🔴 Accessibility pass (1 buổi):** thêm `accessibilityLabel` + `accessibilityRole="button"` cho các nút **chỉ-có-icon** (nút Zalo per-row, nút ghi chú vắng, nút export, gear cài đặt, mắt xem mật khẩu, X xoá slot...) — ~30-40 chỗ trọng yếu thay vì cả 410. Lý do thật: TalkBack dùng được + điểm cộng khi review lên store; chi phí thấp.
2. **🟡 Virtualize 2 danh sách có thể phình:** tab **Học sinh** (toàn bộ HS mọi lớp) + tab **Học phí** (danh sách chưa nộp) → chuyển `FlatList` + `React.memo` row khi làm tính năng kế tiếp ở 2 màn đó. Persona trung tâm (100+ HS) sẽ lag nếu để `.map`.
3. **🟡 Dark mode:** ghi nhận là **quyết định có chủ ý** (tệp GV trung niên, light-first; nền hardcode nên OS-dark không phá layout). Đề xuất: KHÔNG làm bây giờ; để sau khi lên store nếu user yêu cầu. Ghi vào backlog thay vì giả vờ đã đạt.
4. **🟢 Reduced-motion:** thêm 1 check `AccessibilityInfo.isReduceMotionEnabled` trong `SuccessScreen`/`Button` khi tiện — 10 phút, không gấp.

---

## Kết luận chéo 2 skill

- **App**: nền tảng UX đã vững sau vòng 1 (touch/feedback/states/safe-area/emoji đều đạt) — gap còn lại tập trung ở **accessibility cho screen-reader** và **hiệu năng danh sách dài**. Không có finding "sát thủ niềm tin" mới.
- **Landing**: điểm yếu là **dấu vân tay AI về cấu trúc** (eyebrow dày, lưới 3-thẻ lặp, mockup div) — trùng với 2 finding "critical" hallmark từng chỉ ra mà đợt redesign bị hoàn. Vòng này có lối ra **rẻ hơn redesign**: thay mockup div bằng **screenshot thật** + tỉa eyebrow + đổi layout 1 section — giữ nguyên hồn trang hiện tại (đã được duyệt), không phải làm lại từ đầu.

### Thứ tự đề xuất
1. Landing: screenshot thật thay div-phone + tỉa eyebrow + đổi layout "Hợp với ai" + gộp nhãn CTA (nửa ngày, không đổi hồn trang)
2. App: accessibility pass 30-40 nút icon (1 buổi)
3. App: FlatList 2 tab dài (gắn vào lần sửa màn đó)
4. Vụn: em-dash landing, reduced-motion app

*Liên quan: `docs/uiux-journey-review.md` (vòng 1 — đã sửa xong), hallmark audit (trước đó).*
