import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme';
import { useClassesStore } from '../../store/classes';
import { classColor } from '../../theme/classColors';
import { useAuthStore, isDemoToken } from '../../store/auth';
import { IconChevron } from '../../components/icons';
import { BackButton } from '../../components/ui/BackButton';
import { EmptyState } from '../../components/ui/EmptyState';
import { getDays, hasClassOnDayN, nextOccurrence, DAY_FULL, DAY_SHORT } from '../../utils/schedule';

const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function getMonthLabel(year: number, month: number) {
  return `Tháng ${month + 1}, ${year}`;
}

function getWeekDaysForMonth(year: number, month: number, selectedDate: Date) {
  // Return the week containing selectedDate
  const dow = selectedDate.getDay();
  const monday = new Date(selectedDate);
  monday.setDate(selectedDate.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function CalendarScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { classes } = useClassesStore();
  const isDemo = isDemoToken(useAuthStore(st => st.token));
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  const [mode, setMode] = useState<'week' | 'month'>('week');

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const weekDays = getWeekDaysForMonth(year, month, selectedDate);
  const todayStr = today.toDateString();

  const prevMonth = () => {
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() - 1);
    setViewDate(d);
    setSelectedDate(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  const nextMonth = () => {
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() + 1);
    setViewDate(d);
    setSelectedDate(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  // Build full month grid (Mon-start)
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const offset = firstDay === 0 ? 6 : firstDay - 1; // Mon=0
  const daysInMonth = getDaysInMonth(year, month);
  const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - offset + 1;
    return dayNum >= 1 && dayNum <= daysInMonth ? new Date(year, month, dayNum) : null;
  });

  // Selected day: day-of-week 1=Mon..7=Sun
  const selDow = selectedDate.getDay();
  const selDayN = selDow === 0 ? 7 : selDow;
  const selectedClasses = classes.filter((c: any) => hasClassOnDayN(c.schedule, selDayN));

  // Ngày đã chọn là buổi đã qua / hôm nay → cho điểm danh đúng buổi đó.
  const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const selYmd = ymd(selectedDate);
  const isPastOrToday = selYmd <= ymd(new Date());

  // Monthly stats — "Buổi định kỳ" tính thật: với mỗi lớp, đếm số ngày trong
  // tháng đang xem có thứ ∈ getDays(schedule); cộng dồn tất cả lớp.
  // Buổi bù / buổi nghỉ không có nguồn dữ liệu thật → chỉ hiện trong demo.
  const countMonthlyScheduled = (y: number, m: number) => {
    let total = 0;
    const dim = getDaysInMonth(y, m);
    for (const c of classes) {
      const days = getDays(c.schedule);
      if (!days.length) continue;
      for (let day = 1; day <= dim; day++) {
        const dow = new Date(y, m, day).getDay();
        const dayN = dow === 0 ? 7 : dow;
        if (days.includes(dayN)) total++;
      }
    }
    return total;
  };
  const monthlyScheduled = countMonthlyScheduled(year, month);
  const monthlyMakeup = 1;
  const monthlyCancelled = 1;

  // Week navigation: dịch tuần bằng cách dời selectedDate ±7 ngày.
  const shiftWeek = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d);
  };

  // "SẮP TỚI": buổi gần nhất trên tất cả các lớp (delta nhỏ nhất, hoà thì start_time sớm hơn).
  const upcoming = (() => {
    let best: { cls: any; occ: { date: Date; dayN: number; delta: number } } | null = null;
    for (const c of classes) {
      const occ = nextOccurrence(c.schedule);
      if (!occ) continue;
      if (
        !best ||
        occ.delta < best.occ.delta ||
        (occ.delta === best.occ.delta &&
          (c.schedule?.start_time || '99:99') < (best.cls.schedule?.start_time || '99:99'))
      ) {
        best = { cls: c, occ };
      }
    }
    return best;
  })();

  const isSelected = (d: Date | null) =>
    d !== null && d.toDateString() === selectedDate.toDateString();
  const isToday = (d: Date | null) =>
    d !== null && d.toDateString() === todayStr;

  const selDateLabel = () => {
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return `${days[selectedDate.getDay()]}, ${selectedDate.getDate()}/${selectedDate.getMonth() + 1}`;
  };

  // Danh sách buổi học của ngày đang chọn — dùng chung cho cả 2 chế độ.
  const renderSessionsSection = () => (
    <View style={s.section}>
      <Text style={s.sectionLabel}>
        {selDateLabel().toUpperCase()} · {selectedClasses.length > 0 ? `${selectedClasses.length} buổi học` : 'Không có lớp'}
      </Text>
      {selectedClasses.length > 0 ? (
        <View style={s.card}>
          {selectedClasses.map((cls: any, i: number) => (
            <View key={cls.id} style={[s.classRow, i > 0 && s.divider]}>
              <View style={s.classBar} />
              <View style={{ flex: 1 }}>
                <View style={s.nameRow}>
                  <View style={[s.colorDot, { backgroundColor: classColor(cls.color).dot }]} />
                  <Text style={s.className}>{cls.name} · {cls.subject}</Text>
                </View>
                <Text style={s.classSub}>
                  {cls.schedule?.start_time ? `${cls.schedule.start_time} · ` : ''}
                  {cls.student_count || 0} học sinh
                  {cls.schedule?.location ? ` · ${cls.schedule.location}` : ''}
                </Text>
              </View>
              {isPastOrToday ? (
                <TouchableOpacity
                  style={s.attendBtn}
                  onPress={() => navigation.navigate('Attendance', { classId: cls.id, className: cls.name, sessionDate: selYmd })}
                >
                  <Text style={s.attendBtnText}>Điểm danh</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={s.openBtn}
                  onPress={() => navigation.navigate('ClassDetail', { classId: cls.id, className: cls.name })}
                >
                  <Text style={s.openBtnText}>Mở lớp →</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      ) : (
        <View style={s.emptyDay}>
          <Text style={s.emptyDayText}>Ngày nghỉ</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <BackButton variant="boxed" onPress={() => navigation.goBack()} />
        <Text style={s.headerTitle}>Lịch dạy</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tuần | Tháng toggle */}
      <View style={s.toggleRow}>
        <View style={s.toggle}>
          <TouchableOpacity
            style={[s.toggleBtn, mode === 'week' && s.toggleBtnActive]}
            onPress={() => setMode('week')}
            activeOpacity={0.8}
          >
            <Text style={[s.toggleText, mode === 'week' && s.toggleTextActive]}>Tuần</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.toggleBtn, mode === 'month' && s.toggleBtnActive]}
            onPress={() => setMode('month')}
            activeOpacity={0.8}
          >
            <Text style={[s.toggleText, mode === 'month' && s.toggleTextActive]}>Tháng</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {mode === 'month' && (
          <>
        {/* Month nav */}
        <View style={s.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={s.monthArrow}>
            <View style={{ transform: [{ rotate: '180deg' }] }}>
              <IconChevron size={16} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
          <Text style={s.monthLabel}>{getMonthLabel(year, month)}</Text>
          <TouchableOpacity onPress={nextMonth} style={s.monthArrow}>
            <IconChevron size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Day-of-week headers */}
        <View style={s.dowRow}>
          {DAY_LABELS.map(l => (
            <Text key={l} style={s.dowLabel}>{l}</Text>
          ))}
        </View>

        {/* Month grid */}
        <View style={s.grid}>
          {Array.from({ length: totalCells / 7 }, (_, row) => (
            <View key={row} style={s.gridRow}>
              {cells.slice(row * 7, row * 7 + 7).map((d, col) => {
                const active = isSelected(d);
                const todayMark = isToday(d);
                // Dot if class on that day
                const hasCls = d !== null && (() => {
                  const dow = d.getDay();
                  const dayN = dow === 0 ? 7 : dow;
                  return classes.some((c: any) => hasClassOnDayN(c.schedule, dayN));
                })();
                return (
                  <TouchableOpacity
                    key={col}
                    style={[s.cell, active && s.cellSelected, todayMark && !active && s.cellToday]}
                    onPress={() => d && setSelectedDate(d)}
                    activeOpacity={d ? 0.7 : 1}
                  >
                    <Text style={[s.cellText, active && s.cellTextSelected, todayMark && !active && s.cellTextToday, !d && { opacity: 0 }]}>
                      {d ? d.getDate() : '·'}
                    </Text>
                    {hasCls && !active && <View style={[s.dot, todayMark && { backgroundColor: colors.green500 }]} />}
                    {hasCls && active && <View style={[s.dot, { backgroundColor: 'rgba(255,255,255,0.7)' }]} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Selected day classes */}
        {renderSessionsSection()}

        {/* Monthly overview */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>TỔNG QUAN THÁNG {month + 1}</Text>
          <View style={s.statsCard}>
            <StatItem value={String(monthlyScheduled)} label="Buổi định kỳ" color={colors.green700} bg={colors.green100} />
            {isDemo && <StatItem value={String(monthlyMakeup)} label="Buổi bù" color="#8a6d30" bg={colors.honey100} />}
            {isDemo && <StatItem value={String(monthlyCancelled)} label="Buổi nghỉ" color={colors.coral700} bg="#ffe5da" />}
          </View>
        </View>
          </>
        )}

        {mode === 'week' && (
          <>
            {/* Week nav */}
            <View style={s.monthNav}>
              <TouchableOpacity onPress={() => shiftWeek(-7)} style={s.monthArrow}>
                <View style={{ transform: [{ rotate: '180deg' }] }}>
                  <IconChevron size={16} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
              <Text style={s.monthLabel}>{getMonthLabel(selectedDate.getFullYear(), selectedDate.getMonth())}</Text>
              <TouchableOpacity onPress={() => shiftWeek(7)} style={s.monthArrow}>
                <IconChevron size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Week strip */}
            <View style={s.weekStrip}>
              {weekDays.map((d, i) => {
                const dow = d.getDay();
                const dayN = dow === 0 ? 7 : dow;
                const active = isSelected(d);
                const todayMark = isToday(d);
                const hasCls = classes.some((c: any) => hasClassOnDayN(c.schedule, dayN));
                return (
                  <TouchableOpacity
                    key={i}
                    style={[s.weekCell, active && s.weekCellSelected, todayMark && !active && s.weekCellToday]}
                    onPress={() => setSelectedDate(d)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.weekDow, active && s.weekTextSelected]}>{DAY_SHORT[dayN]}</Text>
                    <Text style={[s.weekDate, active && s.weekTextSelected, todayMark && !active && s.weekDateToday]}>
                      {d.getDate()}
                    </Text>
                    {hasCls && <View style={[s.weekDot, active && { backgroundColor: 'rgba(255,255,255,0.8)' }]} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Selected day sessions */}
            {renderSessionsSection()}

            {/* SẮP TỚI */}
            {upcoming && (
              <View style={s.section}>
                <Text style={s.sectionLabel}>SẮP TỚI</Text>
                <TouchableOpacity
                  style={s.upcomingCard}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('ClassDetail', { classId: upcoming.cls.id, className: upcoming.cls.name })}
                >
                  <View style={[s.classBar, { backgroundColor: classColor(upcoming.cls.color).dot }]} />
                  <View style={{ flex: 1 }}>
                    <View style={s.nameRow}>
                      <View style={[s.colorDot, { backgroundColor: classColor(upcoming.cls.color).dot }]} />
                      <Text style={s.className}>{upcoming.cls.name} · {upcoming.cls.subject}</Text>
                    </View>
                    <Text style={s.classSub}>
                      {DAY_FULL[upcoming.occ.dayN]}
                      {upcoming.cls.schedule?.start_time ? ` · ${upcoming.cls.schedule.start_time}` : ''}
                      {upcoming.cls.schedule?.location ? ` · ${upcoming.cls.schedule.location}` : ''}
                    </Text>
                  </View>
                  <Text style={s.openBtnText}>Mở lớp →</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Tổng quan tháng */}
            <View style={s.section}>
              <Text style={s.sectionLabel}>TỔNG QUAN THÁNG {selectedDate.getMonth() + 1}</Text>
              <View style={s.statsCard}>
                <StatItem value={String(countMonthlyScheduled(selectedDate.getFullYear(), selectedDate.getMonth()))} label="Buổi định kỳ" color={colors.green700} bg={colors.green100} />
                {isDemo && <StatItem value={String(monthlyMakeup)} label="Buổi bù" color="#8a6d30" bg={colors.honey100} />}
                {isDemo && <StatItem value={String(monthlyCancelled)} label="Buổi nghỉ" color={colors.coral700} bg="#ffe5da" />}
              </View>
            </View>
          </>
        )}

        {/* Classes summary */}
        {classes.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>CÁC LỚP ĐANG DẠY</Text>
            <View style={s.card}>
              {classes.map((cls: any, i: number) => {
                const dow = cls.schedule?.day; // 1=Mon..7=Sun
                const dayName = dow ? DAY_LABELS[dow - 1] : '–';
                return (
                  <View key={cls.id} style={[s.classRow, i > 0 && s.divider]}>
                    <View style={s.classBar} />
                    <View style={{ flex: 1 }}>
                      <View style={s.nameRow}>
                      <View style={[s.colorDot, { backgroundColor: classColor(cls.color).dot }]} />
                      <Text style={s.className}>{cls.name} · {cls.subject}</Text>
                    </View>
                      <Text style={s.classSub}>
                        {dayName}{cls.schedule?.start_time ? ` · ${cls.schedule.start_time}` : ''} · {cls.student_count || 0} học sinh
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {classes.length === 0 && (
          <EmptyState
            icon="📅"
            title="Chưa có lịch học nào"
            subtitle="Tạo lớp và đặt lịch học để xem trên lịch tuần/tháng."
            ctaLabel="+ Tạo lớp học"
            onCta={() => navigation.navigate('CreateClass')}
          />
        )}
      </ScrollView>
    </View>
  );
}

function StatItem({ value, label, color, bg }: { value: string; label: string; color: string; bg: string }) {
  return (
    <View style={[si.box, { backgroundColor: bg }]}>
      <Text style={[si.value, { color }]}>{value}</Text>
      <Text style={[si.label, { color }]}>{label}</Text>
    </View>
  );
}

const si = StyleSheet.create({
  box: { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center' },
  value: { fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
  label: { fontSize: 11, fontWeight: '600', marginTop: 3, textAlign: 'center' },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, marginBottom: 16,
  },
  monthArrow: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: 'white',
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  monthLabel: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.3 },
  dowRow: {
    flexDirection: 'row', paddingHorizontal: 12, marginBottom: 4,
  },
  dowLabel: {
    flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700',
    color: colors.textSecondary, letterSpacing: 0.2,
  },
  grid: { paddingHorizontal: 12, marginBottom: 8 },
  gridRow: { flexDirection: 'row', marginBottom: 4 },
  cell: {
    flex: 1, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  cellSelected: { backgroundColor: colors.green500 },
  cellToday: { backgroundColor: colors.green100 },
  cellText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  cellTextSelected: { color: 'white' },
  cellTextToday: { color: colors.green700 },
  dot: {
    width: 5, height: 5, borderRadius: 2.5,
    backgroundColor: colors.green500, position: 'absolute', bottom: 5,
  },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 0.4, marginBottom: 10,
  },
  card: {
    backgroundColor: 'white', borderRadius: 18,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  classRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  classBar: { width: 4, height: 36, borderRadius: 2, backgroundColor: colors.green500 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  colorDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  className: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  classSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  openBtn: {
    paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: colors.green100, borderRadius: 10,
  },
  openBtnText: { fontSize: 12, fontWeight: '700', color: colors.green700 },
  attendBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.green500, borderRadius: 10 },
  attendBtnText: { fontSize: 12, fontWeight: '700', color: 'white' },
  emptyDay: {
    backgroundColor: 'white', borderRadius: 18, borderWidth: 1,
    borderColor: colors.border, padding: 20, alignItems: 'center',
  },
  emptyDayText: { fontSize: 14, color: colors.textSecondary },
  statsCard: { flexDirection: 'row', gap: 10 },
  // Tuần | Tháng toggle
  toggleRow: { paddingHorizontal: 16, paddingBottom: 12 },
  toggle: {
    flexDirection: 'row', backgroundColor: colors.green100, borderRadius: 12, padding: 3,
  },
  toggleBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
  },
  toggleBtnActive: { backgroundColor: 'white' },
  toggleText: { fontSize: 13, fontWeight: '700', color: colors.green700 },
  toggleTextActive: { color: colors.textPrimary },
  // Week strip
  weekStrip: {
    flexDirection: 'row', paddingHorizontal: 12, gap: 4, marginBottom: 8,
  },
  weekCell: {
    flex: 1, height: 60, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 3,
  },
  weekCellSelected: { backgroundColor: colors.green500 },
  weekCellToday: { backgroundColor: colors.green100 },
  weekDow: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.2 },
  weekDate: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  weekDateToday: { color: colors.green700 },
  weekTextSelected: { color: 'white' },
  weekDot: {
    width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.green500,
  },
  upcomingCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    backgroundColor: 'white', borderRadius: 18, borderWidth: 1, borderColor: colors.border,
  },
});
