// Loại thu học phí của LỚP — dùng chung từ màn đăng ký (Setup) → Tạo lớp →
// Cài đặt lớp → các màn thu tiền, để cùng 1 bộ giá trị với backend.
export type ClassFeeType = 'month' | 'session' | 'course';

export const FEE_TYPES: { id: ClassFeeType; label: string; hint: string }[] = [
  { id: 'month', label: 'Theo tháng', hint: 'Khoán 1 giá mỗi tháng — phổ biến nhất' },
  { id: 'session', label: 'Theo buổi', hint: 'Tiền tháng = số buổi có mặt × đơn giá (tự tính từ điểm danh)' },
  { id: 'course', label: 'Theo khoá', hint: 'Thu 1 lần cho cả khoá (vd luyện thi)' },
];

// "tháng" / "buổi" / "khoá" — ghép vào nhãn giá: "500k/tháng", "150k/buổi".
export const FEE_UNIT: Record<ClassFeeType, string> = {
  month: 'tháng',
  session: 'buổi',
  course: 'khoá',
};

export const FEE_PRESETS_BY_TYPE: Record<ClassFeeType, number[]> = {
  month: [300000, 400000, 500000, 600000, 800000, 1000000],
  session: [80000, 100000, 120000, 150000, 200000, 250000],
  course: [1000000, 1500000, 2000000, 3000000, 5000000],
};

// 'monthly' là giá trị cũ trong DB; giá trị lạ → coi như khoán tháng.
export const normFeeType = (v?: string | null): ClassFeeType =>
  v === 'session' || v === 'course' ? v : 'month';
