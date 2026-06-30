import api from './client';

export type NotifRule = { enabled?: boolean; lead_minutes?: number; at?: string; day_of_month?: number; weekday?: number };
export type NotifConfig = {
  rules: Record<string, NotifRule>;
  contact_policy: { quiet_hours?: [string, string]; max_marketing_per_week?: number; marketing_min_gap_hours?: number };
  marketing_opt_in: boolean;
  segments: string[];
};
export type Campaign = { id: string; title: string; body: string; cta_url?: string | null; at?: string | null };

export const getNotifConfig = (): Promise<NotifConfig> => api.get('/notify/config').then(r => r.data);
export const getCampaigns = (): Promise<{ campaigns: Campaign[] }> => api.get('/notify/campaigns').then(r => r.data);
export const putNotifPrefs = (body: {
  rules?: Record<string, NotifRule>;
  quiet_hours?: [string, string];
  marketing_opt_in?: boolean;
}): Promise<NotifConfig> => api.put('/notify/prefs', body).then(r => r.data);
export const registerPushToken = (token: string) => api.post('/notify/register-token', { token }).then(r => r.data);
export const logNotifEvent = (channel: 'utility' | 'marketing', event_type: 'delivered' | 'opened' | 'dismissed', rule?: string) =>
  api.post('/notify/events', { channel, event_type, rule }).then(r => r.data).catch(() => {});
