import api from './client';

export const listStudents = (classId: string) =>
  api.get(`/classes/${classId}/students`).then(r => r.data);

export const addStudent = (classId: string, body: { name: string; parent_name?: string; parent_phone?: string; note?: string }) =>
  api.post(`/classes/${classId}/students`, body).then(r => r.data);

export const updateStudent = (id: string, body: Partial<{ name: string; parent_name: string; parent_phone: string; note: string }>) =>
  api.put(`/students/${id}`, body).then(r => r.data);

export const removeStudent = (id: string) => api.delete(`/students/${id}`);

export const setStudentFee = (id: string, body: { fee_type: string; amount?: number; note?: string }) =>
  api.put(`/students/${id}/fee`, body).then(r => r.data);
