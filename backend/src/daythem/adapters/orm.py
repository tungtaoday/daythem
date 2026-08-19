from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Integer, Boolean, Float, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Base(DeclarativeBase):
    pass


class TeacherORM(Base):
    __tablename__ = "teachers"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    name: Mapped[Optional[str]] = mapped_column(String(100))
    avatar_url: Mapped[Optional[str]] = mapped_column(Text)
    password_hash: Mapped[Optional[str]] = mapped_column(String(200))
    push_token: Mapped[Optional[str]] = mapped_column(Text)
    notif_attendance: Mapped[bool] = mapped_column(Boolean, default=True)
    notif_tuition: Mapped[bool] = mapped_column(Boolean, default=True)
    notif_report: Mapped[bool] = mapped_column(Boolean, default=True)
    dnd_start: Mapped[Optional[str]] = mapped_column(String(5))
    dnd_end: Mapped[Optional[str]] = mapped_column(String(5))
    # Rich per-user notification prefs (utility rule on/off + times + marketing opt-in).
    notif_prefs: Mapped[Optional[dict]] = mapped_column(JSON)
    # Manual segment tags set by the owner (e.g. ["high_value","beta"]).
    notif_tags: Mapped[Optional[list]] = mapped_column(JSON)
    tax_id: Mapped[Optional[str]] = mapped_column(String(20))
    full_legal_name: Mapped[Optional[str]] = mapped_column(String(200))
    # ── ATTRIBUTION: GV này đến từ kênh nào (khớp mã link theo dõi: g1..g5, tiktok,
    # fanpage, zalo, gioi_thieu...). Nhờ cột này mới nối được click → người dùng THẬT.
    # Nguồn điền: app gửi khi đăng ký (deep-link ref / tự khai) hoặc owner set trên admin.
    source: Mapped[Optional[str]] = mapped_column(String(40), index=True)
    source_note: Mapped[Optional[str]] = mapped_column(String(200))
    id_number: Mapped[Optional[str]] = mapped_column(String(20))
    date_of_birth: Mapped[Optional[str]] = mapped_column(String(10))
    address: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    classes: Mapped[list["ClassORM"]] = relationship(back_populates="teacher", lazy="select")


class ClassORM(Base):
    __tablename__ = "classes"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    teacher_id: Mapped[str] = mapped_column(String(36), ForeignKey("teachers.id"), index=True)
    name: Mapped[str] = mapped_column(String(100))
    subject: Mapped[str] = mapped_column(String(50))
    grade: Mapped[str] = mapped_column(String(20))
    schedule: Mapped[Optional[dict]] = mapped_column(JSON)
    default_fee: Mapped[float] = mapped_column(Float, default=0)
    fee_type: Mapped[str] = mapped_column(String(20), default="month")  # month | session | course
    zalo_group_id: Mapped[Optional[str]] = mapped_column(String(100))
    color: Mapped[Optional[str]] = mapped_column(String(20))  # khoá màu nhận diện lớp (vd 'green')
    archived: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    teacher: Mapped["TeacherORM"] = relationship(back_populates="classes")
    students: Mapped[list["StudentORM"]] = relationship(back_populates="class_", lazy="select")
    sessions: Mapped[list["AttendanceSessionORM"]] = relationship(back_populates="class_", lazy="select")
    tuitions: Mapped[list["TuitionORM"]] = relationship(back_populates="class_", lazy="select")
    announcements: Mapped[list["AnnouncementORM"]] = relationship(back_populates="class_", lazy="select")
    reports: Mapped[list["ReportORM"]] = relationship(back_populates="class_", lazy="select")


