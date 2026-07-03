from fastapi import APIRouter
from fastapi.responses import HTMLResponse

router = APIRouter(tags=["legal"])

_HTML = """<!DOCTYPE html>
<html lang="vi"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>GieoChữ — Điều khoản & Chính sách bảo mật</title>
<style>
 body{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:720px;margin:0 auto;padding:24px 18px;color:#1a1a1a;line-height:1.6}
 h1{font-size:24px;color:#2f6849} h2{font-size:18px;margin-top:28px;color:#2f6849}
 h3{font-size:15px;margin-top:18px} p,li{font-size:15px;color:#333}
 .muted{color:#6b6b6b;font-size:13px} a{color:#3d8760}
 hr{border:none;border-top:1px solid #e8e4da;margin:28px 0}
</style></head><body>
<h1>GieoChữ</h1>
<p class="muted">Ứng dụng quản lý lớp dạy thêm cho giáo viên cá nhân · Cập nhật 07/2026</p>

<h2>Điều khoản sử dụng</h2>
<h3>1. Dịch vụ</h3>
<p>GieoChữ giúp giáo viên quản lý lớp học, điểm danh, học phí, báo cáo và nhắc nhở. Ứng dụng dành cho giáo viên tự quản lý lớp dạy thêm.</p>
<h3>2. Tài khoản</h3>
<p>Bạn đăng nhập bằng số điện thoại và mật khẩu. Bạn chịu trách nhiệm bảo mật mật khẩu và mọi hoạt động trên tài khoản của mình.</p>
<h3>3. Nội dung do bạn nhập</h3>
<p>Thông tin học sinh, phụ huynh, học phí do bạn nhập là dữ liệu của bạn. Bạn cam kết có cơ sở hợp pháp để lưu trữ các thông tin đó và chịu trách nhiệm về tính chính xác.</p>
<h3>4. Thuế</h3>
<p>Chức năng thuế chỉ mang tính tham khảo. GieoChữ không nộp thuế thay bạn và không chịu trách nhiệm pháp lý về nghĩa vụ thuế của bạn.</p>
<h3>5. Giới hạn trách nhiệm</h3>
<p>Ứng dụng cung cấp "nguyên trạng". Chúng tôi nỗ lực vận hành ổn định nhưng không bảo đảm không gián đoạn hay không lỗi.</p>

<hr>

<h2>Chính sách bảo mật</h2>
<h3>1. Dữ liệu chúng tôi thu thập</h3>
<ul>
 <li>Số điện thoại, tên, giới tính bạn cung cấp khi đăng ký.</li>
 <li>Dữ liệu bạn nhập: lớp, học sinh, tên/SĐT phụ huynh, điểm danh, học phí, ghi chú.</li>
 <li>Thông tin thuế (MST/CCCD/ngày sinh/địa chỉ) chỉ khi bạn dùng tính năng thuế.</li>
 <li>Mã thông báo đẩy (để gửi nhắc nhở) nếu bạn bật thông báo.</li>
</ul>
<h3>2. Lưu trữ &amp; truy cập</h3>
<p>Dữ liệu được lưu trên máy chủ riêng của GieoChữ. Chỉ tài khoản của bạn (sau khi đăng nhập) mới xem được dữ liệu của mình. Email và thông tin ngân hàng (nếu nhập) được lưu trên máy của bạn.</p>
<h3>3. Điều chúng tôi KHÔNG làm</h3>
<p>GieoChữ <b>không đọc tin nhắn Zalo riêng tư</b> giữa bạn và phụ huynh. Ứng dụng chỉ soạn sẵn nội dung để bạn tự sao chép và gửi. Chúng tôi không bán dữ liệu của bạn cho bên thứ ba.</p>
<h3>4. Xoá dữ liệu / tài khoản</h3>
<p>Bạn có thể xoá toàn bộ dữ liệu và tài khoản bất cứ lúc nào trong ứng dụng: <b>Hồ sơ → Xoá tài khoản</b>. Thao tác này xoá vĩnh viễn lớp, học sinh, điểm danh, học phí của bạn và không thể khôi phục.</p>
<h3>5. Quên mật khẩu</h3>
<p>Nếu quên mật khẩu, liên hệ hỗ trợ để được đặt lại: <a href="mailto:support@gieochu.vn">support@gieochu.vn</a>.</p>
<h3>6. Liên hệ</h3>
<p>Mọi thắc mắc về dữ liệu và quyền riêng tư: <a href="mailto:support@gieochu.vn">support@gieochu.vn</a>.</p>

<hr>
<p class="muted">© 2026 GieoChữ · Made in Vietnam 🌿</p>
</body></html>"""


@router.get("/legal", response_class=HTMLResponse)
@router.get("/privacy", response_class=HTMLResponse)
@router.get("/terms", response_class=HTMLResponse)
def legal_page() -> str:
    return _HTML
