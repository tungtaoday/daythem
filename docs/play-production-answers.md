# Google Play — Đáp án TRUNG THỰC cho form Production Access

> Lập 09/08/2026. Dùng khi apply production (~19–21/08, sau khi đủ 14 ngày closed test).
>
> **Vì sao không dùng bộ đáp án của Testers Community:** file của họ khai *"đã thêm
> Google Sign-in, chọn ngôn ngữ, walkthrough"* — **cả ba đều không tồn tại trong app**.
> Google có telemetry thật để đối chiếu (số phiên, thời lượng, opt-in), và người duyệt
> mở app kiểm được. Khai tính năng không có = misrepresentation, nhẹ thì từ chối, nặng
> thì dính cờ tài khoản. Trong khi đó chuyện THẬT của mình đủ tốt để kể.
>
> Đối chiếu dữ liệu 09/08: 12 tester của dịch vụ — 5 người chưa từng mở app, 7 người
> mỗi người 1–3 sự kiện. Đồng hồ 14 ngày chạy nhờ họ giữ opt-in, nhưng engagement mỏng.
> **⚠️ Trước khi apply: đưa thêm 3–5 giáo viên thật vào test và cập nhật các ô [.....]
> bên dưới bằng chuyện thật của họ.**

---

## Cách dùng

- Đáp án viết sẵn **tiếng Anh** (form của Google bằng tiếng Anh). Ghi chú tiếng Việt
  ở dưới mỗi câu — đọc để hiểu vì sao viết vậy, đừng dán phần ghi chú.
- Chỗ `[.....]` là chỗ **phải điền chuyện thật** trước khi nộp. Còn trống thì đừng nộp.

---

### Q1 — How did you recruit users for your closed test?

```
Through two channels: (1) direct outreach to teachers and tutors in my personal
and professional network — the app's actual target users; and (2) a paid tester
community, to reliably reach the minimum tester count required for the 14-day
closed testing window.
```

*Ghi chú: khai dùng dịch vụ tester là hợp lệ — Google không cấm, câu hỏi mẫu của chính
họ còn gợi ý phương án này. Giấu mới là rủi ro.*

### Q2 — How easy was it to recruit testers?

Chọn: **Somewhat difficult**

*Ghi chú: chọn thật. Tuyển giáo viên thật rất chậm (đó là lý do phải dùng dịch vụ).
Chọn "Easy" như văn mẫu thì mâu thuẫn với chính câu 1.*

### Q3 — Describe the engagement you received from testers

```
Engagement was mixed, which taught us a lot. Community testers installed the app
and kept it through the testing window, but used it lightly. The most valuable
engagement came from teachers we onboarded directly: [.....số GV thật.....] tutors
created real classes with real students and used attendance and tuition tracking
in their daily work. We supported them 1-on-1 (via Zalo, Vietnam's main messaging
app) and observed where they got stuck.
```

*Ghi chú: câu này Google đối chiếu với telemetry được — nên chủ động thừa nhận
"mixed". Ô [...] điền sau khi có GV thật tham gia. Nếu tới ngày nộp vẫn CHƯA có GV
thật nào → hoãn nộp vài ngày và đi kiếm, đừng nộp với engagement toàn số 0.*

### Q4 — Summary of the feedback you received, and how you collected it

```
Collected through 1-on-1 chat sessions with teachers, a tester-community feedback
report, and our own monitoring. Key items: (1) the store description could use
clearer feature keywords; (2) some testers suggested social login and an in-app
walkthrough — we deliberately kept phone+password login (it matches how Vietnamese
tutors work, phone number IS their identity with parents) and noted the walkthrough
for our roadmap; (3) [.....một góp ý thật từ GV thật, càng cụ thể càng tốt.....]
```

*Ghi chú: nhắc tới góp ý của dịch vụ là thật (họ có gửi report), và nói rõ mình
CÂN NHẮC rồi quyết định khác — trưởng thành hơn là vờ đã làm theo.*

### Q5 — Who is the intended audience for your app?

