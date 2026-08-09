@echo off
chcp 65001 > nul
cd /d C:\DayThem

echo ============================================================
echo  GIEOCHU - DIEU CHINH CHIEN LUOC GROWTH
echo  Claude se: doc bang diem tren server - doi chieu ke hoach
echo  - de xuat toi da 3 dieu chinh - CHO ANH DUYET roi moi sua.
echo ============================================================
echo.

claude "Điều chỉnh chiến lược growth theo dữ liệu. Làm đúng trình tự: (1) SSH root@165.22.252.188, chạy scoreboard trong daythem.service.growth_loop và scripts/gtm.py để lấy bảng điểm thử nghiệm 7 ngày + trạng thái kế hoạch — dùng số THẬT, không dùng trí nhớ. (2) Đối chiếu với trọng số chủ đề trong seeding.py, thứ tự bài trong docs/fanpage-content-pack.md và kế hoạch trong gtm_plan.py. (3) Đề xuất TỐI ĐA 3 điều chỉnh, mỗi điều phải có dữ liệu chống lưng — thiếu dữ liệu thì nói thẳng thiếu gì và DỪNG, đừng đề xuất bừa. (4) Chờ tôi duyệt từng điều rồi mới sửa code, chạy test, deploy. Tuyệt đối không tự ý deploy khi chưa duyệt."
