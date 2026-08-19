# Google Play — Đáp án TRUNG THỰC cho form Production Access

> Lập 09/08/2026. Dùng khi apply production (~19–21/08, sau khi đủ 14 ngày closed test).
>
> **Vì sao không dùng bộ đáp án của Testers Community:** file của họ khai *"đã thêm
> Google Sign-in, chọn ngôn ngữ, walkthrough"* — **cả ba đều không tồn tại trong app**.
> Google có telemetry thật để đối chiếu (số phiên, thời lượng, opt-in), và người duyệt
> mở app kiểm được. Khai tính năng không có = misrepresentation, nhẹ thì từ chối, nặng
> thì dính cờ tài khoản. Trong khi đó chuyện THẬT của mình đủ tốt để kể.
>
> **✅ CẬP NHẬT 19/08 — đã điền hết ô trống bằng dữ liệu thật, dán được ngay:**
>
> | Nhóm | Thực tế đo được |
> |---|---|
> | 12 tester dịch vụ | Giữ opt-in đủ 14 ngày, nhưng **5/12 chưa từng mở app** |
> | **Lê To Co So Mi** (14/08) | **5 lớp · 11 HS · 5 buổi điểm danh · 6 lần thu phí · dùng 3 ngày khác nhau · còn hoạt động** |
> | **Cô Quỳnh** (15/08) | Đăng ký → bỏ qua bước tạo lớp → màn trống → không quay lại |
>
> Cả hai ca đều được kể trong Q3 — **kể cả ca thất bại**. Nó chứng minh mình theo dõi
> người dùng thật và học từ dữ liệu, thuyết phục hơn hẳn khai "mọi thứ đều tốt".

---

## Cách dùng

- Đáp án viết sẵn **tiếng Anh** (form của Google bằng tiếng Anh). Ghi chú tiếng Việt
  ở dưới mỗi câu — đọc để hiểu vì sao viết vậy, **đừng dán phần ghi chú**.
- Chỉ dán phần trong khung ```` ``` ````.
- Trước khi nộp, đọc lại **Checklist** ở cuối file — có một dòng trong Q8 phải xoá
  nếu chưa vá xong.

---

### Q1 — How did you recruit users for your closed test?

```
Through two channels: (1) direct outreach to teachers and tutors in my personal
and professional network - the app's actual target users; and (2) a paid tester
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
Engagement was mixed, and the difference between the two groups is exactly what
we learned from.

Testers recruited through a paid community installed the app and stayed opted in
for the full window, but used it lightly - most opened it once.

The engagement that mattered came from real tutors. One of them, in her first
five days, created 5 classes with 11 students, recorded attendance for 5 sessions
and marked 6 tuition payments, returning on 3 separate days. Her class names and
schedules are real teaching data, not test input.

A second tutor registered, completed the profile step, skipped the "create your
first class" step, landed on an empty home screen and never returned. We could
see this precisely in our own activity logs, and it told us more than any survey
would have.
```

*Ghi chú: câu này Google **đối chiếu được với telemetry của họ** — nên chủ động
thừa nhận "mixed" thay vì tô hồng. Con số lấy từ `/admin/users` ngày 19/08
(Lê To Co So Mi: 5 lớp · 11 HS · 3 ngày dùng). **Kiểm lại số trước khi nộp**,
cô ấy vẫn đang dùng nên số sẽ tăng.*

*Kể cả ca thất bại (cô Quỳnh) là CỐ Ý: nó chứng minh mình theo dõi người dùng
thật và học được từ dữ liệu — mạnh hơn nhiều so với khai "mọi thứ đều tốt".*

### Q4 — Summary of the feedback you received, and how you collected it

```
Collected through 1-on-1 chat sessions with teachers, a tester-community feedback
report, and our own monitoring. Key items: (1) the store description could use
clearer feature keywords; (2) some testers suggested social login and an in-app
walkthrough - we deliberately kept phone+password login (it matches how Vietnamese
tutors work, phone number IS their identity with parents) and noted the walkthrough
for our roadmap; (3) our own activity logs showed a real tutor dropping off at the
skippable "create your first class" onboarding step - a walkthrough or a guided
empty state is now our top usability fix.
```

*Ghi chú: nhắc tới góp ý của dịch vụ là thật (họ có gửi report), và nói rõ mình
CÂN NHẮC rồi quyết định khác — trưởng thành hơn là vờ đã làm theo.*

### Q5 — Who is the intended audience for your app?

```
Independent teachers and tutors in Vietnam who run their own extra classes -
typically one teacher managing 1-5 small classes from home. The app is
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
- Built a per-user health view so we can see exactly which feature each real
  tutor has reached and where they stalled, instead of relying on aggregate
  percentages that are meaningless at small scale.
