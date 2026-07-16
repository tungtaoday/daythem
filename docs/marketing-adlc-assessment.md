# GieoChữ Marketing System — Đánh giá theo ADLC (Agent-Driven Development Lifecycle)

> Câu hỏi: hệ thống marketing GieoChữ hiện tại (`C:\DayThem\marketing\`) đã đi theo tiêu chí **Agent-Driven Development Lifecycle** chưa?
> Phạm vi đánh giá: bản fork đã cấu hình lại cho GieoChữ (xem `marketing/README-GieoChu.md`, `docs/marketing-system-plan.md`).
> Ngày: 2026-07-10.

---

## 0. ADLC dùng ở đây nghĩa là gì

Không có định nghĩa ADLC đóng cứng trong repo, nên tài liệu này dùng cách hiểu phổ biến của **Agent-Driven Development Lifecycle**: một vòng đời trong đó **các agent chuyên trách tự lái từng pha** của quy trình tạo–kiểm–giao–đo–học, thay vì con người làm thủ công từng bước. Con người giữ vai **định hướng + phê duyệt (gate)**, agent làm phần nặng.

"Sản phẩm" mà lifecycle này tạo ra ở đây không phải code, mà là **chiến dịch/nội dung marketing**. Vì vậy ADLC được áp vào vòng đời của *artifact marketing*: Spec → Plan → Build → Verify → Ship → Observe → Learn.

### 7 pha ADLC + 8 tiêu chí xuyên suốt (thang đo)

| Pha | Ý nghĩa |
|-----|---------|
| 1. Specify | Có "nguồn chân lý" mô tả ý định, ràng buộc |
| 2. Plan / Design | Phân rã thành giả thuyết/nhiệm vụ có thể thực thi |
| 3. Build / Generate | Agent sinh artifact |
| 4. Verify / Test | Kiểm chứng chất lượng/rủi ro trước khi giao |
| 5. Ship / Deploy | Phát hành, có gate kiểm soát |
| 6. Observe / Measure | Thu telemetry về hiệu quả |
| 7. Learn / Improve | Feedback → vòng lặp sau tốt hơn |

| Tiêu chí xuyên suốt | Ý nghĩa |
|---------------------|---------|
| A. Agent chuyên trách + điều phối | Mỗi pha có agent riêng, có orchestrator |
| B. Skills/tools tái sử dụng | Năng lực đóng gói module |
| C. Contracts (I/O schema) | Đầu ra agent có schema, được validate |
| D. Memory/State bền | Trạng thái lưu lại giữa các vòng |
| E. Human-in-the-loop | Có điểm phê duyệt của người |
| F. Guardrails/An toàn | Chặn hành vi rủi ro |
| G. Observability/Traceability | Log được ai làm gì, tốn bao nhiêu |
| H. Lặp & tăng dần | Chạy theo chu kỳ, cải thiện dần |

---

## 1. Bản đồ hệ thống ↔ các pha ADLC

```
        SPECIFY            PLAN/DESIGN         BUILD           VERIFY          SHIP           OBSERVE         LEARN
     project.yaml   →   strategy S7 +   →   content C1/C3 →  devils_advoc. → distribution → sync-metrics → analytics A7
     (source of         analytics A2       (+ image C11)     A1 + human      G9/G11 +       (FB Graph)     pattern extract
      truth)            (score/tier)                          review          Telegram                      → inject ngược
        │                   │                   │               │               │              │              │
        └───────────────────┴───────────────────┴──── DB (SQLite) ────────────┴──────────────┴──────────────┘
                        ScanReport · Hypothesis · ScheduledPost · Pattern · AudienceIntel · AgentOutput
```

9 agent · 59 skill · contracts + validator · orchestrator (executor/scheduler/feedback/event_bus).

---

## 2. Scorecard theo 7 pha

| Pha | Trạng thái | Bằng chứng | Ghi chú |
|-----|-----------|-----------|---------|
| **1. Specify** | ✅ Đạt | `project.yaml` inject vào MỌI agent; `search_seeds`, angles, tone, avoid | Nguồn chân lý config-driven, sửa 1 file đổi cả hệ thống |
| **2. Plan/Design** | ✅ Đạt | `strategy` (S7 experiment design) → `analytics` (A2 opportunity scoring, tier ≥72/45-71/<45) | Có phân rã signal → hypothesis có điểm & tier |
| **3. Build/Generate** | ✅ Đạt | `content` agent (C1 hook, C3 shortform) sinh bài; `image_tools` + C11 sinh ảnh (đã test ra JPG đúng brand) | Đã chạy thật, ra nội dung + ảnh GieoChữ |
| **4. Verify/Test** | ✅ **Đạt (mới bổ sung)** | `devils_advocate` (A1) cho *hypothesis*; **eval harness `marketing/eval/`** (agent-as-judge chấm chất lượng + cổng an toàn pháp lý/thuế/bịa-số, gate recall 1.0); human review | Đã vá bằng eval harness — xem `marketing/eval/README.md`. Còn có thể nâng bằng agent compliance chuyên sâu (gap #1) |
| **5. Ship/Deploy** | ✅ Đạt (chủ ý manual) | Draft → approve/reject; publish có gate; `posting_mode: manual`, scheduler tắt | An toàn; "agent-driven" bị hạ autonomy có chủ đích (đăng tay) |
| **6. Observe/Measure** | ⚠️ **Một phần** | `sync-metrics` (FB Graph) + `AgentOutput` log `cost_usd`/`duration_ms`; `/stats` | **Vòng đo chưa "sống"**: FB để trống → chưa kéo được metrics thật |
| **7. Learn/Improve** | ⚠️ **Một phần** | `analytics` A7 pattern extraction → Pattern DB → inject ngược vào mọi agent call | Cơ chế đầy đủ, nhưng **phụ thuộc pha 6** — chưa có metric thật thì học chạy khan |

---

## 3. Scorecard theo 8 tiêu chí xuyên suốt

| Tiêu chí | Trạng thái | Bằng chứng |
|----------|-----------|-----------|
| **A. Agent chuyên trách + điều phối** | ✅ Đạt | 9 agent (research/strategy/content/analytics/devils_advocate/distribution/...); `src/orchestrator/` (executor, scheduler, event_bus, feedback) |
| **B. Skills/tools tái sử dụng** | ✅ Đạt | 59 skill (R/C/S/A/G/D) load động; `src/tools/` (search, image, notifications) |
| **C. Contracts (I/O schema)** | ✅ Đạt | `src/agents/contracts.py` + `validator.py`; output agent parse JSON + validate schema |
| **D. Memory/State bền** | ✅ Đạt | SQLite: ScanReport, Hypothesis, Pattern, AudienceIntel, ScheduledPost, AgentOutput |
| **E. Human-in-the-loop** | ✅ Đạt | Duyệt từng bài (approve/edit/reject); Telegram gửi bài để đăng tay |
| **F. Guardrails/An toàn** | ✅ Đạt (mạnh) | Manual-only, `ENABLE_SCHEDULER` mặc định tắt, auto-comment tắt, `avoid[]` trong project.yaml, FB token để trống |
| **G. Observability/Traceability** | ✅ Đạt | `AgentOutput` log input/output/`cost_usd`/`duration_ms`/skill/phase mỗi call |
| **H. Lặp & tăng dần** | ✅ Đạt | Vòng tuần Discover→Build→Ship→Measure→Learn; playbook YAML (khi bật) |

---

## 4. Kết luận tổng

**Đã bám ADLC ở mức CAO về khung, nhưng CHƯA khép kín ở khâu kiểm chứng & đo lường.**

- **Điểm rất mạnh (7/8 tiêu chí xuyên suốt đạt):** agent chuyên trách + orchestrator, skills module, contracts, memory bền, human gate, guardrails, observability. Đây là "xương sống" của một hệ ADLC thật — không phải script gọi LLM rời rạc.
- **Verify (pha 4): đã vá** bằng eval harness (`marketing/eval/`) — agent-as-judge chấm chất lượng + cổng an toàn, gate recall 1.0.
- **Còn "một phần": Observe (6) & Learn (7)** — liên đới nhau: chưa nối metric thật (FB trống) nên vòng học chạy khan.

**Ước lượng độ phủ ADLC: ~82–86%** (tăng sau khi có eval harness). Khung agent-driven đúng chuẩn; cổng verify nội dung đã có. Phần còn thiếu chủ yếu là **vòng feedback định lượng** (nối metric thật) — thứ biến "pipeline sinh nội dung" thành "lifecycle tự cải thiện".

---

## 5. Khoảng trống & khuyến nghị (để đạt ADLC đầy đủ)

| # | Khoảng trống | Vì sao quan trọng | Đề xuất |
|---|--------------|-------------------|---------|
| 1 | **Không có cổng Verify tự động cho nội dung** | Pillar pháp lý/thuế mà sai luật = rủi ro thật; hiện chỉ dựa human review | Thêm agent **fact-check/compliance** (một pha 4 riêng): kiểm định dẫn nguồn TT29/thuế, chặn khẳng định tuyệt đối, cờ đỏ hù dọa. Reuse pattern "adversarial verify". |
| 2 | **Vòng đo chưa sống (FB trống)** | Không có metric thật → pha 6 & 7 chạy khan, hypothesis không được validate | Nối `FACEBOOK_PAGE_ID` + token **của page GieoChữ**; hoặc nhập tay metric group vào DB để feedback loop có dữ liệu |
| 3 | **Hypothesis còn "rational logic"** | Layer 7 (behavioral framework: user_state/decision_trigger/observable_action) mới là kế hoạch, chưa implement | Thêm field behavioral vào Hypothesis + update prompt S7/A1 (đã mô tả trong `SYSTEM_MAP.md` Layer 7) |
| 4 | ~~Contracts validate SHAPE, không validate CHẤT LƯỢNG~~ ✅ **ĐÃ LÀM** | Đúng schema ≠ hay/đúng brand | **Đã build `marketing/eval/`**: rubric từ project.yaml + agent-as-judge + golden-set regression (gate recall 1.0). Còn lại: mở rộng golden-set, tinh chỉnh ngưỡng |
| 5 | **Chưa version-hóa spec theo chiến dịch** | Khó truy vết "tuần này chạy spec nào" | Snapshot `project.yaml` + tham số plan vào DB mỗi vòng (versioned campaign spec) |
| 6 | **Autonomy hạ tay có chủ đích** | Đăng tay là an toàn nhưng làm pha Ship/Distribute không "agent-driven" trọn vẹn | Chấp nhận (đúng lựa chọn cho tệp GV). Khi tin tưởng, bật auto cho Fanpage trước (rủi ro thấp), giữ group tay |

**Ưu tiên:** (1) → (2) → (4). Làm xong (1)+(2) là khép kín vòng lifecycle; (4) nâng chất lượng.

---

## 6. Đối chiếu với 6-stage workflow của team

Team `claude/` dùng 6 pha: document-uc → design-domain → tests → code → run-tests → review. Hệ marketing là **ADLC ở runtime** (agent lái lúc vận hành), còn 6-stage là **SDLC lúc xây tool**. Chúng bổ trợ, không thay thế:

| 6-stage (xây hệ) | ADLC (vận hành hệ) |
|------------------|--------------------|
| document-uc / design | Specify (project.yaml) + Plan (S7/A2) |
| tests / run-tests | Verify (A1 + *cần bổ sung fact-check*) + Observe |
| code | Build (content/image agent) |
| review | Human gate + Learn (A7) |

> Ghi chú: bản thân việc *xây* hệ marketing GieoChữ ở phiên này đi theo **Flexible mode** (fork + cấu hình lại, không phải domain flow mới) — hợp lệ theo `daythem-overrides.md`.