class StudentORM(Base):
    __tablename__ = "students"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    class_id: Mapped[str] = mapped_column(String(36), ForeignKey("classes.id"), index=True)
    name: Mapped[str] = mapped_column(String(100))
    parent_name: Mapped[Optional[str]] = mapped_column(String(100))
    parent_phone: Mapped[Optional[str]] = mapped_column(String(20))
    note: Mapped[Optional[str]] = mapped_column(Text)
    archived: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    class_: Mapped["ClassORM"] = relationship(back_populates="students")
    attendance_records: Mapped[list["AttendanceRecordORM"]] = relationship(back_populates="student", lazy="select")
    tuitions: Mapped[list["TuitionORM"]] = relationship(back_populates="student", lazy="select")
    fee_setting: Mapped[Optional["StudentFeeORM"]] = relationship(back_populates="student", uselist=False, lazy="select")


class StudentFeeORM(Base):
    __tablename__ = "student_fees"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    student_id: Mapped[str] = mapped_column(String(36), ForeignKey("students.id"), unique=True)
    fee_type: Mapped[str] = mapped_column(String(20), default="default")
    amount: Mapped[Optional[float]] = mapped_column(Float)
    note: Mapped[Optional[str]] = mapped_column(Text)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    student: Mapped["StudentORM"] = relationship(back_populates="fee_setting")


class AttendanceSessionORM(Base):
    __tablename__ = "attendance_sessions"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    class_id: Mapped[str] = mapped_column(String(36), ForeignKey("classes.id"), index=True)
    session_date: Mapped[str] = mapped_column(String(10))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    # Nội dung buổi học — GV ghi lúc điểm danh, dùng cho báo cáo gửi phụ huynh.
    lesson_note: Mapped[Optional[str]] = mapped_column(Text)     # hôm nay học gì
    homework_note: Mapped[Optional[str]] = mapped_column(Text)   # dặn dò về nhà
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    class_: Mapped["ClassORM"] = relationship(back_populates="sessions")
    records: Mapped[list["AttendanceRecordORM"]] = relationship(back_populates="session", lazy="select", cascade="all, delete-orphan")


class AttendanceRecordORM(Base):
    __tablename__ = "attendance_records"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    session_id: Mapped[str] = mapped_column(String(36), ForeignKey("attendance_sessions.id"), index=True)
    student_id: Mapped[str] = mapped_column(String(36), ForeignKey("students.id"))
    present: Mapped[bool] = mapped_column(Boolean, default=True)
    absence_reason: Mapped[Optional[str]] = mapped_column(String(200))

    session: Mapped["AttendanceSessionORM"] = relationship(back_populates="records")
    student: Mapped["StudentORM"] = relationship(back_populates="attendance_records")


class TuitionORM(Base):
    __tablename__ = "tuitions"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    class_id: Mapped[str] = mapped_column(String(36), ForeignKey("classes.id"), index=True)
    student_id: Mapped[str] = mapped_column(String(36), ForeignKey("students.id"))
    month: Mapped[str] = mapped_column(String(7))
    amount: Mapped[float] = mapped_column(Float)
    paid: Mapped[bool] = mapped_column(Boolean, default=False)
    paid_date: Mapped[Optional[str]] = mapped_column(String(10))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    class_: Mapped["ClassORM"] = relationship(back_populates="tuitions")
    student: Mapped["StudentORM"] = relationship(back_populates="tuitions")


class AnnouncementORM(Base):
    __tablename__ = "announcements"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    class_id: Mapped[str] = mapped_column(String(36), ForeignKey("classes.id"), index=True)
    type: Mapped[str] = mapped_column(String(20))
    content: Mapped[str] = mapped_column(Text)
    session_date: Mapped[Optional[str]] = mapped_column(String(10))
    status: Mapped[str] = mapped_column(String(20), default="sent")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    class_: Mapped["ClassORM"] = relationship(back_populates="announcements")
    makeup: Mapped[Optional["MakeupORM"]] = relationship(back_populates="announcement", uselist=False, lazy="select")


class MakeupORM(Base):
    __tablename__ = "makeups"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    announcement_id: Mapped[str] = mapped_column(String(36), ForeignKey("announcements.id"), unique=True)
    options: Mapped[list] = mapped_column(JSON)
    confirmed_option: Mapped[Optional[int]] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    announcement: Mapped["AnnouncementORM"] = relationship(back_populates="makeup")
    votes: Mapped[list["MakeupVoteORM"]] = relationship(back_populates="makeup", lazy="select", cascade="all, delete-orphan")


