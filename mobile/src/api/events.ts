import api from './client';

// Báo 1 event kích hoạt xảy ra trên máy (server không quan sát được), vd chia sẻ thiệp.
// Fire-and-forget: lỗi được nuốt, không bao giờ chặn thao tác của GV.
export const trackEvent = (kind: string): void => {
  api.post('/events/track', { kind }).catch(() => {});
};
