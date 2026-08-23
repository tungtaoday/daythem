# Kho ảnh & video marketing — dùng cái nào ở đâu

Viết ra vì đang có **4 thư mục ảnh** khác nhau và rất dễ lấy nhầm: ảnh nộp store
đem đăng Facebook thì sai khổ, ảnh chụp thô đem đăng thì thiếu chữ và thương hiệu.

## Ảnh

| Thư mục | Là gì | Dùng để |
|---|---|---|
| `marketing/data/social/` | 12 poster đã ghép chữ + logo + ảnh app thật | **Đăng Facebook.** Dán thẳng, không cần sửa |
| `marketing/data/app_screens/` | 13 ảnh chụp app nguyên bản, chưa có chữ | **Nguyên liệu** để ghép poster mới |
| `store-assets/` | 47 file nộp App Store / CH Play | Chỉ để nộp store. Khổ dọc, **không hợp Facebook** |
| `backend/src/daythem/web/assets/` | 3 ảnh dùng trên gieochu.vn | Trang web, không đụng tới khi làm marketing |

### Poster đăng Facebook (`marketing/data/social/`)

| Chủ đề | Vuông 1080×1080 | Dọc 1080×1350 |
|---|---|---|
| Điểm danh | `diemdanh_sq` | `diemdanh_p45` |
| Học phí | `hocphi_sq` | `hocphi_p45` |
| Nhắc phí | `nhacphi_sq` | `nhacphi_p45` |
| Báo cáo riêng | `baocao_sq` | `baocao_p45` |
| Giới thiệu chung | `gioithieu_sq` | `gioithieu_p45` |
| Tổng quan | `tongquan_sq` | `tongquan_p45` |

Trang `/ngay` nút **🖼 ảnh sản phẩm** lấy đúng bộ này.

Dựng lại khi đổi giao diện app: `python -m src.tools.social_posts`

## Video

| File | Khổ | Đăng ở đâu |
|---|---|---|
| `gioithieu_vuong_1080x1080.mp4` | 1:1 | **Bài đăng trong group và trang.** Feed không cắt |
| `gioithieu_doc_1080x1920.mp4` | 9:16 | **Reels và Story** |

Nằm ở `marketing/data/videos/`. Dựng lại: `python -m src.tools.fb_intro_video ca-hai`
(hoặc `vuong` / `doc` nếu chỉ cần một khổ).

### Vì sao hai khổ, không phải một

Facebook có hai chỗ phát video khác nhau. Đăng khổ dọc 9:16 vào feed thì bị cắt
hai đầu; đăng khổ vuông vào Reels thì thừa hai dải đen. Không có khổ nào dùng
chung được.

### Ba quyết định trong `fb_intro_video.py`

**Dùng ảnh chụp app THẬT**, không vẽ lại giao diện — cùng nguyên tắc đã áp cho
poster. Model sinh ảnh bịa ra màn hình không tồn tại, người xem cài về thấy khác
hẳn là mất lòng tin ngay chạm đầu.

**Mọi thông điệp nằm ở chữ trên hình.** Facebook tự phát KHÔNG TIẾNG, video dựa
vào lời đọc thì phần lớn người xem không nhận được gì.

**Ép chất lượng nguồn cao (CRF 17).** Nội dung gần như tĩnh nên x264 tự chọn
bitrate rất thấp — nhìn ở máy thì sạch, nhưng Facebook nén lại lần nữa khi tải
lên, hết biên độ là chữ bắt đầu rỗ.

### Khổ vuông cắt ảnh chụp

Ảnh chụp điện thoại tỉ lệ ~2.1 (rất cao). Thả nguyên vào khung vuông thì phải thu
nhỏ tới mức chỉ còn dải hẹp giữa màn, thừa trống hai bên. Nên khổ vuông cắt lấy
phần TRÊN của ảnh — nơi có tiêu đề màn hình và mấy dòng đầu — rồi phóng to.
Khổ dọc giữ nguyên ảnh.

## Liên quan

- [Bộ chữ store](store-listing-copy.md)
- [Gói nội dung fanpage](fanpage-content-pack.md)
