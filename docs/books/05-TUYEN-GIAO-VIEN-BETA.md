# Sách 05 — Tuyển giáo viên beta: từ số điện thoại và hội nhóm ra người dùng thật

> Lập 03/08/2026. Dùng khi: cần 12 tester cho CH Play, và cần 10 người dùng thật đầu tiên.
> Hai việc này là MỘT — đừng làm riêng.
>
> **Sự thật khởi điểm (03/08/2026):** kiểm dữ liệu prod cho thấy 9 tài khoản đều là
> tài khoản thử của chính chủ hoặc dữ liệu seed. **Số giáo viên thật = 0.**
> Quyển này viết cho người đang ở vạch xuất phát, không phải người đang mở rộng.

---

## 0. Vì sao đoạn này không có phễu, không có kênh

Ở mức 0 người dùng, mọi thứ gọi là "kênh marketing" đều chưa chạy. Fanpage 0 người theo
dõi thì đăng cho ai đọc. Zalo OA chưa ai bấm Quan tâm. Quảng cáo thì đốt tiền vào một
sản phẩm chưa biết có ai ở lại không.

Mười người dùng đầu tiên **không đến từ kênh nào cả**. Họ đến từ những người anh **gọi
tên được**. Việc của giai đoạn này là làm những thứ **không nhân rộng được**: nhắn tay
từng người, gọi điện, ngồi cạnh họ lúc tạo lớp đầu tiên.

Nghe chậm, nhưng đây là đoạn duy nhất anh học được vì sao người ta ở lại — thứ mà sau này
đổ bao nhiêu tiền quảng cáo cũng không mua được.

---

## 1. Phép tính ngược — cần nhắn bao nhiêu người

CH Play đòi **12 tester opt-in liên tục 14 ngày**. Tuyển đúng 12 là hỏng: kiểu gì cũng có
người đổi máy, gỡ app, hoặc quên. **Tuyển 18–20.**

Tỷ lệ rơi thực tế khi nhắn người quen:

```
100 người nhắn
 → ~50 trả lời            (nhắn riêng, có tên, không phải tin hàng loạt)
 → ~25 đồng ý thử
 → ~15 thật sự cài xong
 → ~12 opt-in và giữ app đủ 14 ngày
```

Với người **thân quen** tỷ lệ cao hơn nhiều, có khi 1 trong 3. Với người **chỉ biết mặt**
thì thấp hơn. Nên:

> **Nhắn 40 người thân quen trước. Đo tỷ lệ THẬT của mình. Rồi mới quyết nhắn thêm bao nhiêu.**

Đừng tin con số của tôi hơn con số của chính anh.

---

# PHẦN A — TỪ SỐ ĐIỆN THOẠI ANH ĐÃ CÓ

## A1. Bước 1 — Lọc danh sách (30 phút, làm một lần)

Mở danh bạ, lướt từ đầu tới cuối. Đừng nghĩ nhiều, cứ chép tên vào 3 nhóm:

| Nhóm | Ai | Nhắn khi nào |
|---|---|---|
| **N1 — Thân, đang dạy thêm** | Đồng nghiệp cũ, bạn học sư phạm, người anh biết chắc đang dạy thêm | **Ngày 1** |
| **N2 — Quen, có thể đang dạy** | Thầy cô của con anh, hàng xóm dạy kèm, bạn của bạn làm giáo viên | Ngày 2–3 |
| **N3 — Biết mặt, chưa thân** | Người trong group Zalo phụ huynh, gặp vài lần, có số nhưng chưa nhắn bao giờ | Ngày 4–5, **và chỉ khi N1+N2 chưa đủ** |

**Quy tắc:** nhắn hết N1 rồi mới sang N2. Nhóm thân trả lời nhanh, cho anh phản hồi thật,
và sửa được kịch bản trước khi dùng với người lạ hơn.

⚠️ **Đừng nhắn hàng loạt cho N3.** Zalo hạn chế tài khoản cá nhân nhắn nhiều người lạ
trong thời gian ngắn — nhẹ thì bị chặn tạm, nặng thì khoá. Mỗi ngày tối đa **10–15 người
chưa thân**, rải ra, mỗi tin viết khác nhau.

