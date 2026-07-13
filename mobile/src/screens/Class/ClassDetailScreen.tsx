import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography, radius } from '../../theme';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';
import { Hero } from '../../components/ui/Hero';
import { Button } from '../../components/ui/Button';
import { classColor } from '../../theme/classColors';
import { useClassesStore } from '../../store/classes';
import { useAuthStore, isDemoToken } from '../../store/auth';
import { getTuition } from '../../api/tuition';
import { listSessions } from '../../api/attendance';
import {
  IconCheck, IconWallet, IconBell, IconChart, IconUsers, IconSettings, IconClock, IconFlash,
} from '../../components/icons';
import { getDays, nextOccurrence, sessionTimeStr, daysLabel, DAY_FULL } from '../../utils/schedule';

// ── day / time / countdown helpers ───────────────────────────
function countdownWord(delta: number): string {
  if (delta === 0) return 'HÔM NAY';
  if (delta === 1) return 'NGÀY MAI';
  return `CÒN ${delta} NGÀY`;
}

type Tile = { Icon: any; label: string; kind: string; bg: string; fg: string };

const TILES: Tile[] = [
  { Icon: IconWallet,   label: 'Thu tiền',  kind: 'ClassTuition',  bg: colors.coral100,   fg: colors.coral700 },
  { Icon: IconBell,     label: 'Báo nghỉ',  kind: 'CancelClass',   bg: colors.coral50,    fg: colors.coral700 },
  { Icon: IconChart,    label: 'Báo cáo',   kind: 'ClassReport',   bg: colors.green50,    fg: colors.green700 },
  { Icon: IconClock,    label: 'Học bù',    kind: 'MakeupPoll',    bg: colors.honey100,   fg: colors.honey700 },
  { Icon: IconUsers,    label: 'Học sinh',  kind: 'ClassStudents', bg: colors.surfaceAlt, fg: colors.textSecondary },
  { Icon: IconSettings, label: 'Cài đặt',   kind: 'settings',      bg: colors.surfaceAlt, fg: colors.textSecondary },
];

