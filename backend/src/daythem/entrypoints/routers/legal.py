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


# Trang yêu cầu xoá tài khoản NGOÀI app — Google Play bắt buộc khai URL này
# (Data safety → Account deletion). Form đẩy vào hàng chờ admin qua /api/v1/auth/delete-request.
_DELETE_HTML = """<!DOCTYPE html>
<html lang="vi"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>GieoChữ — Xoá tài khoản</title>
<style>
 body{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px 18px;color:#1a1a1a;line-height:1.6}
 h1{font-size:24px;color:#2f6849} h2{font-size:17px;margin-top:26px;color:#2f6849}
 p,li{font-size:15px;color:#333} .muted{color:#6b6b6b;font-size:13px} a{color:#3d8760}
 .box{background:#eef6ef;border:1px solid #d5e8d8;border-radius:12px;padding:14px 16px;margin:16px 0}
 label{display:block;font-size:13px;font-weight:600;margin:14px 0 4px}
 input,textarea{width:100%;box-sizing:border-box;padding:11px 12px;font-size:15px;border:1.5px solid #d9d4c8;border-radius:10px;font-family:inherit}
 button{margin-top:16px;width:100%;padding:13px;font-size:15px;font-weight:700;color:#fff;background:#c9573f;border:none;border-radius:12px;cursor:pointer}
 button:disabled{opacity:.5} .ok{color:#2f6849;font-weight:700;margin-top:12px} .err{color:#c9573f;margin-top:12px}
</style></head><body>
<h1>Xoá tài khoản GieoChữ</h1>
<p class="muted">Áp dụng cho ứng dụng GieoChữ (quản lý lớp dạy thêm) · gieochu.vn</p>

<h2>Cách nhanh nhất: xoá ngay trong ứng dụng</h2>
<div class="box"><p style="margin:0">Mở app GieoChữ → <b>Hồ sơ → Xoá tài khoản</b>.<br>
Tài khoản cùng toàn bộ lớp, học sinh, điểm danh, học phí bị xoá <b>vĩnh viễn ngay lập tức</b>, không thể khôi phục.</p></div>

<h2>Không còn dùng được app? Gửi yêu cầu tại đây</h2>
<p>Điền số điện thoại đã đăng ký. Chúng tôi xác minh và xoá vĩnh viễn toàn bộ dữ liệu trong vòng <b>7 ngày</b>, không lưu lại bản sao nào.</p>
<form id="f">
 <label for="phone">Số điện thoại đã đăng ký</label>
 <input id="phone" type="tel" required placeholder="09xxxxxxxx" autocomplete="tel">
 <label for="note">Ghi chú (không bắt buộc)</label>
 <textarea id="note" rows="2" placeholder="Ví dụ: mất máy, không đăng nhập được"></textarea>
 <button type="submit" id="btn">Gửi yêu cầu xoá tài khoản</button>
 <p id="msg"></p>
</form>

<h2>Dữ liệu nào bị xoá?</h2>
<ul>
 <li>Tài khoản (số điện thoại, tên, mật khẩu) và thông tin thuế nếu có.</li>
 <li>Toàn bộ lớp học, học sinh, phụ huynh, điểm danh, học phí, ghi chú.</li>
</ul>
<p class="muted">Thắc mắc: <a href="mailto:support@gieochu.vn">support@gieochu.vn</a> · <a href="/legal">Chính sách bảo mật</a></p>
<script>
document.getElementById('f').addEventListener('submit', async function(e){
 e.preventDefault();
 var btn=document.getElementById('btn'), msg=document.getElementById('msg');
 btn.disabled=true; msg.textContent='';
 try{
  var r=await fetch('/api/v1/auth/delete-request',{method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({phone:document.getElementById('phone').value,note:document.getElementById('note').value})});
  if(r.ok){msg.className='ok';msg.textContent='Đã nhận yêu cầu. Chúng tôi sẽ xoá tài khoản trong vòng 7 ngày.';}
  else{var d=await r.json().catch(function(){return{}});msg.className='err';msg.textContent=d.detail||'Gửi chưa được, thử lại sau ít phút.';btn.disabled=false;}
 }catch(_){msg.className='err';msg.textContent='Không kết nối được, thử lại sau.';btn.disabled=false;}
});
</script>
</body></html>"""


@router.get("/delete-account", response_class=HTMLResponse)
def delete_account_page() -> str:
    return _DELETE_HTML
