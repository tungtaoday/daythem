import api from './client';

export type Promo = {
  id: string;
  active: boolean;
  title: string;
  body: string;
  cta_label?: string | null;
  cta_url?: string | null;
  tone?: string;
};

export const getPromo = (): Promise<Promo> =>
  api.get('/promo').then(r => r.data);
