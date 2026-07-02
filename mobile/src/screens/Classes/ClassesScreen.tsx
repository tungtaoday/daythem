import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from '../../components/ui/Avatar';
import { classColor } from '../../theme/classColors';
import { useAuthStore, isDemoToken } from '../../store/auth';

import { useClassesStore } from '../../store/classes';
import { IconPlus, IconChevron } from '../../components/icons';
import { getTuition } from '../../api/tuition';
import { nextOccurrence, hasClassOnDayN, todayDayN, DAY_FULL, daysLabel } from '../../utils/schedule';

// ── time / countdown helpers ──────────────────────────────────

function addMinutes(time: string, mins: number): string {
  const parts = time.split(':').map(Number);
  const total = parts[0] * 60 + (parts[1] || 0) + (mins || 0);
  const hh = ((Math.floor(total / 60) % 24) + 24) % 24;
  const mm = ((total % 60) + 60) % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function countdownLabel(delta: number, day: number): string {
  if (delta === 0) return 'HÔM NAY';
  if (delta === 1) return `${DAY_FULL[day].toUpperCase()} · NGÀY MAI`;
  return `${DAY_FULL[day].toUpperCase()} TỚI · CÒN ${delta} NGÀY`;
}

// ── AvatarStack (overlapping circles) ────────────────────────

function AvatarStack({ names, maxVisible = 5, ringColor = 'white' }: { names: string[]; maxVisible?: number; ringColor?: string }) {
  const visible = names.slice(0, maxVisible);
  const rest = names.length - maxVisible;
  return (
    <View style={{ flexDirection: 'row' }}>
      {visible.map((name, i) => (
        <View key={i} style={{ marginLeft: i === 0 ? 0 : -9, borderRadius: 15, borderWidth: 2, borderColor: ringColor }}>
          <Avatar name={name} size={26} />
        </View>
      ))}
      {rest > 0 && (
        <View style={[as.rest, { marginLeft: -9, borderColor: ringColor }]}>
          <Text style={as.restText}>+{rest}</Text>
        </View>
      )}
    </View>
  );
}

const as = StyleSheet.create({
  rest: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.25)', borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  restText: { fontSize: 9, fontWeight: '700', color: 'white' },
});

// ── ClassCardLarge ────────────────────────────────────────────

