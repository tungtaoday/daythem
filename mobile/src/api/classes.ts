import api from './client';

export type ClassBody = {
  name: string; subject: string; grade: string;
  default_fee?: number; fee_type?: string; schedule?: object; color?: string;
};

export const listClasses = (archived = false) =>
  api.get('/classes', { params: { archived } }).then(r => r.data);
export const getClass = (id: string) => api.get(`/classes/${id}`).then(r => r.data);
export const createClass = (body: ClassBody) => api.post('/classes', body).then(r => r.data);
export const updateClass = (id: string, body: Partial<ClassBody> & { zalo_group_id?: string; archived?: boolean }) =>
  api.put(`/classes/${id}`, body).then(r => r.data);
export const archiveClass = (id: string) => api.delete(`/classes/${id}`);
export const restoreClass = (id: string) => api.put(`/classes/${id}`, { archived: false }).then(r => r.data);