## A2. Bước 2 — Tin nhắn đầu tiên

**Ba nguyên tắc, phá là hỏng:**

1. **Có tên người nhận.** "Chào cô Lan" chứ không phải "Chào cô". Không tên = tin rác.
2. **Nói rõ mình đang xin gì.** Đừng vòng vo rồi mới lòi ra nhờ vả.
3. **Cho họ đường lui dễ dàng.** Người ta dễ nhận lời hơn khi biết từ chối không sao.

### Mẫu A — Người thân quen (N1)

```
Chào cô Lan ạ,

Em Tùng đây. Mấy tháng nay em làm một app quản lý lớp dạy thêm tên GieoChữ —
điểm danh, theo dõi ai đóng học phí rồi ai chưa, soạn sẵn tin nhắc phụ huynh
để mình gửi Zalo.

Em đang cần vài thầy cô dùng thử thật để góp ý trước khi đưa lên CH Play.
Cô dùng thử giúp em được không ạ? Miễn phí hoàn toàn, và em kèm tận tay
lúc cài, có gì khó cô cứ nhắn em.

Nếu cô bận thì cô cứ nói thẳng nhé, em không phiền đâu ạ 🌿
```

### Mẫu B — Quen vừa (N2)

```
Chào cô Hà ạ, em Tùng — [nhắc mối liên hệ: con em học lớp cô năm ngoái /
em là bạn anh Nam] ạ.

Em đang làm một app nhỏ cho thầy cô dạy thêm: điểm danh một chạm, biết ngay
ai chưa đóng học phí, và soạn sẵn tin nhắc để mình gửi riêng cho từng phụ huynh
qua Zalo — khỏi phải nhắc chung trong nhóm lớp ngại lắm.

Em đang tìm ít thầy cô dùng thử miễn phí và góp ý. Cô cho em xin 10 phút
hướng dẫn cài được không ạ?
```

### Mẫu C — Mở bằng nỗi đau, dùng khi không chắc họ có đang dạy không

```
Chào cô ạ, em Tùng.

Cô ơi cô còn dạy thêm ở nhà không ạ? Em đang làm app giúp thầy cô quản lý
lớp — cái em nghe nhiều thầy cô than nhất là **nhắc học phí sao cho đỡ ngại**,
nên em làm phần đó kỹ: app soạn sẵn tin có tên con và số tiền để mình gửi
riêng từng phụ huynh, nhắc ai rồi app nhớ giúp.

Nếu cô đang dạy, cô dùng thử miễn phí giúp em nhé, em hướng dẫn tận nơi ạ.
```

> **Vì sao mẫu C nhấn vào nhắc học phí:** dữ liệu nghe ngóng hội nhóm cho thấy đây là nỗi
> đau được nhắc **nhiều nhất (44 lần)**. Trong khi góc "báo cáo riêng & phẩm giá" — thứ
> ta từng cho là mạnh nhất — có **0 lần** ai nhắc tới. Đi theo chỗ người ta đang kêu.

## A3. Bước 3 — Khi họ không trả lời

**Nhắc lại đúng MỘT lần, sau 3 ngày.** Nhắc lần hai là phiền.

```
Cô ơi em nhắc lại tin hôm trước thôi ạ, sợ cô bận rồi trôi mất 🌿
Cô không tiện thì thôi cũng không sao đâu ạ, em cảm ơn cô.
```

Vẫn im → **bỏ qua, đừng nhắn nữa**. Ghi vào bảng theo dõi là "không phản hồi" rồi đi tiếp.
Cố quá thành mất quan hệ, mà quan hệ mới là thứ đáng giá lâu dài.

## A4. Bước 4 — Xin Gmail (chỗ vướng nhất, đừng coi thường)

CH Play chỉ nhận tester bằng **email Google**. Đây là chỗ 90% thầy cô lớn tuổi khựng lại:
họ dùng Zalo là chính, nhiều người không nhớ mình có Gmail gì.

**Đừng hỏi trống không "cô cho em xin Gmail".** Hỏi kèm cách tìm:

