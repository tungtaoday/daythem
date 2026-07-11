import api from './client';

export type AtRiskStudent = {
  student_id: string;
  name: string;
  class_id: string;
  class_name: string;
  absent_streak: number;
};

export type HomeSummary = {
  month: string;
  unpaid: { count: number; amount: number };
  at_risk: AtRiskStudent[];
  at_risk_total: number;
};

// Số liệu trợ lý cho Home: chưa nộp học phí + học sinh vắng liên tiếp.
export const getHomeSummary = (): Promise<HomeSummary> =>
  api.get('/home/summary').then(r => r.data);

export type MonthlyWrap = {
  month: string;
  collected: number;
  sessions: number;
  attendance_pct: number | null;
  classes: number;
  students: number;
};

// Chốt sổ 1 tháng (mặc định tháng hiện tại nếu không truyền).
export const getMonthlyWrap = (month?: string): Promise<MonthlyWrap> =>
  api.get('/home/monthly-wrap', { params: month ? { month } : {} }).then(r => r.data);
