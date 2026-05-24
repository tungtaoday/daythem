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
