import api from './client';

export const getTuition = (classId: string, month: string) =>
  api.get(`/classes/${classId}/tuition/${month}`).then(r => r.data);

export const recordPayment = (
  classId: string,
  body: { student_id: string; paid: boolean; amount?: number; month?: string },
) => api.post(`/classes/${classId}/tuition/payment`, body).then(r => r.data);
