import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert, Linking,
} from 'react-native';
import { colors } from '../../theme';
import { Avatar } from '../../components/ui/Avatar';
import { ZaloCopySheet } from '../../components/ui/ZaloCopySheet';
import { IconWarn, IconZalo, IconPhone, IconCheck, IconX, IconWallet, IconChevron } from '../../components/icons';
import { useClassesStore } from '../../store/classes';

// ── Types & demo data ─────────────────────────────────────────

type StuItem = {
  id: string; name: string; attend: number;
  status: 'ok' | 'risk' | 'star'; debt: number; parent_phone: string | null;
};

const DEMO_STUS: StuItem[] = [
  { id: 's1', name: 'Nguyễn Minh Anh', attend: 100, status: 'ok',   debt: 0,      parent_phone: '091 234 5678' },
  { id: 's2', name: 'Trần Bảo Long',   attend: 75,  status: 'risk', debt: 500000, parent_phone: '098 111 2222' },
  { id: 's3', name: 'Lê Hoàng Phúc',  attend: 100, status: 'ok',   debt: 0,      parent_phone: '093 333 4444' },
  { id: 's4', name: 'Phạm Quỳnh Như', attend: 88,  status: 'ok',   debt: 500000, parent_phone: null },
  { id: 's5', name: 'Đỗ Minh Khôi',   attend: 100, status: 'star', debt: 0,      parent_phone: '097 555 6666' },
  { id: 's6', name: 'Vũ Hà My',       attend: 88,  status: 'ok',   debt: 0,      parent_phone: '096 777 8888' },
  { id: 's7', name: 'Bùi Nam Sơn',    attend: 63,  status: 'risk', debt: 500000, parent_phone: '091 999 0000' },
];

const STATUS_CFG = {
  star: { label: 'Xuất sắc ★', bg: colors.honey100, color: '#8a6d30' },
  risk: { label: 'Vắng nhiều', bg: colors.coral100, color: colors.coral700 },
  ok:   { label: 'OK',          bg: colors.green100, color: colors.green700 },
};

const DEMO_ATTEND = [
  { d: '18/05', ok: false, note: 'Bận thi' },
  { d: '11/05', ok: true },
  { d: '04/05', ok: false, note: 'Ốm' },
  { d: '27/04', ok: true },
  { d: '20/04', ok: true },
];
const DEMO_MONEY = [
  { m: 'Tháng 5/2026', amt: 500000, paid: false, date: null },
  { m: 'Tháng 4/2026', amt: 500000, paid: true,  date: '05/04' },
  { m: 'Tháng 3/2026', amt: 500000, paid: true,  date: '02/03' },
];
const VND = (n: number) => n.toLocaleString('vi-VN') + 'đ';

// ── Student row ───────────────────────────────────────────────