```
Independent teachers and tutors in Vietnam who run their own extra classes —
typically one teacher managing 1–5 small classes from home. The app is
Vietnamese-only by design. It is a tool for adult teachers; it is not directed
at children.
```

*Ghi chú: câu "not directed at children" khớp với khai báo Target audience đã nộp.*

### Q6 — How does your app provide value?

```
It replaces the paper notebook + scattered chat messages that most Vietnamese
tutors currently use. One place for: one-tap attendance (whole class defaults to
present), tuition tracking across three billing modes (monthly / per-session /
per-course), pre-written payment reminders the teacher sends privately via Zalo
(the app never messages anyone itself), individual progress cards for parents,
and a reference personal-income-tax estimate for tutors registering as household
businesses under new regulations.
```

*Ghi chú: nguyên tắc như bộ chữ store — nói rõ app KHÔNG tự gửi tin.*

### Q7 — How many installs do you expect in your first year?

Chọn khung **thấp nhất bao được 1.000** (thường là "1,000 – 10,000" hoặc tương đương).

*Ghi chú: kế hoạch GTM năm đầu là vài trăm tới ~1.000 GV. Văn mẫu chọn 10k–100k —
đừng. Số kỳ vọng không bị chấm điểm, nhưng số thật thì không bao giờ phản chủ.*

### Q8 — What changes did you make based on the closed test?

```
Real changes shipped during the testing window:
- Phone-number normalization across the whole auth flow: testers signing in with
  "+84..." vs "0..." formats could previously end up with duplicate empty accounts
  (losing access to their class data). Now every format resolves to one account.
- Enriched first-run experience and demo data after watching testers land on
  empty screens.
- Fixed our public support email and expanded the privacy policy (data retention
  period, third-party OCR disclosure) after auditing the support flow.
- Tightened phone-number validation at registration after invalid numbers
  appeared during testing.
- [.....nếu có sửa gì theo góp ý GV thật, thêm vào đây.....]
```

*Ghi chú: TẤT CẢ các dòng trên đều đã xảy ra thật (02–09/08, có commit). Dòng cuối
về validation — tôi sẽ vá trước ngày nộp để câu này đúng 100%.*

### Q9 — How did you decide your app is ready for production?

```
Three signals: (1) an automated end-to-end test suite (200+ tests) has stayed
green through every change; (2) the 14-day closed test produced zero crashes and
zero ANRs in Play Console; (3) the core daily loop — attendance, tuition,
parent report — was exercised by real tutors with real classes, not just by us.
```

*Ghi chú: vế (3) chỉ đúng khi đã có GV thật dùng — quay lại điều kiện ở Q3. Vế (2)
kiểm trong Play Console → Quality trước khi nộp; nếu có crash thì sửa số cho thật.*

### Q10 — What did you do differently this time? *(câu này dành cho app từng bị từ chối — lần đầu nộp có thể được hỏi dạng khác)*

```
This is our first production application. What we did deliberately from the
start: treated closed testing as a real launch rehearsal — hardened the auth
flow, verified every public contact channel actually works, prepared reviewer
access with realistic demo data, and recruited both community testers (for
coverage) and real teachers (for depth).
```

---

## Checklist trước khi bấm Apply (~19–21/08)

- [ ] Ô "testers currently opted-in" trong Play Console vẫn **≥ 12 liên tục** — kiểm 2–3 ngày/lần từ giờ tới đó
- [ ] **≥ 3 giáo viên thật** đã cài và tạo lớp thật → điền các ô `[.....]`
- [ ] Play Console → Quality: 0 crash / 0 ANR (nếu có thì sửa Q9 cho thật)
- [ ] Bản vá validation SĐT đã deploy (để Q8 đúng 100%)
- [ ] Đọc lại từng đáp án — chỗ nào không còn đúng thì sửa, **đừng nộp câu nào mình không đứng sau được**

## Liên quan

- [Audit toàn cảnh](audit-luong-toan-canh.md) — phát hiện #2: rủi ro engagement
- [Checklist lên store](store-launch-checklist.md)
- File của dịch vụ: `feedback/vn.daythem.app_production.pdf` — **tham khảo cấu trúc câu hỏi, KHÔNG dán đáp án**
