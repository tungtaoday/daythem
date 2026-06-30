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
import { EmptyState } from '../../components/ui/EmptyState';

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
  const selectedClasses = classes.filter((c: any) => c.schedule?.day === selDayN);

  // Monthly stats — scheduled is a reasonable estimate (~4 buổi/tháng mỗi lớp).
  // Buổi bù / buổi nghỉ chỉ có số liệu trong phiên demo.
  const monthlyScheduled = classes.length * 4;
  const monthlyMakeup = 1;
  const monthlyCancelled = 1;

  const isSelected = (d: Date | null) =>
    d !== null && d.toDateString() === selectedDate.toDateString();
  const isToday = (d: Date | null) =>
    d !== null && d.toDateString() === todayStr;

  const selDateLabel = () => {
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return `${days[selectedDate.getDay()]}, ${selectedDate.getDate()}/${selectedDate.getMonth() + 1}`;
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <View style={{ transform: [{ rotate: '180deg' }] }}>
            <IconChevron size={20} color={colors.textPrimary} />
          </View>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Lịch dạy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
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
                  return classes.some((c: any) => c.schedule?.day === dayN);
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
                  <TouchableOpacity
                    style={s.openBtn}
                    onPress={() => navigation.navigate('ClassDetail', { classId: cls.id, className: cls.name })}
                  >
                    <Text style={s.openBtnText}>Mở lớp →</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={s.emptyDay}>
              <Text style={s.emptyDayText}>Ngày nghỉ</Text>
            </View>
          )}
        </View>

        {/* Monthly overview */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>TỔNG QUAN THÁNG {month + 1}</Text>
          <View style={s.statsCard}>
            <StatItem value={String(monthlyScheduled)} label="Buổi định kỳ" color={colors.green700} bg={colors.green100} />
            {isDemo && <StatItem value={String(monthlyMakeup)} label="Buổi bù" color="#8a6d30" bg={colors.honey100} />}
            {isDemo && <StatItem value={String(monthlyCancelled)} label="Buổi nghỉ" color={colors.coral700} bg="#ffe5da" />}
          </View>
        </View>

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
  backBtn: {
    width: 40, height: 40, borderRadius: 13,
    backgroundColor: 'white', borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
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
  emptyDay: {
    backgroundColor: 'white', borderRadius: 18, borderWidth: 1,
    borderColor: colors.border, padding: 20, alignItems: 'center',
  },
  emptyDayText: { fontSize: 14, color: colors.textSecondary },
  statsCard: { flexDirection: 'row', gap: 10 },
});