```
Cô cho em xin email Google đang đăng nhập trên điện thoại cô nhé ạ.

Cách xem nhanh: cô mở CH Play (Google Play) → bấm vào hình tròn góc trên
bên phải → email hiện ra ngay ở đó ạ. Cô chụp màn hình gửi em cũng được.
```

**Ba trường hợp hay gặp:**

| Tình huống | Xử lý |
|---|---|
| Cô gửi email **không đăng nhập trên máy** | Phải là email đang đăng nhập CH Play, không thì cài không được. Hỏi lại theo cách trên. |
| Cô dùng **iPhone** | Không tham gia được closed testing Android. Ghi lại tên, hẹn báo khi có bản iOS. **Đừng bỏ họ** — đây là khách hàng tương lai. |
| Cô **không có Gmail** | Hiếm với máy Android. Nếu thật sự không có thì bỏ qua, đừng bắt họ tạo tài khoản mới — rào cản quá lớn cho một bản dùng thử. |

## A5. Bước 5 — Dẫn qua bước cài (gửi kèm, đừng để họ tự mò)

> 🎉 **CẬP NHẬT 12/08: iOS ĐÃ LÊN APP STORE.** Cô thầy dùng iPhone giờ KHÔNG cần
> opt-in gì cả — gửi thẳng link này (link có đo click):
>
> ```
> Cô tải GieoChữ trên App Store ạ: https://gieochu.vn/r/appstore
> ```
>
> Câu mở đầu khi nhắn 40 người cũng đổi được từ "cô cài giúp em bản thử nghiệm"
> thành **"app em có trên App Store rồi, cô tải thử ạ"** — mạnh hơn hẳn.
> Hai bước opt-in bên dưới CHỈ còn cần cho người dùng Android.

```
Cô làm giúp em 2 bước này nhé ạ:

BƯỚC 1 — Bấm link này trước, rồi chọn "Trở thành người kiểm thử"
[dán link opt-in]

BƯỚC 2 — Xong bước 1 mới tải app được ở đây
[dán link CH Play]

Nếu app chưa hiện ngay thì cô đợi khoảng 15 phút rồi thử lại giúp em ạ.
Vướng chỗ nào cô chụp màn hình gửi em, em xem giúp liền 🌿
```

⚠️ **Bước 1 bắt buộc trước bước 2.** Chưa opt-in thì CH Play báo "không tìm thấy ứng dụng"
— thầy cô sẽ tưởng app hỏng rồi bỏ luôn.

## A6. Bước 6 — Kèm tới "aha" đầu tiên (quan trọng nhất cả quyển sách)

**Cài xong không phải là xong. Người cài mà không dùng sẽ gỡ trong 3 ngày, và đồng hồ
14 ngày của anh reset.**

Trong **24 giờ** sau khi họ cài, nhắn:

```
Cô cài được rồi ạ 🌿 Cô cho em 10 phút gọi Zalo, em hướng dẫn cô tạo lớp
đầu tiên nhé — nhanh lắm ạ, xong là cô thấy ngay lớp mình trên app.
```

Gọi thật. Trong cuộc gọi, đưa họ tới **một trong ba khoảnh khắc**:

1. **Tick thu học phí** → app hiện ngay còn ai chưa đóng
2. **Gửi một thiệp báo cáo** cho một phụ huynh
3. **Bấm nhắc học phí** → thấy tin soạn sẵn có tên con và số tiền

Chạm được một trong ba, họ mới "hiểu" app dùng để làm gì. Chưa chạm thì app chỉ là một
biểu tượng lạ trên màn hình.

> Chi tiết kèm tay xem [Sách 02 — Hỗ trợ & onboarding](02-SUPPORT-ONBOARDING-RUNBOOK.md).

---

# PHẦN A-BIS — NẾU KHÔNG CÓ QUAN HỆ SẴN

Phần A giả định anh có 40 người quen. Nếu không có thì đọc phần này.

## Trước hết: danh sách số điện thoại từ đâu ra?

Câu trả lời quyết định anh được làm gì với nó.

