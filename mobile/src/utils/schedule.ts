// Lịch học: 1 lớp có thể nhiều ngày/tuần. Lưu ở schedule.days (mảng 1=T2..7=CN),
// tương thích ngược với schedule.day (1 ngày) cũ.

export type Schedule = {
  day?: number;
  days?: number[];
  start_time?: string;
  duration?: number;
  location?: string;
} | null | undefined;

export const DAY_SHORT: Record<number, string> = { 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7', 7: 'CN' };
export const DAY_FULL: Record<number, string> = { 1: 'Thứ 2', 2: 'Thứ 3', 3: 'Thứ 4', 4: 'Thứ 5', 5: 'Thứ 6', 6: 'Thứ 7', 7: 'Chủ nhật' };

/** JS getDay (0=CN..6=T7) → quy ước app 1=T2..7=CN. */
export function jsDayToN(jsDay: number): number { return jsDay === 0 ? 7 : jsDay; }
export function todayDayN(): number { return jsDayToN(new Date().getDay()); }

/** Các ngày học trong tuần của lớp (đã sort). Ưu tiên days[], fallback day. */
export function getDays(sch: Schedule): number[] {
  if (!sch) return [];
  if (Array.isArray(sch.days) && sch.days.length) return [...new Set(sch.days)].sort((a, b) => a - b);
  if (sch.day) return [sch.day];
  return [];
}

/** Có buổi vào thứ dayN không. */
export function hasClassOnDayN(sch: Schedule, dayN: number): boolean {
  return getDays(sch).includes(dayN);
}

/** Nhãn các ngày, vd "T2, T4, T6". */
export function daysLabel(sch: Schedule): string {
  return getDays(sch).map(d => DAY_SHORT[d]).join(', ');
}

/** Buổi gần nhất sắp tới (tính từ `from`, vòng tuần). delta=0 nghĩa là hôm nay. */
export function nextOccurrence(sch: Schedule, from: Date = new Date()): { date: Date; dayN: number; delta: number } | null {
  const days = getDays(sch);
  if (!days.length) return null;
  const todayN = jsDayToN(from.getDay());
  let bestDelta = 99, bestDay = days[0];
  for (const d of days) {
    const dist = (((d - todayN) % 7) + 7) % 7;
    if (dist < bestDelta) { bestDelta = dist; bestDay = d; }
  }
  const date = new Date(from);
  date.setDate(from.getDate() + bestDelta);
  return { date, dayN: bestDay, delta: bestDelta };
}
