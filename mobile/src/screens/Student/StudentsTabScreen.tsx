import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert, Linking, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme';
import { Avatar } from '../../components/ui/Avatar';
import { IconWarn, IconZalo, IconPhone, IconCheck, IconX, IconWallet, IconChevron } from '../../components/icons';
import { ZaloCopySheet } from '../../components/ui/ZaloCopySheet';
import { EmptyState } from '../../components/ui/EmptyState';
import { useClassesStore } from '../../store/classes';
import { listSessions } from '../../api/attendance';
import { useAuthStore, isDemoToken } from '../../store/auth';

// ── Demo data ─────────────────────────────────────────────────

type DemoStu = {
  id: string; name: string; attend: number;
  status: 'ok' | 'risk' | 'star'; debt: number; parent_phone: string | null;
};
type DemoClsGroup = { id: string; name: string; subject: string; students: DemoStu[] };

const DEMO_GROUPS: DemoClsGroup[] = [
  {
    id: 'demo-c1', name: 'Lớp 9', subject: 'Toán',
    students: [
      { id: 's1', name: 'Nguyễn Minh Anh', attend: 100, status: 'ok', debt: 0, parent_phone: '091 234 5678' },
      { id: 's2', name: 'Trần Bảo Long', attend: 75, status: 'risk', debt: 500000, parent_phone: '098 111 2222' },
      { id: 's3', name: 'Lê Hoàng Phúc', attend: 100, status: 'ok', debt: 0, parent_phone: '093 333 4444' },
      { id: 's4', name: 'Phạm Quỳnh Như', attend: 88, status: 'ok', debt: 500000, parent_phone: null },
      { id: 's5', name: 'Đỗ Minh Khôi', attend: 100, status: 'star', debt: 0, parent_phone: '097 555 6666' },
      { id: 's6', name: 'Vũ Hà My', attend: 88, status: 'ok', debt: 0, parent_phone: '096 777 8888' },
      { id: 's7', name: 'Bùi Nam Sơn', attend: 63, status: 'risk', debt: 500000, parent_phone: '091 999 0000' },
    ],
  },
  {
    id: 'demo-c2', name: 'Lớp 10', subject: 'Toán',
    students: [
      { id: 's8', name: 'Hoàng Tuấn Kiệt', attend: 90, status: 'ok', debt: 0, parent_phone: '091 000 1111' },
      { id: 's9', name: 'Mai Khánh Linh', attend: 100, status: 'star', debt: 0, parent_phone: '098 222 3333' },
      { id: 's10', name: 'Trương Gia Hân', attend: 80, status: 'ok', debt: 600000, parent_phone: null },
      { id: 's11', name: 'Đặng Hữu Thắng', attend: 90, status: 'ok', debt: 0, parent_phone: '093 444 5555' },
      { id: 's12', name: 'Lý Bích Ngọc', attend: 70, status: 'risk', debt: 600000, parent_phone: '097 666 7777' },
      { id: 's13', name: 'Phan Tấn Phát', attend: 100, status: 'ok', debt: 0, parent_phone: '096 888 9999' },
      { id: 's14', name: 'Ngô Thuỳ Dương', attend: 90, status: 'ok', debt: 0, parent_phone: '091 111 2222' },
      { id: 's15', name: 'Cao Việt Hưng', attend: 60, status: 'risk', debt: 600000, parent_phone: null },
      { id: 's16', name: 'Trịnh Yến Nhi', attend: 100, status: 'ok', debt: 0, parent_phone: '098 333 4444' },
      { id: 's17', name: 'Hồ Quang Duy', attend: 90, status: 'ok', debt: 0, parent_phone: '093 555 6666' },
    ],
  },
];

const ALL_DEMO_STUS = DEMO_GROUPS.flatMap(g => g.students);
const STATUS_CFG = {
  star: { label: 'Xuất sắc ★', bg: colors.honey100, color: '#8a6d30' },
  risk: { label: 'Vắng nhiều', bg: colors.coral100, color: colors.coral700 },
  ok: { label: 'OK', bg: colors.green100, color: colors.green700 },
};