function ClassCardLarge({ klass, highlighted, studentNames, paidCount, totalCount, onPress }: any) {
  const dayLabel = daysLabel(klass.schedule);
  const timeStr = klass.schedule?.start_time || '';
  const loc = klass.schedule?.location || '';
  const totalDue = totalCount - paidCount;
  const paidRatio = totalCount > 0 ? paidCount / totalCount : 0;

  const cardStyle: any[] = [cc.card];
  if (highlighted) {
    // Native không render CSS gradient → dùng solid green (web & máy khớp nhau).
    cardStyle.push(cc.cardHighlighted, { backgroundColor: colors.green500 } as any);
  }

  const labelColor = highlighted ? 'rgba(255,255,255,0.8)' : colors.textSecondary;
  const titleColor = highlighted ? 'white' : colors.textPrimary;
  const metaColor = highlighted ? 'rgba(255,255,255,0.8)' : colors.textSecondary;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88}>
      <View style={cardStyle}>
        {/* gradient nền + blobs */}
        {highlighted && (
          <>
            <LinearGradient colors={classColor(klass?.color).grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <View style={cc.blob1} />
            <View style={cc.blob2} />
          </>
        )}

        {/* header */}
        <View style={cc.header}>
          <View style={{ flex: 1 }}>
            <Text style={[cc.dayLabel, { color: labelColor }]}>
              {highlighted ? '· HÔM NAY' : `${dayLabel.toUpperCase()}${timeStr ? ' · ' + timeStr : ''}`}
            </Text>
            <View style={cc.titleRow}>
              {!highlighted && <View style={[cc.colorDot, { backgroundColor: classColor(klass.color).dot }]} />}
              <Text style={[cc.title, { color: titleColor, flex: 1 }]}>
                {klass.name} · {klass.subject}
              </Text>
            </View>
            {(timeStr || loc) ? (
              <Text style={[cc.meta, { color: metaColor }]}>
                {[timeStr, loc].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
          </View>
          <View style={[cc.badge, highlighted ? cc.badgeHoney : cc.badgeGray]}>
            <Text style={[cc.badgeText, highlighted ? cc.badgeTextHoney : cc.badgeTextGray]}>
              {highlighted ? 'Sắp diễn ra' : (dayLabel || 'Sắp tới')}
            </Text>
          </View>
        </View>

        {/* progress bar: học phí */}
        {totalCount > 0 && (
          <View style={cc.progressWrap}>
            <View style={cc.progressRow}>
              <Text style={[cc.progressLabel, { color: highlighted ? 'rgba(255,255,255,0.9)' : '#444' }]}>
                Đã thu {paidCount}/{totalCount}
              </Text>
              <Text style={[cc.progressLabel, { color: highlighted ? 'rgba(255,255,255,0.75)' : colors.textSecondary }]}>
                {totalDue > 0 ? `Còn ${totalDue} chưa nộp` : 'Đủ rồi 🎉'}
              </Text>
            </View>
            <View style={[cc.progressBg, { backgroundColor: highlighted ? 'rgba(255,255,255,0.2)' : colors.border }]}>
              <View style={[cc.progressFill, {
                width: `${paidRatio * 100}%` as any,
                backgroundColor: highlighted ? 'white' : colors.green500,
              }]} />
            </View>
          </View>
        )}

        {/* bottom: avatar stack + button */}
        <View style={cc.bottom}>
          {studentNames.length > 0 ? (
            <AvatarStack
              names={studentNames}
              maxVisible={5}
              ringColor={highlighted ? colors.green600 : 'white'}
            />
          ) : (
            <Text style={[cc.countText, { color: highlighted ? 'rgba(255,255,255,0.85)' : colors.textSecondary }]}>
              {klass.student_count} học sinh
            </Text>
          )}
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={[cc.btn, highlighted ? cc.btnLight : cc.btnGreen]}
            onPress={onPress}
          >
            <Text style={[cc.btnText, highlighted ? cc.btnTextLight : cc.btnTextGreen]}>
              {highlighted ? 'Mở lớp →' : 'Xem'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const cc = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3, overflow: 'hidden', position: 'relative' },
  cardHighlighted: { borderWidth: 0, shadowColor: '#4a9e72', shadowOpacity: 0.25, shadowRadius: 20, elevation: 8 },
  blob1: { position: 'absolute', top: -40, right: -30, width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.08)' },
  blob2: { position: 'absolute', bottom: -50, right: -50, width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.06)' },

  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 8 },
  dayLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colorDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  title: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  meta: { fontSize: 13, marginTop: 2 },

  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, alignSelf: 'flex-start', flexShrink: 0 },
  badgeHoney: { backgroundColor: 'rgba(255,255,255,0.9)' },
  badgeGray: { backgroundColor: colors.border },
  badgeText: { fontSize: 12, fontWeight: '600' },
  badgeTextHoney: { color: colors.honey700 },
  badgeTextGray: { color: '#666' },

  progressWrap: { marginBottom: 14 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, fontWeight: '600' },
  progressBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },

  bottom: { flexDirection: 'row', alignItems: 'center' },
  countText: { fontSize: 13 },
  btn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  btnLight: { backgroundColor: 'white' },
  btnGreen: { backgroundColor: colors.green50 },
  btnText: { fontSize: 14, fontWeight: '600' },
  btnTextLight: { color: colors.green600 },
  btnTextGreen: { color: colors.green600 },
});

// ── ActivityRow ───────────────────────────────────────────────

function ActivityRow({ iconBg, iconColor, Icon, title, time, last }: any) {
  return (
    <View style={[ar.row, !last && ar.divider]}>
      <View style={[ar.iconWrap, { backgroundColor: iconBg }]}>
        <Icon size={15} color={iconColor} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={ar.title}>{title}</Text>
        <Text style={ar.time}>{time}</Text>
      </View>
    </View>
  );
}

const ar = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  iconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  time: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
});

// ── HeroCard: BUỔI TỚI GẦN NHẤT ───────────────────────────────

