import api from './client';

export const listReports = (classId: string) =>
  api.get(`/classes/${classId}/reports`).then(r => r.data);

export const generateReport = (classId: string, week_start: string) =>
  api.post(`/classes/${classId}/reports/generate`, { week_start }).then(r => r.data);

export const getReport = (reportId: string) =>
  api.get(`/reports/${reportId}`).then(r => r.data);