| Nguồn | Được dùng không |
|---|---|
| Thầy cô **tự đăng công khai** để được liên hệ (tin nhận dạy kèm, trang gia sư) | ✅ Nhắn **từng người**, có tên, nói rõ thấy tin ở đâu |
| Số **mua lại**, thu thập, quét từ web | ❌ **Không dùng** |

**Vì sao không dùng danh sách mua:**

- **Trái luật.** Nghị định **91/2020/NĐ-CP** cấm gửi tin quảng cáo khi chưa có sự đồng ý.
  Nghị định **13/2023/NĐ-CP** yêu cầu có căn cứ hợp pháp khi xử lý dữ liệu cá nhân
  (số điện thoại là dữ liệu cá nhân). Có mức phạt tiền thật.
- **Mất tài khoản Zalo.** Nhắn hàng loạt người lạ → Zalo hạn chế rồi khoá. Mất luôn kênh
  liên lạc với khách hàng thật sau này — đắt hơn nhiều so với cái được.
- **Không hiệu quả.** Danh sách lạnh chuyển đổi ~1–2%. Cần 12 tester thì phải nhắn cả
  nghìn số — chắc chắn bị khoá trước khi đủ người.

> Phép tính ở mục 1 là của **người quen**. Đem áp lên danh sách lạnh là tự lừa mình.

## Năm đường đi khi bắt đầu từ con số 0 quan hệ

Xếp theo hiệu quả thật:

### 1. Hội nhóm Facebook — đường số một

Anh **không cần quen ai trước**. Nhóm 20.000 thành viên là 20.000 người tiếp cận được
hợp pháp. Làm song song hai cách:

**a) Trả lời câu hỏi** — xem Phần B bên dưới. Đây là việc hằng ngày, hệ thống có nhắc
qua Telegram mỗi sáng kèm chủ đề và mẫu trả lời.

**b) Đăng bài XIN GIÚP, không phải bài bán hàng.** Nhiều nhóm giáo viên chấp nhận, thậm
chí ủng hộ:

```
Em chào các thầy cô ạ.

Em đang làm một app nhỏ giúp thầy cô dạy thêm quản lý lớp — điểm danh,
theo dõi ai đã đóng học phí, soạn sẵn tin nhắc phụ huynh để mình gửi Zalo.

Em làm xong rồi nhưng chưa dám nói là tốt, vì mới có mình em dùng 😅
Em đang tìm khoảng 15 thầy cô dùng thử và chê giúp em, hoàn toàn miễn phí,
em hướng dẫn cài tận tay.

Thầy cô nào đang dạy thêm mà muốn thử thì bình luận hoặc nhắn em ạ.
Em xin cảm ơn 🌿
```

Khác biệt then chốt: **xin giúp đỡ, thừa nhận mình chưa có gì, không khoe**. Bài bán hàng
bị lướt qua; bài xin giúp được thương.

⚠️ Đọc luật nhóm trước. Nhóm cấm link thì đừng bỏ link, để người ta tự inbox.

### 2. Nhóm Zalo giáo viên

Tìm nhóm "Giáo viên [tỉnh]", nhóm theo môn. Tham gia trò chuyện vài ngày rồi mới nói tới
app. Tệp ở đây **đúng hơn Facebook** vì thầy cô sống trong Zalo.

### 3. Người đang đăng tin nhận dạy kèm

Họ đăng số **công khai để được liên hệ**. Nhắn từng người, nói rõ nguồn, ngắn gọn:

```
Chào cô, em thấy tin cô nhận dạy Toán ở nhóm [tên nhóm] ạ.

Em không phải phụ huynh, em xin lỗi làm phiền cô. Em làm một app quản lý
lớp dạy thêm, đang tìm thầy cô dùng thử miễn phí và góp ý. Cô quan tâm
em gửi chi tiết, không thì cô bỏ qua giúp em ạ, em không nhắn lại đâu.
```

**Giữ đúng lời "không nhắn lại".** Tự giới hạn **10–15 tin/ngày**.

### 4. TikTok

Kênh duy nhất mà **0 follower vẫn có người xem** — thuật toán phát cho người lạ. Đã có sẵn
5 kịch bản reel trong gói nội dung. Chậm hơn nhóm Facebook nhưng để lại tài sản lâu dài.

