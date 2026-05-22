import api from './client';

export type ClassBody = {
  name: string; subject: string; grade: string;
  default_fee?: number; fee_type?: string; schedule?: object;
};

export const listClasses = () => api.get('/classes').then(r => r.data);
export const getClass = (id: string) => api.get(`/classes/${id}`).then(r => r.data);
export const createClass = (body: ClassBody) => api.post('/classes', body).then(r => r.data);
export const updateClass = (id: string, body: Partial<ClassBody> & { zalo_group_id?: string }) =>
  api.put(`/classes/${id}`, body).then(r => r.data);
export const archiveClass = (id: string) => api.delete(`/classes/${id}`);