```

*Ghi chú: 4 dòng đầu đã xảy ra thật (02–09/08, có commit). Dòng cuối là
`/admin/users` dựng 19/08 — cũng thật.*

⚠️ **Dòng "Tightened phone-number validation" chỉ được giữ nếu tôi đã vá xong.**
Tính tới 19/08 **CHƯA vá** (đó là phát hiện #3 trong audit — số 8 chữ số vẫn lọt).
Trước khi nộp: hoặc để tôi vá (15 phút), hoặc **xoá dòng đó đi**. Đừng khai việc
chưa làm.

### Q9 — How did you decide your app is ready for production?

```
Three signals: (1) an automated end-to-end test suite of 246 tests has stayed
green through every change; (2) the closed test produced no crash or ANR reports
in Play Console; (3) the core daily loop - attendance, tuition tracking, parent
reporting - has been used by a real tutor managing 5 real classes across several
days, not only by us. The same app is already live on the App Store, where it
passed review on the first submission.
```

*Ghi chú: 246 là số test THẬT ngày 19/08 — đọc lại trước khi nộp, số sẽ tăng.
Vế (2) kiểm ở Play Console → Quality; nếu có crash thì sửa câu cho đúng.
Vế iOS live là điểm cộng thật: cùng một app đã qua vòng duyệt khắt khe hơn.*

### Q10 — What did you do differently this time? *(câu này dành cho app từng bị từ chối — lần đầu nộp có thể được hỏi dạng khác)*

```
This is our first production application, so there is no previous attempt to
compare against. What we did deliberately from the start: we treated closed
testing as a real launch rehearsal rather than a formality. We hardened the
authentication flow, verified that every public contact channel actually
receives mail, prepared reviewer access with realistic demo data, and recruited
two different kinds of testers - a paid community for device coverage, and real
tutors for depth of use. The same build is already live on the App Store, where
it was approved on the first submission.
```

---

## Checklist trước khi bấm Apply (~19–21/08)

- [ ] Ô **"testers currently opted-in" ≥ 12 liên tục** trong Play Console — đây là điều kiện cứng, kiểm trước tiên
- [x] ~~≥3 giáo viên thật~~ → **đã có 1 người dùng thật sâu** (5 lớp, 3 ngày) + 1 ca rơi. Q3 kể cả hai, đủ trung thực để nộp
- [ ] Play Console → **Quality: 0 crash / 0 ANR** — nếu có thì sửa câu Q9 cho khớp
- [ ] **Q8 — quyết định một trong hai:** để tôi vá validation SĐT (15 phút) **hoặc xoá dòng "Tightened phone-number validation"**. Tính tới 19/08 chưa vá
- [ ] Cập nhật lại **số test** ở Q9 (đang ghi 246) và **số liệu của Lê To Co So Mi** ở Q3 — cô ấy vẫn đang dùng nên số sẽ tăng. Xem tại `daythem.doitay.vn/admin/users/page`
- [ ] Đọc lại từng đáp án — **đừng nộp câu nào mình không đứng sau được**

## Nộp ở đâu

Play Console → **Testing → Closed testing → track "Alpha"** → nút **Apply for production access**
(hoặc Dashboard → mục *Production* → *Apply for access*). Form hiện đúng 10 câu này.

## Liên quan

- [Audit toàn cảnh](audit-luong-toan-canh.md) — phát hiện #2: rủi ro engagement
- [Checklist lên store](store-launch-checklist.md)
- File của dịch vụ: `feedback/vn.daythem.app_production.pdf` — **tham khảo cấu trúc câu hỏi, KHÔNG dán đáp án**
