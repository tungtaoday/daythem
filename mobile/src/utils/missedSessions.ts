import { listSessions } from '../api/attendance';
import { getCancelledDates, getConfirmedMakeups } from '../api/announcements';
import { hasClassOnDayN } from './schedule';

// Đếm số buổi ĐÃ QUA trong tháng hiện tại mà CHƯA điểm danh, trên tất cả lớp.
// Cùng luật với màn Lịch: chỉ tính buổi trước hôm nay (buổi hôm nay có thể chưa
// diễn ra), bỏ buổi đã báo nghỉ, bỏ ngày trước khi lớp được tạo, tính cả buổi
// học bù đã chốt. Lỗi mạng lớp nào thì bỏ lớp đó (không đoán mò).
export async function countMissedThisMonth(classes: any[]): Promise<number> {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  const ymd = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const todayYmd = ymd(today);
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  let missed = 0;

  await Promise.all(classes.map(async (c: any) => {
    try {
      const [attended, cancels, makeups] = await Promise.all([
        listSessions(c.id).then((arr: any[]) => new Set<string>((arr || []).map((s: any) => s.session_date))),
        getCancelledDates(c.id),
        getConfirmedMakeups(c.id),
      ]);
      const created = c.created_at ? String(c.created_at).slice(0, 10) : '';
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(y, m, day);
        const dYmd = ymd(d);
        if (dYmd >= todayYmd) break;
        if (created && dYmd < created) continue;
        const dow = d.getDay();
        const scheduled = hasClassOnDayN(c.schedule, dow === 0 ? 7 : dow) || !!makeups[dYmd];
        if (!scheduled || cancels.has(dYmd) || attended.has(dYmd)) continue;
        missed++;
      }
    } catch {}
  }));
  return missed;
}