### 5. Ngoài đời

Trung tâm dạy thêm gần nhà, phòng chờ giáo viên, tiệm photo cạnh trường. Chậm, nhưng gặp
mặt thì tỷ lệ nhận lời cao gấp nhiều lần nhắn tin.

## Tách bạch hai việc

| Việc | Cách |
|---|---|
| **Đủ 12 tester mở khoá Play** | Nhóm Facebook (bài xin giúp) + bù bằng **đổi chéo với dev** miễn phí |
| **Có khách hàng thật** | Nhóm Facebook + Zalo + TikTok, kèm tay từng người |

Đổi chéo dev chỉ để **qua cổng**, không tính là khách. Nhưng nó tháo nút thắt thời gian
để anh không bị ép làm liều với danh sách số lạnh.

---

# PHẦN B — TỪ HỘI NHÓM FACEBOOK

## B1. Vì sao đăng bài giới thiệu app gần như luôn thất bại

- Admin nhiều nhóm **gỡ bài có link app**, coi là quảng cáo
- Thành viên mới đăng bài bán hàng bị **báo cáo**
- Người lướt newsfeed **không đang đau** — họ chỉ đang lướt

Cách hiệu quả hơn hẳn, và gần như không ai làm: **đi tìm người đang hỏi, rồi trả lời tử tế.**

## B2. Phương pháp: trả lời thay vì đăng

> 🔔 **Việc này đã được tự động nhắc.** Bản tin Telegram mỗi sáng (7h) có khối
> **"SEEDING HÔM NAY"**: chủ đề của ngày, từ khoá gõ vào ô tìm kiếm trong nhóm, và
> **mẫu trả lời dán được ngay**. Chủ đề xoay vòng 8 ngày, tất định, không sinh bằng AI.
>
> Trọng số bám dữ liệu nghe ngóng thật: *nhắc học phí* xuất hiện **3/8 ngày** (được nhắc
> 44 lần ngoài đời), *Thông tư 29* 2/8, *báo cáo & phẩm giá* 1/8 (0 lần ai nhắc).
> Nguồn: `backend/src/daythem/service/seeding.py`.

**Mỗi ngày 20 phút, làm đúng thế này:**

1. Vào nhóm → dùng **tìm kiếm trong nhóm** với các từ:
   `học phí` · `nhắc phụ huynh` · `thông tư 29` · `hộ kinh doanh` · `dạy thêm có phải đăng ký`
   · `báo cáo phụ huynh` · `sổ điểm danh`
2. Ra một loạt bài **người ta đang hỏi thật** — có bài hôm qua, có bài từ năm ngoái
3. **Trả lời cụ thể, có ích, KHÔNG nhắc app**
4. Làm đều 5–7 ngày → người trong nhóm bắt đầu nhớ mặt anh

**Lợi thế thật của anh:** anh nắm Thông tư 29 và luật thuế hộ kinh doanh 2026 kỹ hơn gần
hết người trong nhóm đó. Đây không phải chém gió — anh đã đọc kỹ để làm tính năng thuế.

## B3. Mẫu bình luận

### Khi có người hỏi về pháp lý dạy thêm

```
Theo Thông tư 29/2024, dạy thêm ngoài nhà trường có thu tiền thì phải đăng ký
kinh doanh — phổ biến nhất là hộ kinh doanh, đăng ký ở UBND cấp xã/phường nơi
mình dạy.

Hồ sơ khá gọn: đơn đăng ký + bản sao CCCD. Lệ phí thấp.

Cái nhiều thầy cô lo là thuế, nhưng từ 2026 ngưỡng doanh thu chịu thuế của hộ
kinh doanh đã nâng lên 1 tỷ/năm — đa số thầy cô dạy thêm ở nhà nằm dưới ngưỡng
này. Dù vậy vẫn nên giữ sổ sách thu chi rõ ràng cho yên tâm ạ.

Cô ở tỉnh nào để em nói cụ thể hơn về chỗ nộp?
```

*(Không một chữ nào về app. Câu hỏi cuối mở đường cho họ trả lời tiếp.)*

### Khi có người than chuyện nhắc học phí