function HeroCard({ klass, delta, dayN, studentNames, onPress }: any) {
  const start = klass.schedule?.start_time || '';
  const dur = klass.schedule?.duration || 0;
  const end = start && dur ? addMinutes(start, dur) : '';
  const loc = klass.schedule?.location || '';

  const timeLine = [
    start ? (end ? `${start} – ${end}` : start) : '',
    loc,
  ].filter(Boolean).join(' · ');

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <View style={hc.card}>
        {/* gradient nền + decorative blobs */}
        <LinearGradient colors={classColor(klass?.color).grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={hc.blob1} />
        <View style={hc.blob2} />

        {/* label row */}
        <View style={hc.labelRow}>
          <View style={hc.dot} />
          <Text style={hc.label}>BUỔI TỚI GẦN NHẤT</Text>
        </View>

        {/* countdown */}
        <Text style={hc.countdown}>{countdownLabel(delta, dayN)}</Text>

        {/* title */}
        <Text style={hc.title}>{klass.name} · {klass.subject}</Text>

        {/* time + location */}
        {timeLine ? <Text style={hc.meta}>{timeLine}</Text> : null}

        {/* bottom: avatars + button */}
        <View style={hc.bottom}>
          {studentNames.length > 0 ? (
            <AvatarStack names={studentNames} maxVisible={4} ringColor="#3a8a61" />
          ) : (
            <Text style={hc.countText}>{klass.student_count || 0} học sinh</Text>
          )}
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={hc.btn} onPress={onPress} activeOpacity={0.85}>
            <Text style={hc.btnText}>Mở lớp →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const hc = StyleSheet.create({
  card: {
    backgroundColor: colors.green500, borderRadius: 26, padding: 22, overflow: 'hidden',
    position: 'relative', shadowColor: '#2f6849', shadowOpacity: 0.32, shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 }, elevation: 10,
  },
  blob1: { position: 'absolute', top: -50, right: -36, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.10)' },
  blob2: { position: 'absolute', bottom: -60, right: 30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.06)' },

  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#f2c94c' },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: 'rgba(255,255,255,0.9)' },

  countdown: { fontSize: 13, fontWeight: '700', letterSpacing: 0.4, color: '#ffe6a3', marginBottom: 6 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.4, color: 'white' },
  meta: { fontSize: 14, color: 'rgba(255,255,255,0.88)', marginTop: 4 },

  bottom: { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  countText: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  btn: { backgroundColor: 'white', paddingHorizontal: 18, paddingVertical: 11, borderRadius: 14, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  btnText: { fontSize: 14, fontWeight: '800', color: colors.green700 },
});

// ── ClassesScreen (HomeB) ─────────────────────────────────────

export function ClassesScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { teacher } = useAuthStore();
  const isDemo = isDemoToken(useAuthStore(st => st.token));
  const { classes, students, isLoading, fetchClasses, fetchStudents } = useClassesStore();

  // tuition data: { classId → { paid: number, total: number } }
  const [tuitionMap, setTuitionMap] = useState<Record<string, { paid: number; total: number }>>({});
  const month = new Date().toISOString().slice(0, 7);

  useEffect(() => { fetchClasses(); }, []);

  // fetch student list + tuition for each class
  useEffect(() => {
    classes.forEach(c => {
      fetchStudents(c.id);
      getTuition(c.id, month)
        .then((data: any[]) => {
          const paid = data.filter(d => d.paid).length;
          setTuitionMap(prev => ({ ...prev, [c.id]: { paid, total: data.length } }));
        })
        .catch(() => {});
    });
  }, [classes.length]);

  // Sắp xếp: lớp có buổi gần nhất sắp tới lên trước (xét mọi ngày trong tuần).
  const sorted = [...classes].sort((a, b) => {
    const da = nextOccurrence(a.schedule)?.delta ?? 99;
    const db = nextOccurrence(b.schedule)?.delta ?? 99;
    return da - db;
  });

  // ── next upcoming class (buổi gần nhất sắp tới trong tất cả các ngày, vòng tuần) ──
  const heroPick = classes
    .map(c => ({ c, occ: nextOccurrence(c.schedule) }))
    .filter((x): x is { c: any; occ: { date: Date; dayN: number; delta: number } } => !!x.occ)
    .sort((a, b) =>
      a.occ.delta - b.occ.delta ||
      (a.c.schedule?.start_time || '99:99').localeCompare(b.c.schedule?.start_time || '99:99'),
    )[0] || null;
  const heroClass: any = heroPick?.c || null;
  const heroOcc = heroPick?.occ || null;

  const todayCount = classes.filter(c => hasClassOnDayN(c.schedule, todayDayN())).length;
  const totalStudents = classes.reduce((t, c) => t + (c.student_count || 0), 0);
  // unpaid across all classes
  const unpaidCount = Object.values(tuitionMap).reduce((t, d) => t + (d.total - d.paid), 0);

  const d = new Date();
  const dateStr = `THỨ ${d.getDay() === 0 ? 'CN' : d.getDay() + 1} · ${d.getDate()}/${d.getMonth() + 1}`;

  return (
    <View style={s.container}>
      {/* ── Header ── */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerSub}>{dateStr}</Text>
          <Text style={s.headerTitle}>Lớp của {teacher?.gender === 'thay' ? 'thầy' : 'cô'}{teacher?.name ? ` ${teacher.name.trim().split(/\s+/).pop()}` : ''}</Text>
        </View>
        {teacher?.name ? <Avatar name={teacher.name} size={42} /> : null}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchClasses} tintColor={colors.green500} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero: buổi tới gần nhất ── */}
        {heroClass && heroOcc && (
          <HeroCard
            klass={heroClass}
            delta={heroOcc.delta}
            dayN={heroOcc.dayN}
            studentNames={(students[heroClass.id] || []).map(st => st.name)}
            onPress={() => navigation.navigate('ClassDetail', { classId: heroClass.id, className: heroClass.name })}
          />
        )}

        {/* ── Quick stats strip ── */}
        {classes.length > 0 && (
          <View style={s.statStrip}>
            <View style={[s.statPill, { backgroundColor: colors.green50 }]}>
              <Text style={[s.statPillLabel, { color: colors.green600 }]}>HÔM NAY</Text>
              <Text style={[s.statPillVal, { color: '#1a3d2a' }]}>{todayCount} buổi</Text>
            </View>
            <View style={[s.statPill, { backgroundColor: '#fff4f0' }]}>
              <Text style={[s.statPillLabel, { color: colors.coral700 }]}>CHƯA NỘP</Text>
              <Text style={[s.statPillVal, { color: colors.coral700 }]}>{unpaidCount} học sinh</Text>
            </View>
            {isDemo && (
              <View style={[s.statPill, { backgroundColor: '#fff4f0' }]}>
                <Text style={[s.statPillLabel, { color: colors.coral700 }]}>NGHỈ NHIỀU</Text>
                <Text style={[s.statPillVal, { color: colors.coral700 }]}>3 học sinh</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Class cards ── */}
        {sorted.map((klass, i) => {
          const studentList = students[klass.id] || [];
          const studentNames = studentList.map(s => s.name);
          const tui = tuitionMap[klass.id];
          return (
            <ClassCardLarge
              key={klass.id}
              klass={klass}
              highlighted={i === 0 && hasClassOnDayN(klass.schedule, todayDayN())}
              studentNames={studentNames}
              paidCount={tui?.paid ?? 0}
              totalCount={tui?.total ?? 0}
              onPress={() => navigation.navigate('ClassDetail', { classId: klass.id, className: klass.name })}
            />
          );
        })}

        {/* ── Empty ── */}
        {classes.length === 0 && !isLoading && (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📚</Text>
            <Text style={s.emptyTitle}>Chưa có lớp nào</Text>
            <Text style={s.emptyText}>Tạo lớp đầu tiên để bắt đầu</Text>
          </View>
        )}

        {/* ── Add class dashed ── */}
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => navigation.navigate('CreateClass')}
          activeOpacity={0.8}
        >
          <IconPlus size={18} color={colors.textSecondary} />
          <Text style={s.addBtnText}>Thêm lớp mới</Text>
        </TouchableOpacity>

        {/* ── Recent activity (demo only — chưa có nguồn hoạt động thật) ── */}
        {classes.length > 0 && isDemo && (
          <>
            <Text style={s.sectionTitle}>Hoạt động gần đây</Text>
            <View style={s.activityCard}>
              <ActivityRow Icon={IconChevron} iconBg={colors.green100} iconColor={colors.green500} title="Hoàng Tuấn Kiệt đã nộp tiền" time="2 giờ trước" />
              <ActivityRow Icon={IconChevron} iconBg="#fef5e1" iconColor={colors.honey700} title="Gửi Zalo nhắc 3 phụ huynh" time="Hôm qua, 21:14" />
              <ActivityRow Icon={IconChevron} iconBg="#fff4f0" iconColor={colors.coral700} title="Bùi Nam Sơn vắng buổi 18/05" time="2 ngày trước" last />
            </View>
          </>
        )}

        {!isDemo && (
          <TouchableOpacity style={s.archivedLink} onPress={() => navigation.navigate('ArchivedClasses')} activeOpacity={0.7}>
            <Text style={s.archivedLinkText}>📦 Lớp đã lưu trữ</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 12 },
  headerSub: { fontSize: 12, color: colors.textSecondary, fontWeight: '600', letterSpacing: 0.4, marginBottom: 2 },
  headerTitle: { fontSize: 26, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.5 },

  list: { paddingHorizontal: 20, gap: 14, paddingBottom: 20 },

  statStrip: { flexDirection: 'row', gap: 8 },
  statPill: { flex: 1, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12 },
  statPillLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3, marginBottom: 3 },
  statPillVal: { fontSize: 17, fontWeight: '700' },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  emptyText: { fontSize: 14, color: colors.textSecondary },

  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 18, borderRadius: 22, borderWidth: 1.5, borderColor: '#c8c4bc', borderStyle: 'dashed' },
  addBtnText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  archivedLink: { alignItems: 'center', paddingVertical: 14, marginTop: 4 },
  archivedLinkText: { fontSize: 13.5, fontWeight: '600', color: colors.textSecondary },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginTop: 8, marginBottom: 4 },
  activityCard: { backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
});
