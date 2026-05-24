import api from './client';

export const loginWithPassword = (phone: string, password: string) =>
  api.post('/auth/login', { phone, password }).then(r => r.data);

export const getMe = () =>
  api.get('/auth/me').then(r => r.data);

export const updateProfile = (name: string, avatar_url?: string) =>
  api.put('/auth/profile', { name, avatar_url }).then(r => r.data);
