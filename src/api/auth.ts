import api from './client';

export const requestOTP = (phone: string) =>
  api.post('/auth/request-otp', { phone }).then(r => r.data);

export const verifyOTP = (phone: string, code: string) =>
  api.post('/auth/verify-otp', { phone, code }).then(r => r.data);

export const getMe = () =>
  api.get('/auth/me').then(r => r.data);

export const updateProfile = (name: string, avatar_url?: string) =>
  api.put('/auth/profile', { name, avatar_url }).then(r => r.data);
