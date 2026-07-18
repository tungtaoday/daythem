import api from './client';

export const listAnnouncements = (classId: string) =>
  api.get(`/classes/${classId}/announcements`).then(r => r.data);

export const cancelClass = (classId: string, body: { session_date: string; content: string; propose_makeup?: boolean }) =>
  api.post(`/classes/${classId}/cancel`, body).then(r => r.data);

export const proposeMakeup = (announcementId: string, options: { date: string; time: string; label: string }[]) =>
  api.post(`/announcements/${announcementId}/makeup`, { options }).then(r => r.data);

export const getMakeupPoll = (makeupId: string) =>
  api.get(`/makeups/${makeupId}`).then(r => r.data);

export const voteMakeup = (makeupId: string, option_index: number, voter_name: string) =>
  api.post(`/makeups/${makeupId}/vote`, { option_index, voter_name }).then(r => r.data);

export const confirmMakeup = (makeupId: string, option_index: number) =>
  api.post(`/makeups/${makeupId}/confirm`, { option_index }).then(r => r.data);

// Các ngày lớp ĐÃ BÁO NGHỈ (đọc lại từ thông báo type=cancel) → hiện trạng thái lớp.
export const getCancelledDates = (classId: string): Promise<Set<string>> =>
  listAnnouncements(classId)
    .then((list: any[]) => new Set<string>((list || []).filter(a => a.type === 'cancel' && a.session_date).map(a => a.session_date)))
    .catch(() => new Set<string>());

// Buổi HỌC BÙ ĐÃ CHỐT của lớp: map "YYYY-MM-DD" → nhãn giờ (vd "19:00 · 1h30").
// Đọc từ makeup.confirmed_option trong danh sách thông báo — không cần endpoint riêng.
export const getConfirmedMakeups = (classId: string): Promise<Record<string, string>> =>
  listAnnouncements(classId)
    .then((list: any[]) => {
      const map: Record<string, string> = {};
      (list || []).forEach(a => {
        const m = a.makeup;
        if (m && m.confirmed_option !== null && m.confirmed_option !== undefined) {
          const opt = m.options?.[m.confirmed_option];
          if (opt?.date) map[opt.date] = opt.time || opt.label || '';
        }
      });
      return map;
    })
    .catch(() => ({}));
