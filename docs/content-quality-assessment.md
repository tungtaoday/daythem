# GieoChữ — Đánh giá độc lập chất lượng Content

> Ngày: 2026-07-14. Phương pháp: sinh **12 bài** phủ ma trận 5 pillar × personas → chấm **độc lập** qua eval harness (agent-as-judge, không phải người viết tự chấm).
> Kết luận thẳng thắn: **content thô ra chưa đạt — eval fail phần lớn**. Đã diễn ra vòng test → chẩn đoán → vá → test lại (cải thiện rõ). Thuế vẫn là pillar khó nhất.

---

## 1. Kết quả vòng test đầu (12 bài)

| Verdict | Số bài |
|---------|:---:|
| ✅ PASS | 2 |
| 🟡 REVISE | 1 |
| ❌ FAIL | 7 |
| ⚠️ Lỗi sinh (JSON hỏng) | 2 |

**Điểm TB: 0.755** · Chiều yếu nhất: **CTA 0.68** (hay generic/bán hàng). Chiều tốt: pillar_fit 0.81, audience_fit 0.80.

### 4 lỗi HỆ THỐNG (eval bắt được)
| Cổng fail | Số lần | Ví dụ thật |
|-----------|:---:|-----------|
| `no_fabricated_stats` | 3 | "lãng phí 30 phút mỗi buổi", "điểm danh 10 giây cho 30 em", "2–3 phụ huynh quên nộp/tháng" — **bịa số lợi ích** (app beta chưa có số đo) |
| `legal_tax_safety` | 2 | Nói ngưỡng thuế "khác nhau theo địa phương" (SAI — toàn quốc); thiếu "đối chiếu cơ quan thuế"; hù dọa "bộ thuế gọi mới giật mình" |
| `no_false_features` | 2 | "một nút nhấn, gửi riêng qua Zalo" (đọc như auto-gửi); bịa tính năng "phân tích điểm yếu tự động" |
| `no_avoid_violations` | 1 | Lộ chữ "quảng cáo miễn phí" (đòn bẩy GTM bị viết thẳng vào bài → nghe như pitch startup) |
| *Lỗi sinh JSON* | 2 | Model trả JSON hỏng (unterminated string) → không parse được |

---

## 2. Vá đã áp (từ chẩn đoán)

Thêm block **`content_hard_rules`** (7 quy tắc cứng, có ví dụ CẤM cụ thể) vào `project.yaml`, **inject lên ĐẦU** context content (ưu tiên cao nhất):
1. Cấm bịa số lợi ích/thời gian → dùng định tính ("nhanh hơn hẳn").
2. Bài thuế/pháp lý: bắt buộc "đối chiếu cơ quan thuế"; không nói ngưỡng theo địa phương; không hù dọa; không con số cứng.
3. Zalo: luôn ghi "app soạn sẵn, cô/thầy mở Zalo gửi".
4. GTM playbook chỉ để CHỌN chủ đề, KHÔNG viết chữ "quảng cáo/viral/K-factor" vào bài.
5. Hashtag tiếng Việt; hook ≤2 câu; CTA cụ thể không generic.

Đồng thời eval đã có cổng `no_false_features` (critical) từ trước.

---

## 3. Kết quả test lại (6 category vốn FAIL hết)

| | Trước vá | Sau vá |
|--|:---:|:---:|
| Thuế / Cô Lan | FAIL (legal) | 🟡 REVISE 0.73 |
| Thuế / Cô Hoa | FAIL (legal) | ❌ FAIL 0.70 (false_features) |
| Mẹo vận hành / Thầy Tuấn | FAIL (bịa số) | ✅ PASS 0.79 |
| Báo cáo riêng / Cô Hoa | FAIL (false_feat) | ✅ PASS 0.84 |
| Demo / Cô Hoa | FAIL (bịa số) | 🟡 REVISE 0.68 (avoid) |
| Demo / Thầy Tuấn | FAIL (bịa số) | ✅ PASS 0.76 |

→ **6 FAIL → 3 PASS / 2 REVISE / 1 FAIL.** Bịa số + sai tính năng **đã fix phần lớn**.

---

## 4. Điểm còn yếu (cần xử tiếp)

1. 🔴 **Pillar THUẾ là khó nhất** — vẫn dễ fail (legal_safety + đôi khi false_feature). Đề xuất: (a) làm **template thuế cố định** có sẵn disclaimer + câu chữ an toàn; (b) hoặc **bắt buộc người duyệt** cho mọi bài thuế/pháp lý (không auto-đăng).
2. 🟡 **Tone bán hàng lộ** ở vài bài Demo/Báo cáo (avoid) — GTM đôi khi rò rỉ. Quy tắc cứng #4 giảm nhưng chưa hết.
3. 🟡 **CTA yếu nhất (0.68)** — hay "Thử miễn phí hôm nay". Nên ép CTA mềm (comment từ khoá nhận mẫu).
4. ⚠️ **Robustness JSON:** ~2/14 lần model trả JSON hỏng → nên thêm retry/parse chịu lỗi ở luồng sinh (hiện chỉ báo lỗi).

---

## 5. Ý nghĩa
- **Eval harness đang làm đúng vai** — nó bắt thật các lỗi (bịa số, sai luật thuế, sai tính năng, pitch lộ) mà nếu không có sẽ đăng nhầm. Đây chính là giá trị của cổng Verify (ADLC).
- **Không nên auto-đăng content thô.** Quy trình đúng: sinh → **eval gác cổng** → chỉ PASS mới đưa người duyệt → đăng tay. Bài REVISE/FAIL sửa theo `suggested_fix` của judge.
- Thuế/pháp lý: **luôn người duyệt + dẫn nguồn**, không phụ thuộc AI.

Chi tiết từng bài: `scratchpad/content_test.json`. Tham khảo nâng chất hook/format: `docs/viral-content-reference.md`.