```
Em thấy nhiều thầy cô làm cách này đỡ ngại hơn hẳn: đừng nhắc trong nhóm lớp,
nhắn riêng từng phụ huynh, và nhắn theo mẫu cố định — có tên con, số buổi
đã học, số tiền.

Nhắn riêng thì phụ huynh không mất mặt trước người khác, mà có số liệu cụ thể
thì thành thông báo chứ không thành đòi nợ. Em để ý mấy cô làm vậy ít bị
khất tiền hơn nhiều ạ.

Cái khó là nhớ nhắc ai rồi ai chưa — chỗ này cô ghi ra giấy hoặc dùng công cụ
gì cũng được, miễn đừng nhắc trùng.
```

*(Câu cuối để ngỏ. Ai đang đau sẽ tự hỏi "dùng công cụ gì?" — lúc đó mới nói.)*

### Khi họ hỏi lại "dùng app gì vậy em?"

**Đây mới là lúc được nói. Ngắn thôi, và nói thẳng là của mình:**

```
Dạ em có làm một app nhỏ tên GieoChữ đúng việc này ạ — app soạn sẵn tin nhắc
có tên con và số tiền, mình mở Zalo gửi riêng cho từng phụ huynh, nhắc ai rồi
app nhớ giúp.

App em đang cho dùng thử miễn phí, em nói trước là của em làm để cô khỏi thấy
kỳ ạ 😅 Cô muốn thử em gửi hướng dẫn, không thì mấy mẹo trên cô cứ dùng thoải mái.
```

> **Nói rõ "của em làm"** — người ta phát hiện sau sẽ thấy bị lừa. Nói trước thì thành
> thật thà, mà còn được thiện cảm.

## B4. Khi nào mới nên đăng bài

Sau **ít nhất một tuần trả lời đều**, khi đã có người nhận ra tên anh. Lúc đó đăng bài
giá trị (không phải bài quảng cáo) từ `docs/marketing-beta-content-pack.md`.

**Thứ tự đăng đã điều chỉnh theo dữ liệu nghe ngóng:**

| Thứ tự | Bài | Vì sao |
|---|---|---|
| 1 | **Bài 2 — Thu học phí không sót ai** | Nỗi đau tần suất **44** |
| 2 | Bài 3 — Thông tư 29 & hộ kinh doanh | Kéo reach tốt, đúng thời sự |
| 3 | Bài 1 — Báo cáo riêng & phẩm giá | **0 lần** ai nhắc — hay nhưng chưa ai kêu, để sau |

**Luật chung:** cho giá trị hết mình trong bài, nhắc app **một dòng ở cuối**, không hơn.

---

# PHẦN C — XỬ LÝ TỪ CHỐI

Đừng thuyết phục. Trả lời thật rồi để họ tự quyết.

| Họ nói | Trả lời |
|---|---|
| *"Cô không rành công nghệ đâu"* | "Dạ đúng cái đó em làm cho thầy cô không rành máy móc ạ. Em gọi Zalo hướng dẫn cô 10 phút, cô làm được là em yên tâm. Không được thì cô gỡ, em không phiền gì đâu ạ." |
| *"App này mất tiền không?"* | "Dạ đang miễn phí hoàn toàn ạ. Sau này nếu có gói trả phí thì em báo trước, mà thầy cô dùng thử giai đoạn này em giữ miễn phí lâu dài." *(Chỉ hứa điều mình làm được.)* |
| *"Cô sợ lộ thông tin học sinh"* | "Dạ dữ liệu chỉ mình cô xem được sau khi đăng nhập. App không có quảng cáo, không chia sẻ cho bên nào, không đọc tin nhắn Zalo của cô. Chính sách em ghi rõ ở gieochu.vn/legal, cô đọc thử ạ." |
| *"Cô dùng sổ quen rồi"* | "Dạ sổ vẫn tốt ạ. App chỉ đỡ cô chỗ nhớ ai đóng ai chưa với soạn tin nhắc thôi. Cô cứ dùng song song, thấy không tiện hơn thì bỏ ạ." |
| *"Để cô xem đã"* | "Dạ cô cứ thong thả ạ. Tuần sau em nhắn lại cô một lần nữa nhé, cô bận thì cô nói em thôi." *(Ghi lịch nhắc. Nhắc đúng một lần.)* |

