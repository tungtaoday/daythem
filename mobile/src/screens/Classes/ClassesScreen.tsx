import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { colors } from '../../theme';
import { Avatar } from '../../components/ui/Avatar';
import { useAuthStore } from '../../store/auth';
import { useClassesStore } from '../../store/classes';
import { IconPlus, IconChevron } from '../../components/icons';
import { getTuition } from '../../api/tuition';

const DAY_LABELS: Record<number, string> = {
  1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7', 7: 'CN',
};
const DAY_FULL: Record<number, string> = {
  1: 'Thứ 2', 2: 'Thứ 3', 3: 'Thứ 4', 4: 'Thứ 5', 5: 'Thứ 6', 6: 'Thứ 7', 7: 'Chủ nhật',
};
const DAY_N: Record<number, number> = { 0: 7, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 };

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
  const dayLabel = klass.schedule?.day ? DAY_FULL[klass.schedule.day] : '';
  const timeStr = klass.schedule?.start_time || '';
  const loc = klass.schedule?.location || '';
  const totalDue = totalCount - paidCount;
  const paidRatio = totalCount > 0 ? paidCount / totalCount : 0;

  const cardStyle: any[] = [cc.card];
  if (highlighted) {
    cardStyle.push(cc.cardHighlighted, {
      backgroundImage: 'linear-gradient(160deg, #4a9e72, #2f6849)',
      backgroundColor: '#4a9e72',
    } as any);
  }

  const labelColor = highlighted ? 'rgba(255,255,255,0.8)' : '#888';
  const titleColor = highlighted ? 'white' : '#1a1a1a';
  const metaColor = highlighted ? 'rgba(255,255,255,0.8)' : '#888';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88}>
      <View style={cardStyle}>
        {/* blobs */}
        {highlighted && (
          <>
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
            <Text style={[cc.title, { color: titleColor }]}>
              {klass.name} · {klass.subject}
            </Text>
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
              <Text style={[cc.progressLabel, { color: highlighted ? 'rgba(255,255,255,0.75)' : '#888' }]}>
                {totalDue > 0 ? `Còn ${totalDue} chưa nộp` : 'Đủ rồi 🎉'}
              </Text>
            </View>
            <View style={[cc.progressBg, { backgroundColor: highlighted ? 'rgba(255,255,255,0.2)' : '#eeece6' }]}>
              <View style={[cc.progressFill, {
                width: `${paidRatio * 100}%` as any,
                backgroundColor: highlighted ? 'white' : '#4a9e72',
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
              ringColor={highlighted ? '#3d8760' : 'white'}
            />
          ) : (
            <Text style={[cc.countText, { color: highlighted ? 'rgba(255,255,255,0.85)' : '#888' }]}>
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
  card: { backgroundColor: 'white', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#eeece6', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3, overflow: 'hidden', position: 'relative' },
  cardHighlighted: { borderWidth: 0, shadowColor: '#4a9e72', shadowOpacity: 0.25, shadowRadius: 20, elevation: 8 },
  blob1: { position: 'absolute', top: -40, right: -30, width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.08)' },
  blob2: { position: 'absolute', bottom: -50, right: -50, width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.06)' },

  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 8 },
  dayLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
  title: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  meta: { fontSize: 13, marginTop: 2 },

  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, alignSelf: 'flex-start', flexShrink: 0 },
  badgeHoney: { backgroundColor: 'rgba(255,255,255,0.9)' },
  badgeGray: { backgroundColor: '#eeece6' },
  badgeText: { fontSize: 12, fontWeight: '600' },
  badgeTextHoney: { color: '#7a5c00' },
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
  btnGreen: { backgroundColor: '#f0faf4' },
  btnText: { fontSize: 14, fontWeight: '600' },
  btnTextLight: { color: '#3d8760' },
  btnTextGreen: { color: '#3d8760' },
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
  divider: { borderBottomWidth: 1, borderBottomColor: '#f0ede6' },
  iconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  time: { fontSize: 12, color: '#888', marginTop: 1 },
});

// ── ClassesScreen (HomeB) ─────────────────────────────────────

export function ClassesScreen({ navigation }: any) {
  const { teacher } = useAuthStore();
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

  const todayN = DAY_N[new Date().getDay()];
  const sorted = [...classes].sort((a, b) => {
    const aToday = a.schedule?.day === todayN;
    const bToday = b.schedule?.day === todayN;
    return aToday === bToday ? 0 : aToday ? -1 : 1;
  });

  const todayCount = classes.filter(c => c.schedule?.day === todayN).length;
  const totalStudents = classes.reduce((t, c) => t + (c.student_count || 0), 0);
  // unpaid across all classes
  const unpaidCount = Object.values(tuitionMap).reduce((t, d) => t + (d.total - d.paid), 0);

  const d = new Date();
  const dateStr = `THỨ ${d.getDay() === 0 ? 'CN' : d.getDay() + 1} · ${d.getDate()}/${d.getMonth() + 1}`;

  return (
    <View style={s.container}>
      {/* ── Header ── */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerSub}>{dateStr}</Text>
          <Text style={s.headerTitle}>Lớp của cô</Text>
        </View>
        {teacher?.name ? <Avatar name={teacher.name} size={42} /> : null}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchClasses} tintColor="#4a9e72" />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Quick stats strip ── */}
        {classes.length > 0 && (
          <View style={s.statStrip}>
            <View style={[s.statPill, { backgroundColor: '#f0faf4' }]}>
              <Text style={[s.statPillLabel, { color: '#3d8760' }]}>HÔM NAY</Text>
              <Text style={[s.statPillVal, { color: '#1a3d2a' }]}>{todayCount} buổi</Text>
            </View>
            <View style={[s.statPill, { backgroundColor: '#fff4f0' }]}>
              <Text style={[s.statPillLabel, { color: '#b85a42' }]}>CHƯA NỘP</Text>
              <Text style={[s.statPillVal, { color: '#b85a42' }]}>{unpaidCount} hs</Text>
            </View>
            <View style={[s.statPill, { backgroundColor: '#fff4f0' }]}>
              <Text style={[s.statPillLabel, { color: colors.coral700 }]}>NGHỈ NHIỀU</Text>
              <Text style={[s.statPillVal, { color: colors.coral700 }]}>3 hs</Text>
            </View>
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
              highlighted={i === 0 && klass.schedule?.day === todayN}
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
          <IconPlus size={18} color="#888" />
          <Text style={s.addBtnText}>Thêm lớp mới</Text>
        </TouchableOpacity>

        {/* ── Recent activity ── */}
        {classes.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Hoạt động gần đây</Text>
            <View style={s.activityCard}>
              <ActivityRow Icon={IconChevron} iconBg="#d8f3e3" iconColor="#4a9e72" title="Hoàng Tuấn Kiệt đã nộp tiền" time="2 giờ trước" />
              <ActivityRow Icon={IconChevron} iconBg="#fef5e1" iconColor="#b07a20" title="Gửi Zalo nhắc 3 phụ huynh" time="Hôm qua, 21:14" />
              <ActivityRow Icon={IconChevron} iconBg="#fff4f0" iconColor="#b85a42" title="Bùi Nam Sơn vắng buổi 18/05" time="2 ngày trước" last />
            </View>
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf8f2' },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 12 },
  headerSub: { fontSize: 12, color: '#888', fontWeight: '600', letterSpacing: 0.4, marginBottom: 2 },
  headerTitle: { fontSize: 26, fontWeight: '700', color: '#1a1a1a', letterSpacing: -0.5 },

  list: { paddingHorizontal: 20, gap: 14, paddingBottom: 20 },

  statStrip: { flexDirection: 'row', gap: 8 },
  statPill: { flex: 1, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12 },
  statPillLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3, marginBottom: 3 },
  statPillVal: { fontSize: 17, fontWeight: '700' },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#888' },

  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 18, borderRadius: 22, borderWidth: 1.5, borderColor: '#c8c4bc', borderStyle: 'dashed' },
  addBtnText: { fontSize: 14, fontWeight: '600', color: '#888' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginTop: 8, marginBottom: 4 },
  activityCard: { backgroundColor: 'white', borderRadius: 18, borderWidth: 1, borderColor: '#eeece6', overflow: 'hidden' },
});