function StuRow({ stu, onPress, last }: { stu: StuItem; onPress: () => void; last?: boolean }) {
  const cfg = STATUS_CFG[stu.status];
  return (
    <TouchableOpacity style={[sr.row, !last && sr.divider]} onPress={onPress} activeOpacity={0.85}>
      <View style={sr.avatarWrap}>
        <Avatar name={stu.name} size={42} />
        {stu.status === 'risk' && (
          <View style={sr.riskDot}><IconWarn size={9} color="white" /></View>
        )}
      </View>
      <View style={sr.info}>
        <Text style={sr.name} numberOfLines={1}>{stu.name}</Text>
        <Text style={sr.sub} numberOfLines={1}>
          {stu.attend}% chuyên cần{stu.debt > 0 ? ` · Nợ ${(stu.debt / 1000).toFixed(0)}k` : ''}
        </Text>
      </View>
      <View style={[sr.badge, { backgroundColor: cfg.bg }]}>
        <Text style={[sr.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
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

// ── Inline student profile ────────────────────────────────────

function StudentProfile({ student, onClose }: { student: StuItem; onClose: () => void }) {
  const [tab, setTab] = useState<'overview' | 'attend' | 'money'>('overview');
  const [showZalo, setShowZalo] = useState(false);
  const isRisk = student.status === 'risk';
  const firstName = student.name.trim().split(/\s+/).pop() || student.name;

  return (
    <View style={pp.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={pp.backRow}>
          <TouchableOpacity style={pp.backBtn} onPress={onClose}>
            <View style={{ transform: [{ rotate: '180deg' }] }}><IconChevron size={18} color={colors.textPrimary} /></View>
          </TouchableOpacity>
        </View>

        <View style={pp.head}>
          <View>
            <Avatar name={student.name} size={80} />
            {isRisk && <View style={pp.riskBadge}><IconWarn size={12} color="white" /></View>}
          </View>
          <Text style={pp.name}>{student.name}</Text>
          <Text style={pp.sub}>Tham gia từ 03/2026</Text>

          <View style={pp.statsRow}>
            <MiniStat label="Đã học" value="6" sub="buổi" />
            <MiniStat label="Vắng" value="2" sub="buổi" warn />
            <MiniStat label="Còn nợ" value={student.debt > 0 ? VND(student.debt) : '0đ'} warn={student.debt > 0} />
          </View>

          <View style={pp.actionRow}>
            <TouchableOpacity style={pp.btnPrimary} onPress={() => setShowZalo(true)}>
              <IconZalo size={16} color="white" />
              <Text style={pp.btnPrimaryText}>Nhắn Zalo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={pp.btnSecondary}
              onPress={() => {
                if (student.parent_phone) {
                  Linking.openURL(`tel:${student.parent_phone.replace(/\s/g, '')}`).catch(() =>
                    Alert.alert('Không thể gọi', student.parent_phone!)
                  );
                } else {
                  Alert.alert('Chưa có SĐT', 'Phụ huynh chưa có số điện thoại.');
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
            <View style={pp.infoCard}>
              <View style={[pp.infoRow, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <View style={pp.infoIconBox}><IconPhone size={15} color={colors.textSecondary} /></View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={pp.infoLabel}>SĐT phụ huynh</Text>
                  <Text style={pp.infoValue}>{student.parent_phone || 'Chưa có'}</Text>
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
          </View>
        )}

        {tab === 'attend' && (
          <View style={pp.content}>
            {DEMO_ATTEND.map((r, i) => (
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
            {DEMO_MONEY.map((r, i) => (
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
          recipient={`Phụ huynh của ${firstName}`}
          message={`Chào anh/chị, cô muốn hỏi thăm bé ${firstName} ạ. Tuần này bé học như thế nào rồi? Anh/chị có điều gì muốn trao đổi thêm với cô không ạ? 🌿`}
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
  backRow: { padding: 16, paddingTop: 16 },
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
});

// ── Main screen ───────────────────────────────────────────────

export function ClassStudentsScreen({ route }: any) {
  const { classId, className } = route.params;
  const { classes, students, fetchStudents, addStudent } = useClassesStore();

  const classStudents = students[classId] || [];
  const isDemo = classes.length === 0;

  const displayStus: StuItem[] = isDemo
    ? DEMO_STUS
    : classStudents.map(s => ({
        id: s.id, name: s.name, attend: 88, status: 'ok' as const,
        debt: 0, parent_phone: s.parent_phone ?? null,
      }));

  const [profileStu, setProfileStu] = useState<StuItem | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('');

  useEffect(() => { fetchStudents(classId); }, [classId]);

  const handleAdd = async () => {
    if (!addName.trim()) return;
    try {
      await addStudent(classId, { name: addName.trim(), parent_phone: addPhone || null });
      setAddName(''); setAddPhone(''); setShowAdd(false);
    } catch {
      Alert.alert('Lỗi', 'Không thể thêm học sinh.');
    }
  };

  if (profileStu) {
    return <StudentProfile student={profileStu} onClose={() => setProfileStu(null)} />;
  }

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>

        {/* Summary bar */}
        <View style={s.summaryBar}>
          <Text style={s.summaryText}>{displayStus.length} học sinh</Text>
          {!isDemo && (
            <TouchableOpacity onPress={() => setShowAdd(true)}>
              <Text style={s.addLink}>+ Thêm học sinh</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Student list */}
        {displayStus.length > 0 ? (
          <View style={s.card}>
            {displayStus.map((stu, i) => (
              <StuRow
                key={stu.id}
                stu={stu}
                last={i === displayStus.length - 1}
                onPress={() => setProfileStu(stu)}
              />
            ))}
          </View>
        ) : (
          <TouchableOpacity style={s.emptyCard} onPress={() => setShowAdd(true)}>
            <Text style={s.emptyText}>+ Thêm học sinh đầu tiên vào lớp</Text>
          </TouchableOpacity>
        )}

        {!isDemo && displayStus.length > 0 && (
          <TouchableOpacity style={s.addInlineBtn} onPress={() => setShowAdd(true)}>
            <Text style={s.addInlineBtnText}>+ Thêm học sinh vào {className}</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add student modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Thêm học sinh</Text>
            <TouchableOpacity onPress={() => { setShowAdd(false); setAddName(''); setAddPhone(''); }}>
              <Text style={s.modalClose}>Huỷ</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={s.input} placeholder="Tên học sinh *"
            value={addName} onChangeText={setAddName} autoFocus
          />
          <TextInput
            style={s.input} placeholder="SĐT phụ huynh"
            value={addPhone} onChangeText={setAddPhone} keyboardType="phone-pad"
          />
          <TouchableOpacity
            style={[s.saveBtn, !addName.trim() && { opacity: 0.5 }]}
            onPress={handleAdd} disabled={!addName.trim()}
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
  list: { padding: 16, paddingTop: 8 },
  summaryBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  summaryText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  addLink: { fontSize: 14, fontWeight: '600', color: colors.green600 },
  card: { backgroundColor: 'white', borderRadius: 18, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  emptyCard: { backgroundColor: colors.green50, borderRadius: 14, borderWidth: 1, borderColor: colors.green200, paddingVertical: 20, alignItems: 'center' },
  emptyText: { fontSize: 14, fontWeight: '600', color: colors.green600 },
  addInlineBtn: { marginTop: 10, paddingVertical: 10, alignItems: 'center' },
  addInlineBtnText: { fontSize: 13, color: colors.green600, fontWeight: '600' },
  modal: { flex: 1, padding: 24, backgroundColor: colors.bg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  modalClose: { fontSize: 16, color: colors.green600, fontWeight: '600' },
  input: { backgroundColor: 'white', borderWidth: 1.5, borderColor: colors.border, borderRadius: 14, padding: 14, fontSize: 16, marginBottom: 12, color: colors.textPrimary },
  saveBtn: { backgroundColor: colors.green500, padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
