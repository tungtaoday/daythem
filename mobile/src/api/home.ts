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
