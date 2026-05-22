import api from './client';

export const listSessions = (classId: string) =>
  api.get(`/classes/${classId}/attendance`).then(r => r.data);

export const recordAttendance = (classId: string, body: {
  session_date: string;
  records: { student_id: string; present: boolean; absence_reason?: string }[];
  notes?: string;
}) => api.post(`/classes/${classId}/attendance`, body).then(r => r.data);

export const getSession = (classId: string, sessionId: string) =>
  api.get(`/classes/${classId}/attendance/${sessionId}`).then(r => r.data);
