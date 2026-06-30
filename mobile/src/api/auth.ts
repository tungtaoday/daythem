import api from './client';

export const loginWithPassword = (phone: string, password: string) =>
  api.post('/auth/login', { phone, password }).then(r => r.data);

export const getMe = () =>
  api.get('/auth/me').then(r => r.data);

export const updateProfile = (name: string, avatar_url?: string) =>
  api.put('/auth/profile', { name, avatar_url }).then(r => r.data);

export type TaxProfileFields = {
  tax_id?: string;
  full_legal_name?: string;
  id_number?: string;
  date_of_birth?: string;
  address?: string;
};

export const updateTaxProfile = (fields: TaxProfileFields) =>
  api.put('/auth/profile', fields).then(r => r.data);

export const deleteAccount = () =>
  api.delete('/auth/account').then(r => r.data);

export const changePassword = (current_password: string, new_password: string) =>
  api.put('/auth/password', { current_password, new_password }).then(r => r.data);