---

# PHẦN D — BẢNG THEO DÕI

Không có bảng thì tới người thứ 15 là anh loạn. Google Sheets là đủ:

| Tên | SĐT | Nhóm | Ngày nhắn | Trả lời | Gmail | Opt-in | Cài | Aha | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| Cô Lan | 09xx | N1 | 03/08 | ✅ | ✅ | ✅ | ✅ | ✅ tick thu phí | dạy Toán 8, 12 HS |
| Cô Hà | 09xx | N1 | 03/08 | ✅ | ✅ | ✅ | ❌ | | máy hết dung lượng |
| Thầy Nam | 09xx | N2 | 04/08 | — | | | | | nhắc lại 07/08 |

**Hai con số nhìn mỗi ngày:**
- **Bao nhiêu người đã opt-in** → đối chiếu ô "X testers currently opted-in" trong Play Console
- **Bao nhiêu người đã chạm aha** → đây mới là người dùng thật, không phải người cài

---

# PHẦN E — TUYỆT ĐỐI KHÔNG LÀM

| Không | Vì sao |
|---|---|
| Copy một tin nhắn gửi hàng loạt | Zalo chặn tài khoản, mà người nhận cũng biết ngay là tin rác |
| Thêm người vào nhóm Zalo mà chưa hỏi | Mất thiện cảm ngay lập tức, không lấy lại được |
| Nói "app tiết kiệm 30 phút mỗi ngày" | **Chưa có số đo thật.** Bịa số là mất niềm tin vĩnh viễn |
| Nói "app tự động gửi Zalo cho phụ huynh" | Sai sự thật — app **soạn sẵn**, thầy cô **tự gửi** |
| Nói "app kê khai thuế thay cô" | App **tính + tạo tờ khai tham khảo**, giáo viên tự nộp |
| Giấu chuyện app là của mình | Bị phát hiện sau còn tệ hơn nhiều |
| Gửi link app cho người chưa opt-in | Họ thấy "không tìm thấy ứng dụng" rồi bỏ luôn |
| Thuê dịch vụ tester ảo cho đủ 12 | Qua cổng Play nhưng vẫn 0 khách. Google 2026 từ chối nhiều nhất vì **"thiếu tương tác thật"** |

---

# NHỊP 7 NGÀY ĐẦU

| Ngày | Việc | Thời gian |
|---|---|---|
| **1** | Lọc danh bạ ra 40 tên, chia N1/N2/N3 · nhắn hết **N1** | 2 giờ |
| **2** | Nhắn **N2** · vào 5 nhóm FB, tìm 10 bài đang hỏi | 1,5 giờ |
| **3** | Trả lời 2 câu hỏi trong nhóm · **gọi kèm** người đã cài | 1 giờ |
| **4** | Nhắc lại người chưa trả lời (**một lần thôi**) · nhắn N3 nếu thiếu | 1 giờ |
| **5** | Trả lời 2 câu hỏi · gọi kèm tiếp | 1 giờ |
| **6** | Đếm lại: bao nhiêu opt-in? thiếu bao nhiêu? · bù bằng đổi chéo dev nếu cần | 1 giờ |
| **7** | Gọi hỏi 3 người dùng nhiều nhất: **vì sao cô ở lại?** | 1 giờ |

**Câu hỏi ngày 7 là quan trọng nhất.** Câu trả lời của họ chính là thông điệp bán hàng
của anh cho 1.000 người tiếp theo — và anh không nghĩ ra được nó bằng cách ngồi suy luận.

---

## Liên quan

- [Sách 02 — Hỗ trợ & onboarding](02-SUPPORT-ONBOARDING-RUNBOOK.md) — kèm tay sau khi họ cài
- [Sách 03 — CTV playbook](03-CTV-PLAYBOOK.md) — khi đã có người giới thiệu người
- [Gói nội dung beta](../marketing-beta-content-pack.md) — 5 bài group + 5 reel
- [Checklist lên store](../store-launch-checklist.md) — luật 12 tester × 14 ngày
