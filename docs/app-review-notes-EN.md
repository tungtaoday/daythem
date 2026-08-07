# App Review Notes — bản tiếng Anh cho người duyệt

> Vì sao phải tiếng Anh: **người duyệt của Apple/Google đọc tiếng Anh**, mà giao diện
> GieoChữ 100% tiếng Việt. Không có bản đồ điều hướng bằng tiếng Anh, họ mở app ra
> không biết bấm đâu — và hai giới hạn quan trọng (Zalo không tự gửi, thuế chỉ tham
> khảo) sẽ không được đọc, dễ bị hiểu nhầm thành app tự nhắn tin và tự nộp thuế.
>
> Dán khối dưới vào: **App Store Connect → App Review Information → Notes**
> và **Play Console → App access → Instructions**.

---

## DÁN NGUYÊN KHỐI NÀY

```
ABOUT THIS APP

GieoChu ("Sowing Letters") is a class-management tool for independent tutors in
Vietnam. Teachers use it to take attendance, track who has paid tuition, and
prepare progress reports for parents. The entire user interface is in Vietnamese
because it is built for the Vietnamese market only.

TEST ACCOUNT

Phone number: 0905550002
Password:     test123

Sign in with the PHONE NUMBER and PASSWORD above. No OTP / SMS code is required.
The account already contains two classes with students, attendance history and
tuition records, so every screen has data to display.

HOW TO NAVIGATE (the UI is in Vietnamese)

Bottom tab bar, left to right:
  1. "Hom nay"   = Today       - upcoming session, who has not paid
  2. "Lop hoc"   = Classes     - list of classes
  3. "Hoc sinh"  = Students    - all students, attendance % and debt
  4. "Hoc phi"   = Tuition     - money collected / outstanding per month
  5. "Bao cao"   = Reports     - weekly summary and parent report cards

SUGGESTED WALKTHROUGH

1. Open tab 2 ("Lop hoc") and tap the first class, "Toan 8 Chieu".
   You will see a class hub with six action tiles.

2. Tap the green button "Diem danh buoi hom nay" (= Take attendance for today).
   All students default to PRESENT; tapping a student marks them absent and lets
   the teacher record a reason. This is the core daily action.

3. Back on the class hub, tap "Thu tien" (= Collect payment) to mark tuition as
   paid for individual students.

4. Open tab 4 ("Hoc phi") to see the monthly total and who still owes money.
   The demo data intentionally leaves 4 students unpaid.

5. Open tab 5 ("Bao cao") and tap the yellow card at the top,
   "Gui bao cao rieng tung be" (= Send an individual report card per child),
   to see the report card that a teacher sends to one parent.

6. The two classes use different billing modes on purpose:
   - "Toan 8 Chieu"  = 500,000 VND per MONTH
   - "Van 9 Toi"     = 150,000 VND per SESSION (calculated from attendance)

IMPORTANT CLARIFICATIONS

a) MESSAGING - the app does NOT send anything automatically.
   Where you see a Zalo button (Zalo is Vietnam's dominant messaging app), the
   app only PRE-WRITES the message text and opens Zalo. The teacher reviews it
   and presses send themselves. The app has no messaging permission, does not
   read any conversation, and never contacts parents on its own.

b) TAX - the app does NOT file anything with any authority.
   The tax screen estimates personal income tax from tutoring income and
   generates a Vietnamese tax form (09/KK-TNCN) for the teacher's own REFERENCE.
   The teacher files it themselves through the government portal. The app has no
   connection to any tax authority system.

c) NO PAYMENTS - the app never processes or transfers money. Teachers receive
   tuition in cash or by bank transfer outside the app and simply record it.

PRIVACY

Student names and parent contact details are entered manually by the teacher,
who is the account owner and data controller. The app is intended for adult
teachers only and is not directed at children. There are no advertising,
analytics or tracking SDKs in the build. Data is deletable from inside the app
(Profile > Delete account) and from https://gieochu.vn/delete-account

Privacy policy: https://gieochu.vn/legal

The optional "import students from a photo" feature sends the selected image to
Google Gemini for text recognition only. The image is processed in memory and is
never stored on our servers.

CONTACT

If anything is unclear or you cannot access a feature, please contact us before
rejecting - we will respond within one business day.
```

---

## Ghi chú cho anh (không dán vào form)

**Vì sao khối này viết như vậy:**

| Đoạn | Chặn rủi ro gì |
|---|---|
| Bản đồ 5 tab tiếng Việt → tiếng Anh | Người duyệt không biết bấm đâu → tưởng app rỗng (điều 2.1) |
| Lộ trình 6 bước | Dẫn họ đi qua đúng các tính năng chính → chặn cáo buộc "app quá đơn giản" (điều 4.2) |
| Mục (a) về Zalo | Chặn hiểu nhầm app tự nhắn tin cho phụ huynh |
| Mục (b) về thuế | Chặn hiểu nhầm app kê khai thuế thay người dùng |
| Mục (c) không thanh toán | Chặn bị xếp vào nhóm app tài chính, vốn bị soi rất kỹ |
| Đoạn Privacy | Chặn rủi ro lớn nhất còn lại: dữ liệu trẻ vị thành niên (điều 5.1.1) |
| Câu cuối mời liên hệ | Nhiều người duyệt sẽ hỏi thay vì từ chối thẳng — đỡ mất một vòng |

**Bỏ dấu tiếng Việt là cố ý.** Viết "Diem danh" thay vì "Điểm danh" để người duyệt đối chiếu được với nhãn trên màn hình kể cả khi font hoặc hệ thống của họ hiển thị dấu không chuẩn.

**Cập nhật khi đổi dữ liệu demo.** Lộ trình nhắc đích danh "Toan 8 Chieu", "Van 9 Toi" và "4 học sinh chưa nộp". Nếu sau này dữ liệu demo thay đổi thì sửa ghi chú cho khớp — người duyệt làm theo mà không thấy đúng như mô tả là mất tin ngay.

## Liên quan

- [Bộ chữ đăng store](store-listing-copy.md) — mục 8 có bản tiếng Việt cũ, nay thay bằng bản này
- [Checklist lên store](store-launch-checklist.md)
