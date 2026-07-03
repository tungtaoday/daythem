// Lịch học: 1 lớp có nhiều BUỔI ĐỊNH KỲ, mỗi buổi có ngày + giờ + thời lượng +
// địa điểm RIÊNG. Lưu ở schedule.sessions[]. Tương thích ngược:
//  - cũ 1 ngày: { day, start_time, duration, location }
//  - cũ nhiều ngày (giờ chung): { days:[...], start_time, duration, location }

export type Session = { day: number; start_time?: string; duration?: number; location?: string };
export type Schedule = {
  day?: number;
  days?: number[];
  start_time?: string;
  duration?: number;
  location?: string;
  sessions?: Session[];
} | null | undefined;

export const DAY_SHORT: Record<number, string> = { 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7', 7: 'CN' };
export const DAY_FULL: Record<number, string> = { 1: 'Thứ 2', 2: 'Thứ 3', 3: 'Thứ 4', 4: 'Thứ 5', 5: 'Thứ 6', 6: 'Thứ 7', 7: 'Chủ nhật' };

export function jsDayToN(jsDay: number): number { return jsDay === 0 ? 7 : jsDay; }
export function todayDayN(): number { return jsDayToN(new Date().getDay()); }

/** Cộng phút vào "HH:MM" → "HH:MM" (kết thúc buổi). */
export function addMinutes(time: string | undefined, mins: number | undefined): string {
  if (!time) return '';
  const p = time.split(':').map(Number);
  const total = p[0] * 60 + (p[1] || 0) + (mins || 0);
  const hh = ((Math.floor(total / 60) % 24) + 24) % 24;
  const mm = ((total % 60) + 60) % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/** Danh sách buổi định kỳ đã chuẩn hoá (sort theo ngày). */
export function getSessions(sch: Schedule): Session[] {
  if (!sch) return [];
  if (Array.isArray(sch.sessions) && sch.sessions.length) {
    return sch.sessions.filter(s => s && s.day).slice().sort((a, b) => a.day - b.day);
  }
  const days = Array.isArray(sch.days) && sch.days.length ? sch.days : (sch.day ? [sch.day] : []);
  return [...new Set(days)].sort((a, b) => a - b)
    .map(d => ({ day: d, start_time: sch.start_time, duration: sch.duration, location: sch.location }));
}

/** Các thứ trong tuần có học (đã sort, dedupe). */
export function getDays(sch: Schedule): number[] {
  return [...new Set(getSessions(sch).map(s => s.day))];
}

export function hasClassOnDayN(sch: Schedule, dayN: number): boolean {
  return getSessions(sch).some(s => s.day === dayN);
}

/** Buổi định kỳ vào thứ dayN (để lấy giờ/thời lượng/địa điểm của đúng buổi đó). */
export function sessionForDay(sch: Schedule, dayN: number): Session | undefined {
  return getSessions(sch).find(s => s.day === dayN);
}

/** Nhãn các ngày, vd "T2, T4, T6". */
export function daysLabel(sch: Schedule): string {
  return getDays(sch).map(d => DAY_SHORT[d]).join(', ');
}

/** Chuỗi giờ của 1 buổi, vd "18:30 – 20:00" (nếu có thời lượng). */
export function sessionTimeStr(s: Session | undefined): string {
  if (!s || !s.start_time) return '';
  const end = s.duration ? addMinutes(s.start_time, s.duration) : '';
  return end ? `${s.start_time} – ${end}` : s.start_time;
}

/** Buổi gần nhất sắp tới (vòng tuần). Trả kèm chính buổi đó (giờ/thời lượng riêng). delta=0 = hôm nay. */
export function nextOccurrence(sch: Schedule, from: Date = new Date()): { date: Date; dayN: number; delta: number; session: Session } | null {
  const sessions = getSessions(sch);
  if (!sessions.length) return null;
  const todayN = jsDayToN(from.getDay());
  let bestDelta = 99, bestS = sessions[0];
  for (const s of sessions) {
    const dist = (((s.day - todayN) % 7) + 7) % 7;
    if (dist < bestDelta) { bestDelta = dist; bestS = s; }
  }
  const date = new Date(from);
  date.setDate(from.getDate() + bestDelta);
  return { date, dayN: bestS.day, delta: bestDelta, session: bestS };
}