// ── Demo student row ──────────────────────────────────────────
function DemoStuRow({ stu, onPress, last, isDemo }: { stu: DemoStu; onPress: () => void; last?: boolean; isDemo?: boolean }) {
  const cfg = STATUS_CFG[stu.status];
  return (
    <TouchableOpacity
      style={[sr.row, !last && sr.divider]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={sr.avatarWrap}>
        <Avatar name={stu.name} size={42} />
        {isDemo && stu.status === 'risk' && (
          <View style={sr.riskDot}><IconWarn size={9} color="white" /></View>
        )}
      </View>
      <View style={sr.info}>
        <Text style={sr.name} numberOfLines={1}>{stu.name}</Text>
        <Text style={sr.sub} numberOfLines={1}>
          {isDemo
            ? `${stu.attend}% chuyên cần${stu.debt > 0 ? ` · Nợ ${(stu.debt / 1000).toFixed(0)}k` : ''}`
            : (stu.parent_phone ? `PH: ${stu.parent_phone}` : 'Chưa có dữ liệu')}
        </Text>
      </View>
      {isDemo && (
        <View style={[sr.badge, { backgroundColor: cfg.bg }]}>
          <Text style={[sr.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const sr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, gap: 12 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  riskDot: {
    position: 'absolute', bottom: -2, right: -2,
    width: 16, height: 16, borderRadius: 8, backgroundColor: colors.coral500,
    borderWidth: 2, borderColor: colors.bg, alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  sub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, flexShrink: 0 },
  badgeText: { fontSize: 11, fontWeight: '600' },
});

// ── Profile tabs (DEMO_ATTEND / DEMO_MONEY) ───────────────────
const DEMO_ATTEND = [
  { d: '18/05', ok: false, note: 'Bận thi' },
  { d: '11/05', ok: true },
  { d: '04/05', ok: false, note: 'Ốm' },
  { d: '27/04', ok: true },
  { d: '20/04', ok: true },
];
const DEMO_MONEY = [
  { m: 'Tháng 5/2026', amt: 500000, paid: false, date: null },
  { m: 'Tháng 4/2026', amt: 500000, paid: true, date: '05/04' },
  { m: 'Tháng 3/2026', amt: 500000, paid: true, date: '02/03' },
];
const VND = (n: number) => n.toLocaleString('vi-VN') + 'đ';

function StudentProfile({ student, clsName, isDemo, onClose, sessions }: any) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'overview' | 'attend' | 'money'>('overview');
  const [showZalo, setShowZalo] = useState(false);
  const teacher = useAuthStore(s => s.teacher);
  const gw = teacher?.gender === 'thay' ? 'thầy' : 'cô';
  const isRisk = isDemo && student.status === 'risk';

  // Điểm danh thật của em này (từ các buổi đã điểm danh của lớp).
  const realHistory = (!isDemo && sessions ? sessions : [])
    .map((s: any) => {
      const r = s.records?.find((x: any) => x.student_id === student.id);
      return r ? { date: s.session_date as string, present: !!r.present, reason: r.absence_reason as string | null } : null;
    })
    .filter(Boolean)
    .sort((a: any, b: any) => (a.date < b.date ? 1 : -1)) as { date: string; present: boolean; reason: string | null }[];
  const rPresent = realHistory.filter(h => h.present).length;
  const rAbsent = realHistory.length - rPresent;
  const hasReal = realHistory.length > 0;
  const fmtDate = (s: string) => { const p = s.split('-'); return `${p[2]}/${p[1]}`; };

  return (
    <View style={pp.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[pp.backRow, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={pp.backBtn} onPress={onClose}>
            <View style={{ transform: [{ rotate: '180deg' }] }}><IconChevron size={18} color={colors.textPrimary} /></View>
          </TouchableOpacity>
        </View>

        <View style={pp.head}>
          <View>
            <Avatar name={student.name} size={80} />
            {isRisk && (
              <View style={pp.riskBadge}><IconWarn size={12} color="white" /></View>
            )}
          </View>
          <Text style={pp.name}>{student.name}</Text>
          <Text style={pp.sub}>{isDemo ? `${clsName || 'Lớp học'} · Tham gia từ 03/2026` : (clsName || 'Lớp học')}</Text>

          {isDemo ? (
            <View style={pp.statsRow}>
              <MiniStat label="Đã học" value="6" sub="buổi" />
              <MiniStat label="Vắng" value="2" sub="buổi" warn />
              <MiniStat label="Còn nợ" value={student.debt > 0 ? VND(student.debt) : '0đ'} warn={student.debt > 0} />
            </View>
          ) : (
            <View style={pp.statsRow}>
              <MiniStat label="Đã học" value={hasReal ? String(rPresent) : '–'} sub="buổi" />
              <MiniStat label="Vắng" value={hasReal ? String(rAbsent) : '–'} sub="buổi" warn={rAbsent > 0} />
              <MiniStat label="Còn nợ" value="–" />
            </View>
          )}

          <View style={pp.actionRow}>
            <TouchableOpacity
              style={pp.btnPrimary}
              onPress={() => setShowZalo(true)}
            >
              <IconZalo size={16} color="white" />
              <Text style={pp.btnPrimaryText}>Nhắn Zalo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={pp.btnSecondary}
              onPress={() => {
                const phone = student.parent_phone;
                if (phone) {
                  Linking.openURL(`tel:${phone.replace(/\s/g, '')}`).catch(() =>
                    Alert.alert('Không thể gọi', phone)
                  );
                } else {
                  Alert.alert('Chưa có SĐT', 'Phụ huynh học sinh này chưa có số điện thoại.');
                }
              }}
            >
              <IconPhone size={16} color={colors.textPrimary} />
              <Text style={pp.btnSecondaryText}>Gọi</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={pp.tabBar}>
          {[{ id: 'overview', label: 'Tổng quan' }, { id: 'attend', label: 'Điểm danh' }, { id: 'money', label: 'Học phí' }].map(t => (
            <TouchableOpacity key={t.id} style={[pp.tab, tab === t.id && pp.tabActive]} onPress={() => setTab(t.id as any)}>
              <Text style={[pp.tabText, tab === t.id && pp.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'overview' && (
          <View style={pp.content}>
            {isRisk && (
              <View style={pp.riskCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <IconWarn size={18} color={colors.coral700} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.coral700 }}>Có dấu hiệu bỏ học</Text>
                </View>
                <Text style={{ fontSize: 13, color: colors.textPrimary, lineHeight: 20 }}>
                  Đã vắng 2 buổi trong 3 buổi gần nhất, chưa nộp tiền tháng 5.
                </Text>
              </View>
            )}
            <Text style={pp.sectionLabel}>PHỤ HUYNH</Text>
            {isDemo ? (
              <View style={pp.infoCard}>
                <View style={[pp.infoRow, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                  <View style={pp.infoIconBox}><IconPhone size={15} color={colors.textSecondary} /></View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={pp.infoLabel}>Mẹ – Chị Hà</Text>
                    <Text style={pp.infoValue}>{student.parent_phone || '091 234 5678'}</Text>
                  </View>
                </View>
                <View style={pp.infoRow}>
                  <View style={pp.infoIconBox}><IconZalo size={15} color={colors.green600} /></View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={pp.infoLabel}>Zalo đã kết nối</Text>
                    <Text style={pp.infoValue}>Đã đọc tin gần nhất 2h trước</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={pp.infoCard}>
                <View style={pp.infoRow}>
                  <View style={pp.infoIconBox}><IconPhone size={15} color={colors.textSecondary} /></View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={pp.infoLabel}>SĐT phụ huynh</Text>
                    <Text style={pp.infoValue}>{student.parent_phone || 'Chưa có'}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {tab === 'attend' && (
          <View style={pp.content}>
            {!isDemo ? (
              hasReal ? realHistory.map((r, i) => (
                <View key={i} style={[pp.histRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                  <View style={[pp.histIcon, r.present ? { backgroundColor: colors.green100 } : { backgroundColor: colors.coral100 }]}>
                    {r.present ? <IconCheck size={16} color={colors.green700} /> : <IconX size={16} color={colors.coral700} />}
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>Buổi {fmtDate(r.date)}</Text>
                    {r.reason ? <Text style={{ fontSize: 12, color: colors.textSecondary }}>{r.reason}</Text> : null}
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: r.present ? colors.green700 : colors.coral700 }}>
                    {r.present ? 'Có mặt' : 'Vắng'}
                  </Text>
                </View>
              )) : (
                <View style={pp.emptyTab}>
                  <Text style={pp.emptyTabTitle}>Chưa có dữ liệu điểm danh</Text>
                  <Text style={pp.emptyTabSub}>Điểm danh các buổi học để xem lịch sử ở đây.</Text>
                </View>
              )
            ) : DEMO_ATTEND.map((r, i) => (
              <View key={i} style={[pp.histRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <View style={[pp.histIcon, r.ok ? { backgroundColor: colors.green100 } : { backgroundColor: colors.coral100 }]}>
                  {r.ok ? <IconCheck size={16} color={colors.green700} /> : <IconX size={16} color={colors.coral700} />}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>Buổi {r.d}/2026</Text>
                  {r.note && <Text style={{ fontSize: 12, color: colors.textSecondary }}>{r.note}</Text>}
                </View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: r.ok ? colors.green700 : colors.coral700 }}>
                  {r.ok ? 'Có mặt' : 'Vắng'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {tab === 'money' && (
          <View style={pp.content}>
            {!isDemo ? (
              <View style={pp.emptyTab}>
                <Text style={pp.emptyTabTitle}>Chưa có dữ liệu học phí</Text>
                <Text style={pp.emptyTabSub}>Ghi nhận học phí để xem lịch sử ở đây.</Text>
              </View>
            ) : DEMO_MONEY.map((r, i) => (
              <View key={i} style={[pp.histRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <View style={[pp.histIcon, r.paid ? { backgroundColor: colors.green100 } : { backgroundColor: colors.coral100 }]}>
                  <IconWallet size={16} color={r.paid ? colors.green700 : colors.coral700} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>{r.m}</Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>{VND(r.amt)}{r.date ? ' · nộp ' + r.date : ''}</Text>
                </View>
                <View style={[pp.chip, r.paid ? { backgroundColor: colors.green100 } : { backgroundColor: colors.coral100 }]}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: r.paid ? colors.green700 : colors.coral700 }}>
                    {r.paid ? 'Đã nộp' : 'Còn thiếu'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {showZalo && (
        <ZaloCopySheet
          title={`Nhắn Zalo · ${student.name}`}
          recipient={`Phụ huynh của ${student.name}`}
          message={`Chào anh/chị, ${gw} muốn hỏi thăm bé ${student.name.split(' ').slice(-1)[0]} ạ. Tuần này bé học như thế nào rồi? Anh/chị có điều gì muốn trao đổi thêm với ${gw} không ạ? 🌿`}
          hint={`phụ huynh của ${student.name}`}
          onConfirm={() => setShowZalo(false)}
          onClose={() => setShowZalo(false)}
        />
      )}
    </View>
  );
}

function MiniStat({ label, value, sub, warn }: any) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: '700', letterSpacing: -0.3, color: warn ? colors.coral700 : colors.textPrimary }}>{value}</Text>
      <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '600', marginTop: 2 }}>{label}{sub ? ' · ' + sub : ''}</Text>
    </View>
  );
}

const pp = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  backRow: { padding: 16, paddingTop: 52 },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    backgroundColor: 'white', alignItems: 'center', justifyContent: 'center',
  },
  head: { padding: 20, paddingTop: 4, alignItems: 'center' },
  name: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3, color: colors.textPrimary, marginTop: 12 },
  sub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  statsRow: { flexDirection: 'row', justifyContent: 'center', gap: 28, marginTop: 18 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 18, width: '100%' },
  btnPrimary: { flex: 1, height: 44, borderRadius: 12, backgroundColor: colors.green500, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  btnPrimaryText: { color: 'white', fontSize: 14, fontWeight: '600' },
  btnSecondary: { flex: 1, height: 44, borderRadius: 12, backgroundColor: colors.surfaceAlt, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  btnSecondaryText: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  riskBadge: { position: 'absolute', bottom: 0, right: -2, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.coral500, borderWidth: 3, borderColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 20 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.green500 },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: colors.green700 },
  content: { padding: 20 },
  riskCard: { backgroundColor: colors.coral50, borderWidth: 1, borderColor: colors.coral100, borderRadius: 16, padding: 14, marginBottom: 16 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.4, marginBottom: 8, marginTop: 8 },
  infoCard: { backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  infoIconBox: { width: 30, height: 30, borderRadius: 9, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: 12, color: colors.textSecondary },
  infoValue: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginTop: 1 },
  histRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  histIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  emptyTab: { alignItems: 'center', paddingVertical: 32 },
  emptyTabTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  emptyTabSub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
});

// ── Main screen ───────────────────────────────────────────────

type Filter = 'all' | 'unpaid' | 'risk' | string; // string = classId

export function StudentsTabScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { classes, students, fetchClasses, fetchStudents, addStudent } = useClassesStore();
  const isDemo = isDemoToken(useAuthStore(st => st.token));
  const [filter, setFilter] = useState<Filter>(route?.params?.filterClassId ?? 'all');
  const originClassId: string | undefined = route?.params?.filterClassId;
  const originClass = originClassId ? classes.find(c => c.id === originClassId) : undefined;
  const [profileStu, setProfileStu] = useState<any>(null);
  const [profileCls, setProfileCls] = useState<string>('');
  const [profileClsId, setProfileClsId] = useState<string>('');
  const [profileSessions, setProfileSessions] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [addClsId, setAddClsId] = useState('');
  const [name, setName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [loading, setLoading] = useState(!isDemo);

  useEffect(() => {
    if (isDemo) return;
    let alive = true;
    setLoading(true);
    Promise.resolve(fetchClasses()).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [isDemo]);
  useEffect(() => { classes.forEach(c => fetchStudents(c.id)); }, [classes.length]);

  // Khi mở hồ sơ 1 em → tải lịch sử điểm danh của lớp em đó để hiển thị.
  useEffect(() => {
    if (isDemo || !profileClsId) { setProfileSessions([]); return; }
    listSessions(profileClsId).then(setProfileSessions).catch(() => setProfileSessions([]));
  }, [profileClsId, isDemo]);

  const displayGroups: DemoClsGroup[] = isDemo
    ? DEMO_GROUPS
    : classes.map(c => ({
        id: c.id,
        name: c.name,
        subject: c.subject || '',
        students: (students[c.id] || []).map(s => ({
          id: s.id, name: s.name, attend: 0, status: 'ok' as const, debt: 0, parent_phone: s.parent_phone ?? null,
        })),
      }));

  const allStus = displayGroups.flatMap(g => g.students);
  const unpaidStus = allStus.filter(s => s.debt > 0);
  const riskStus = allStus.filter(s => s.status === 'risk');
  const totalCount = allStus.length;
  const unpaidCount = unpaidStus.length;
  const riskCount = riskStus.length;
  // Chuyên cần: demo tính trung bình thật; tài khoản thật chưa có dữ liệu → "–"
  const avgAttend = isDemo && allStus.length
    ? Math.round(allStus.reduce((sum, st) => sum + st.attend, 0) / allStus.length)
    : null;

  // Normalize filter — ignore unknown IDs (e.g. real UUID when in demo mode)
  const validFilterIds = new Set(['all', 'unpaid', 'risk', ...displayGroups.map(g => g.id)]);
  const effectiveFilter = validFilterIds.has(filter) ? filter : 'all';

  const filteredGroups = displayGroups.map(g => {
    let stus = g.students;
    if (effectiveFilter === 'unpaid') stus = stus.filter(s => s.debt > 0);
    else if (effectiveFilter === 'risk') stus = stus.filter(s => s.status === 'risk');
    else if (effectiveFilter !== 'all') stus = effectiveFilter === g.id ? g.students : [];
    return { ...g, students: stus };
  }).filter(g => g.students.length > 0 || !isDemo);

  const handleAdd = async () => {
    if (!name.trim() || !addClsId) return;
    try {
      await addStudent(addClsId, { name: name.trim(), parent_phone: parentPhone || null });
      setName(''); setParentPhone(''); setShowAdd(false);
    } catch { Alert.alert('Lỗi', 'Không thể thêm học sinh.'); }
  };

  if (profileStu) {
    return (
      <StudentProfile
        student={profileStu}
        clsName={profileCls}
        isDemo={isDemo}
        sessions={profileSessions}
        onClose={() => setProfileStu(null)}
      />
    );
  }

  // "Chưa nộp" / "Cần quan tâm" chỉ lọc được trên dữ liệu demo. Tài khoản thật
  // chưa có học phí / chuyên cần → ẩn 2 chip này, chỉ giữ "Tất cả" + lọc theo lớp.
  const filterChips = [
    { id: 'all', label: `Tất cả ${totalCount}` },
    ...(isDemo
      ? [
          { id: 'unpaid', label: `Chưa nộp ${unpaidCount}` },
          { id: 'risk', label: `Cần quan tâm ${riskCount}` },
        ]
      : []),
    ...displayGroups.map(g => ({ id: g.id, label: g.name })),
  ];

  if (loading) {
    return (
      <View style={[s.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.green500} size="large" />
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Học sinh</Text>
          <Text style={s.subtitle}>{totalCount} học sinh · {displayGroups.length} lớp</Text>
        </View>
      </View>

      {/* Breadcrumb — shown when navigated from ClassDetail */}
      {originClass && (
        <TouchableOpacity
          style={s.breadcrumb}
          onPress={() => navigation.navigate('ClassDetail', { classId: originClassId, className: originClass.name })}
        >
          <Text style={s.breadcrumbText}>‹ {originClass.name}</Text>
        </TouchableOpacity>
      )}

      {/* Stat band — dải thống kê màu.
          Tài khoản thật chưa có dữ liệu chuyên cần / "cần quan tâm" → chỉ hiện "Đang học". */}
      <View style={s.statBand}>
        <View style={[s.statPill, { backgroundColor: colors.green100 }]}>
          <Text style={[s.statValue, { color: colors.green700 }]}>{totalCount}</Text>
          <Text style={[s.statLabel, { color: colors.green700 }]}>Đang học</Text>
        </View>
        {isDemo && (
          <View style={[s.statPill, { backgroundColor: colors.coral100 }]}>
            <Text style={[s.statValue, { color: colors.coral700 }]}>{riskCount}</Text>
            <Text style={[s.statLabel, { color: colors.coral700 }]}>Cần quan tâm</Text>
          </View>
        )}
        {isDemo && (
          <View style={[s.statPill, { backgroundColor: colors.honey100 }]}>
            <Text style={[s.statValue, { color: '#8a6d30' }]}>
              {avgAttend !== null ? `${avgAttend}%` : '–'}
            </Text>
            <Text style={[s.statLabel, { color: '#8a6d30' }]}>Chuyên cần</Text>
          </View>
        )}
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={s.filterScroll}
        contentContainerStyle={s.filterRow}
      >
        {filterChips.map(chip => (
          <TouchableOpacity
            key={chip.id}
            style={[s.chip, effectiveFilter === chip.id && s.chipActive]}
            onPress={() => setFilter(chip.id)}
          >
            <Text style={[s.chipText, effectiveFilter === chip.id && s.chipTextActive]}>{chip.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Student list grouped by class */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
      >
        {filteredGroups.map(group => (
          <View key={group.id} style={{ marginBottom: 20 }}>
            {/* Class section header */}
            <View style={s.clsHeader}>
              <Text style={s.clsLabel}>{group.name.toUpperCase()} · {group.students.length} HỌC SINH</Text>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
                onPress={() => {
                  if (!isDemo && navigation) {
                    const cls = classes.find(c => c.id === group.id);
                    if (cls) navigation.navigate('ClassDetail', { classId: cls.id, className: cls.name });
                  }
                }}
              >
                <Text style={s.clsLink}>Xem lớp →</Text>
              </TouchableOpacity>
            </View>

            {/* Student rows */}
            <View style={s.card}>
              {group.students.map((stu, i) => (
                <DemoStuRow
                  key={stu.id}
                  stu={stu}
                  isDemo={isDemo}
                  last={i === group.students.length - 1}
                  onPress={() => { setProfileStu(stu); setProfileCls(group.name); setProfileClsId(group.id); }}
                />
              ))}
            </View>

            {/* Add student button — shown for real classes (not demo) */}
            {!isDemo && (
              <TouchableOpacity
                style={[s.addInlineBtn, group.students.length === 0 && s.addInlineBtnEmpty]}
                onPress={() => { setAddClsId(group.id); setShowAdd(true); }}
              >
                <Text style={s.addInlineBtnText}>
                  {group.students.length === 0 ? '+ Thêm học sinh đầu tiên' : `+ Thêm học sinh vào ${group.name}`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {filteredGroups.length === 0 && (
          effectiveFilter === 'all'
            ? <EmptyState
                icon="👥"
                title="Chưa có lớp để thêm học sinh"
                subtitle="Tạo lớp học đầu tiên, rồi thêm học sinh và phụ huynh vào lớp."
                ctaLabel="+ Tạo lớp học"
                onCta={() => navigation.navigate('CreateClass')}
              />
            : <EmptyState icon="🔍" title="Không có kết quả" subtitle="Thử chọn bộ lọc khác nhé." compact />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add student modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Thêm học sinh</Text>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <Text style={s.modalClose}>Huỷ</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={s.input} placeholder="Tên học sinh *"
            value={name} onChangeText={setName} autoFocus
          />
          <TextInput
            style={s.input} placeholder="SĐT phụ huynh"
            value={parentPhone} onChangeText={setParentPhone} keyboardType="phone-pad"
          />
          <TouchableOpacity
            style={[s.saveBtn, !name.trim() && { opacity: 0.5 }]}
            onPress={handleAdd} disabled={!name.trim()}
          >
            <Text style={s.saveBtnText}>Thêm học sinh</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 4, flexDirection: 'row', alignItems: 'flex-end' },
  title: { fontSize: 26, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  breadcrumb: { paddingHorizontal: 16, paddingVertical: 9, backgroundColor: colors.green50, borderBottomWidth: 1, borderBottomColor: colors.green100 },
  breadcrumbText: { fontSize: 13, fontWeight: '600', color: colors.green700 },
  statBand: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 2 },
  statPill: { flex: 1, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, fontWeight: '700', marginTop: 2, textAlign: 'center' },
  filterScroll: { flexGrow: 0, flexShrink: 0 },
  filterRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: 'center' },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: colors.surfaceAlt, alignSelf: 'center' },
  chipActive: { backgroundColor: '#1a1a1a' },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: 'white' },
  list: { paddingHorizontal: 16, paddingTop: 4 },
  clsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  clsLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.4 },
  clsLink: { fontSize: 12, fontWeight: '600', color: colors.green700 },
  card: { backgroundColor: 'white', borderRadius: 18, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  addInlineBtn: { marginTop: 8, paddingVertical: 10, alignItems: 'center' },
  addInlineBtnEmpty: {
    backgroundColor: colors.green50, borderRadius: 14,
    borderWidth: 1, borderColor: colors.green200 ?? '#aee6c5',
    paddingVertical: 14, marginTop: 4,
  },
  addInlineBtnText: { fontSize: 13, color: colors.green600, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  modal: { flex: 1, padding: 24, backgroundColor: colors.bg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  modalClose: { fontSize: 16, color: colors.green600, fontWeight: '600' },
  input: { backgroundColor: 'white', borderWidth: 1.5, borderColor: colors.border, borderRadius: 14, padding: 14, fontSize: 16, marginBottom: 12, color: colors.textPrimary },
  saveBtn: { backgroundColor: colors.green500, padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  stuRow: { flexDirection: 'row', alignItems: 'center', padding: 14, paddingHorizontal: 16 },
  stuDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  stuName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  stuSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});