class MakeupVoteORM(Base):
    __tablename__ = "makeup_votes"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    makeup_id: Mapped[str] = mapped_column(String(36), ForeignKey("makeups.id"), index=True)
    option_index: Mapped[int] = mapped_column(Integer)
    voter_name: Mapped[str] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    makeup: Mapped["MakeupORM"] = relationship(back_populates="votes")


class ReportORM(Base):
    __tablename__ = "reports"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    class_id: Mapped[str] = mapped_column(String(36), ForeignKey("classes.id"), index=True)
    week_start: Mapped[str] = mapped_column(String(10))
    content: Mapped[dict] = mapped_column(JSON)
    generated_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    class_: Mapped["ClassORM"] = relationship(back_populates="reports")


class OTPORM(Base):
    __tablename__ = "otps"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    phone: Mapped[str] = mapped_column(String(20), index=True)
    code: Mapped[str] = mapped_column(String(6))
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    used: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


class NotifEventORM(Base):
    """Notification interaction log — foundation for the fatigue model."""
    __tablename__ = "notif_events"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    teacher_id: Mapped[str] = mapped_column(String(36), ForeignKey("teachers.id"), index=True)
    channel: Mapped[str] = mapped_column(String(20))       # utility | marketing
    rule: Mapped[Optional[str]] = mapped_column(String(40))  # rule id / campaign id
    event_type: Mapped[str] = mapped_column(String(20))    # delivered | opened | dismissed
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now, index=True)


class ActivityEventORM(Base):
    """Activation event log — đo phễu kích hoạt GV (tạo lớp, điểm danh, thu phí,
    tạo báo cáo, nhập HS hàng loạt, chia sẻ thiệp). Phục vụ mục tiêu đo lường BƯỚC 1 GTM."""
    __tablename__ = "activity_events"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    teacher_id: Mapped[str] = mapped_column(String(36), ForeignKey("teachers.id"), index=True)
    kind: Mapped[str] = mapped_column(String(40), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now, index=True)


class UiEventORM(Base):
    """Bước chân của GV trong app: mở màn nào, bấm gì, theo thứ tự thời gian.

    CỐ Ý tách khỏi `activity_events`. Bảng kia là phễu kích hoạt sạch với 8 loại
    event lõi, và `user_health` đếm số thao tác trực tiếp từ nó — đổ vài trăm lượt
    xem màn hình vào đấy là north_star, phễu và trang /admin/users sai hết.

    `session_id` do client sinh mỗi lần mở app → ghép được một phiên liền mạch,
    thứ cho biết GV đi đường nào rồi bỏ ở đâu (cái mà đếm tổng không nói được).
    """
    __tablename__ = "ui_events"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    teacher_id: Mapped[str] = mapped_column(String(36), ForeignKey("teachers.id"), index=True)
    screen: Mapped[str] = mapped_column(String(60), index=True)
    action: Mapped[Optional[str]] = mapped_column(String(60))   # None = chỉ mở màn
    session_id: Mapped[Optional[str]] = mapped_column(String(36), index=True)
    platform: Mapped[Optional[str]] = mapped_column(String(12))  # ios | android | web
    app_version: Mapped[Optional[str]] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now, index=True)


class TrackedLinkORM(Base):
    """Link rút gọn có gắn mã kênh → đo được bài đăng nào (group/TikTok/fanpage) kéo
    bao nhiêu CLICK thật. Đây là cách duy nhất đo attribution khi đăng tay vào group
    người khác (Facebook không cho API bài đăng ở group mình không sở hữu)."""
    __tablename__ = "tracked_links"
    code: Mapped[str] = mapped_column(String(40), primary_key=True)  # vd 'g1', 'tiktok', 'fanpage'
    label: Mapped[str] = mapped_column(String(120))                  # tên kênh dễ đọc
    target: Mapped[str] = mapped_column(Text)                         # URL đích (landing/APK)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