export function ClassDetailScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { classId } = route.params;
  const { classes, students, fetchStudents, addStudent } = useClassesStore();
  const teacher = useAuthStore(st => st.teacher);
  const isDemo = isDemoToken(useAuthStore(st => st.token));
  const klass = classes.find(c => c.id === classId);
  const classStudents = students[classId] || [];
  const [loaded, setLoaded] = useState(false);
  const [tuition, setTuition] = useState<{ paid: number; total: number } | null>(null);
  const [attendedToday, setAttendedToday] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addParentName, setAddParentName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addNote, setAddNote] = useState('');

  const resetAddForm = () => { setAddName(''); setAddParentName(''); setAddPhone(''); setAddNote(''); };

  useEffect(() => {
    if (!loaded) { fetchStudents(classId); setLoaded(true); }
  }, [classId]);

  // Học phí tháng này (stat "Đã nộp") + đã điểm danh hôm nay chưa.
  // Nạp lại mỗi khi màn được focus (vd quay lại sau khi điểm danh) để cập nhật ngay.
  useFocusEffect(useCallback(() => {
    const month = new Date().toISOString().slice(0, 7);
    getTuition(classId, month)
      .then((data: any[]) => { if (Array.isArray(data)) setTuition({ paid: data.filter(d => d.paid).length, total: data.length }); })
      .catch(() => {});
    const d = new Date();
    const todayYmd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    listSessions(classId)
      .then((arr: any[]) => setAttendedToday(Array.isArray(arr) && arr.some(sx => sx.session_date === todayYmd)))
      .catch(() => {});
  }, [classId]));

  if (!klass) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
        {classes.length === 0 ? (
          <ActivityIndicator color={colors.green500} size="large" />
        ) : (
          <>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 }}>Không tìm thấy lớp</Text>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingHorizontal: 20, paddingVertical: 12, backgroundColor: colors.green500, borderRadius: 12 }}>
              <Text style={{ color: 'white', fontWeight: '700' }}>Quay lại</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  }

  const handleAdd = async () => {
    if (!addName.trim()) return;
    try {
      await addStudent(classId, {
        name: addName.trim(),
        parent_name: addParentName.trim() || null,
        parent_phone: addPhone.trim() || null,
        note: addNote.trim() || null,
      });
      resetAddForm(); setShowAdd(false);
    } catch {
      Alert.alert('Lỗi', 'Không thể thêm học sinh.');
    }
  };

  const navTo = (kind: string) => {
    if (kind === 'settings') {
      navigation.navigate('ClassSettings', { classId, className: klass.name });
    } else if (kind === 'MakeupPoll') {
      navigation.navigate('MakeupPoll', { className: klass.name });
    } else {
      navigation.navigate(kind, { classId, className: klass.name });
    }
  };

  // Sang màn Học sinh và mở thẳng "Nhập nhanh cả lớp" (ảnh/Excel/Word/PDF).
  const goBulk = () => navigation.navigate('ClassStudents', { classId, className: klass.name, openBulk: true });

  // ── countdown line: "THỨ 4 · 18:30 – 20:00 · CÒN 4 NGÀY" (buổi gần nhất) ──
  // Giờ + địa điểm lấy từ ĐÚNG buổi sắp tới (mỗi buổi có giờ/địa điểm riêng).
  const occ = nextOccurrence(klass.schedule);
  const timeStr = occ ? sessionTimeStr(occ.session) : '';
  const loc: string = occ?.session.location || '';
  const countdownLine = occ
    ? [
        DAY_FULL[occ.dayN].toUpperCase(),
        timeStr,
        countdownWord(occ.delta),
      ].filter(Boolean).join(' · ')
    : '';
  // Lớp học nhiều ngày/tuần → hiện tất cả các thứ ở dòng phụ của hero.
  const multiDays = getDays(klass.schedule).length > 1 ? daysLabel(klass.schedule) : '';
  const heroSub = [multiDays, loc].filter(Boolean).join(' · ') || undefined;

  const studentN = klass.student_count ?? classStudents.length ?? 0;
  const tchTitle = teacher?.gender === 'thay' ? 'thầy' : 'cô';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── HERO (design-system component) ── */}
      <Hero
        variant="green"
        grad={classColor(klass.color).grad}
        eyebrow={countdownLine || 'Chưa đặt lịch học'}
        title={`${klass.name} · ${klass.subject}`}
        sub={heroSub}
        right={
          <TouchableOpacity
            style={styles.gearBtn}
            onPress={() => navTo('settings')}
            activeOpacity={0.8}
            accessibilityLabel="Cài đặt lớp"
          >
            <IconSettings size={20} color="#fff" />
          </TouchableOpacity>
        }
        stats={[
          { value: String(studentN), label: 'Học sinh' },
          { value: isDemo ? '96%' : 'Chưa có', label: 'Chuyên cần' },
          { value: tuition ? `${tuition.paid}/${tuition.total}` : 'Chưa có', label: 'Đã nộp' },
        ]}
      />

      {/* ── PRIMARY action ── */}
      <Button
        label={attendedToday ? '✓ Đã điểm danh hôm nay — xem/sửa' : 'Điểm danh buổi hôm nay'}
        variant={attendedToday ? 'secondary' : 'primary'}
        onPress={() => navTo('Attendance')}
        icon={attendedToday ? undefined : <IconCheck size={22} color="#fff" />}
      />

      {/* ── secondary action tiles ── */}
      <View style={styles.grid}>
        {TILES.map(t => (
          <TouchableOpacity
            key={t.label}
            style={[styles.action, { backgroundColor: t.bg }]}
            onPress={() => navTo(t.kind)}
            activeOpacity={0.8}
          >
            <t.Icon size={26} color={t.fg} />
            <Text style={styles.actionLabel}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Student section — tappable rows + inline add */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Học sinh ({classStudents.length})</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity style={styles.bulkPill} onPress={goBulk} activeOpacity={0.85}>
            <IconFlash size={14} color="#fff" />
            <Text style={styles.bulkPillText}>Nhập nhanh</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowAdd(true)}>
            <Text style={styles.addLink}>+ Thêm</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Card>
        {classStudents.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Lớp của {tchTitle} chưa có học sinh</Text>
            <Text style={styles.emptySub}>Thêm cả lớp trong 10 giây</Text>
            <TouchableOpacity style={styles.emptyPrimary} onPress={goBulk} activeOpacity={0.85}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <IconFlash size={18} color="#fff" />
                <Text style={styles.emptyPrimaryText}>Nhập nhanh cả lớp</Text>
              </View>
              <Text style={styles.emptyPrimarySub}>Chụp ảnh · chọn file Excel / Word / PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowAdd(true)} style={{ marginTop: 12 }}>
              <Text style={styles.emptySecondary}>hoặc thêm từng em →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          classStudents.map((s, i) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.studentRow, i > 0 && styles.divider]}
              onPress={() => navigation.navigate('ClassStudents', { classId, className: klass.name, openStudentId: s.id })}
              activeOpacity={0.7}
            >
              <Avatar name={s.name} size={36} />
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{s.name}</Text>
                {s.parent_phone && <Text style={styles.studentPhone}>{s.parent_phone}</Text>}
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))
        )}
      </Card>

      {/* Add student modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAdd(false)}>
        <View style={[styles.modal, { paddingTop: Math.max(insets.top, 24) + 12 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Thêm học sinh</Text>
            <TouchableOpacity onPress={() => { setShowAdd(false); resetAddForm(); }}>
              <Text style={styles.modalClose}>Huỷ</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.fieldLabel}>Tên học sinh *</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Nguyễn Minh An"
            value={addName}
            onChangeText={setAddName}
            autoFocus
          />
          <Text style={styles.fieldLabel}>Tên phụ huynh</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Chị Hương (mẹ An)"
            value={addParentName}
            onChangeText={setAddParentName}
          />
          <Text style={styles.fieldLabel}>SĐT phụ huynh (Zalo)</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: 0901 234 567"
            value={addPhone}
            onChangeText={setAddPhone}
            keyboardType="phone-pad"
          />
          <Text style={styles.fieldLabel}>Ghi chú</Text>
          <TextInput
            style={[styles.input, { height: 72, textAlignVertical: 'top' }]}
            placeholder="VD: Học sinh cũ, cần kèm thêm Hình học..."
            value={addNote}
            onChangeText={setAddNote}
            multiline
          />
          <TouchableOpacity
            style={[styles.saveBtn, !addName.trim() && { opacity: 0.5 }]}
            onPress={handleAdd}
            disabled={!addName.trim()}
          >
            <Text style={styles.saveBtnText}>Thêm học sinh</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 40 },

  // gear button trong slot phải của Hero
  gearBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  action: { width: '31%', aspectRatio: 1, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  actionLabel: { ...typography.caption, fontWeight: '600', textAlign: 'center' },

  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { ...typography.h3 },
  addLink: { fontSize: 14, fontWeight: '600', color: colors.green600 },
  bulkPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.green500, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 7 },
  bulkPillText: { color: 'white', fontSize: 13, fontWeight: '700' },
  emptyBox: { paddingVertical: 20, paddingHorizontal: 16, alignItems: 'center' },
  emptyTitle: { fontSize: 15.5, fontWeight: '700', color: colors.textPrimary },
  emptySub: { fontSize: 13, color: colors.textSecondary, marginTop: 3, marginBottom: 16 },
  emptyPrimary: { backgroundColor: colors.green500, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center', alignSelf: 'stretch' },
  emptyPrimaryText: { color: 'white', fontSize: 15.5, fontWeight: '700' },
  emptyPrimarySub: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 3 },
  emptySecondary: { fontSize: 13.5, fontWeight: '600', color: colors.green700 },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.sm },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  studentInfo: { flex: 1 },
  studentName: { ...typography.bodyMedium },
  studentPhone: { ...typography.caption },
  chevron: { fontSize: 20, color: colors.textMuted },
  modal: { flex: 1, paddingHorizontal: 24, paddingBottom: 24, backgroundColor: colors.bg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  modalClose: { fontSize: 16, color: colors.green600, fontWeight: '600' },
  input: { backgroundColor: 'white', borderWidth: 1.5, borderColor: colors.border, borderRadius: 14, padding: 14, fontSize: 16, marginBottom: 12, color: colors.textPrimary },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 6, marginLeft: 2 },
  saveBtn: { backgroundColor: colors.green500, padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