class LinkClickORM(Base):
    """Mỗi lượt bấm 1 link theo dõi — để đếm theo kênh + theo ngày."""
    __tablename__ = "link_clicks"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    code: Mapped[str] = mapped_column(String(40), ForeignKey("tracked_links.code"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now, index=True)
    referer: Mapped[Optional[str]] = mapped_column(String(300))


class PostLogORM(Base):
    """Nhật ký bài đăng thủ công — các số CHỈ nhìn tay được (reach/comment/share) trên
    bài đăng group/TikTok/fanpage. Facebook không cho API bài ở group người khác nên
    owner tự nhập tay mỗi tuần. Đi kèm link click (tự động) → đủ bức tranh 1 bài."""
    __tablename__ = "post_logs"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    post_date: Mapped[str] = mapped_column(String(10), index=True)  # "YYYY-MM-DD"
    channel: Mapped[str] = mapped_column(String(120))               # tên kênh/group
    pillar: Mapped[Optional[str]] = mapped_column(String(40))       # trụ nội dung
    reach: Mapped[int] = mapped_column(Integer, default=0)
    comments: Mapped[int] = mapped_column(Integer, default=0)
    shares: Mapped[int] = mapped_column(Integer, default=0)
    link_code: Mapped[Optional[str]] = mapped_column(String(40))    # nối với link theo dõi (nếu có)
    note: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


class GtmTaskORM(Base):
    """Một việc trong kế hoạch GTM, CÓ TRẠNG THÁI.

    Vì sao cần bảng này: trước đây bản tin ngày/tuần chỉ LIỆT KÊ việc từ lộ trình
    cứng trong code — hôm nào cũng hiện y hệt dù đã làm hay chưa. Không có trạng
    thái thì không có traceback, và người đọc nhanh chóng bỏ qua bản tin.

    `key` là mã ổn định trong `service/gtm_plan.py` — dùng để gieo lại mà không
    tạo trùng, và để đánh dấu xong bằng lệnh cho gọn.
    """
    __tablename__ = "gtm_tasks"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    key: Mapped[str] = mapped_column(String(60), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(300))
    block: Mapped[str] = mapped_column(String(40), index=True)   # Store | Kiếm khách | Sản phẩm...
    why: Mapped[Optional[str]] = mapped_column(Text)             # 1 dòng: làm cái này để mở khoá gì
    source: Mapped[Optional[str]] = mapped_column(String(120))   # tài liệu gốc, để lần ngược
    priority: Mapped[int] = mapped_column(Integer, default=100, index=True)  # nhỏ = làm trước
    owner: Mapped[str] = mapped_column(String(20), default="anh")  # anh | claude
    status: Mapped[str] = mapped_column(String(20), default="todo", index=True)  # todo | doing | done | skip
    done_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    note: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


class GrowthNoteORM(Base):
    """Nhận xét vận hành owner gõ qua Telegram (/ghi) — mắt người trong vòng growth.

    Số đo (click, reach) nói CÁI GÌ xảy ra; ghi chú kiểu "nhóm g3 toàn bài tuyển
    sinh, không hợp seeding" nói VÌ SAO — thứ máy không tự thấy. Bảng điểm và
    khối-dán-cho-Claude gộp cả hai, nên phiên điều chỉnh chiến lược đọc được
    ngay mà owner không phải nhắc lại.
    """
    __tablename__ = "growth_notes"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    text: Mapped[str] = mapped_column(Text)
    channel: Mapped[Optional[str]] = mapped_column(String(40))  # g1..g5/fb/tt/zl nếu trỏ về một kênh
    status: Mapped[str] = mapped_column(String(20), default="open", index=True)  # open | handled
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now, index=True)


class PasswordResetRequestORM(Base):
    """Yêu cầu đặt lại mật khẩu do GV gửi từ app — owner xử lý trên admin dashboard."""
    __tablename__ = "password_reset_requests"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    phone: Mapped[str] = mapped_column(String(20), index=True)
    note: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)  # pending | done
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now, index=True)
    handled_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
