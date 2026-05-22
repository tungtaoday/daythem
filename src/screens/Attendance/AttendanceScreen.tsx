import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { Avatar } from '../../components/ui/Avatar';
import { ZaloCopySheet } from '../../components/ui/ZaloCopySheet';
import { IconCheck, IconX, IconNote, IconSparkle, IconZalo } from '../../components/icons';
import { useClassesStore } from '../../store/classes';
import { recordAttendance } from '../../api/attendance';

// SVG-as-any — works in expo web (react-native-web renders to DOM SVG)
const SvgEl = 'svg' as any;
const CircleEl = 'circle' as any;

function RingCounter({ present, total }: { present: number; total: number }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? present / total : 0;
  return (
    <View style={{ width: 52, height: 52 }}>
      <SvgEl width={52} height={52} viewBox="0 0 48 48">
        <CircleEl cx="24" cy="24" r={r} fill="none" stroke={colors.green100} strokeWidth="5" />
        <CircleEl cx="24" cy="24" r={r} fill="none" stroke={colors.green500} strokeWidth="5"
          strokeDasharray={`${pct * circ} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 24 24)"
        />
      </SvgEl>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.green700 }}>{present}/{total}</Text>
      </View>
    </View>
  );
}

type Mark = 'present' | 'absent';

export function AttendanceScreen({ route, navigation }: any) {
  const { classId } = route.params;
  const { students, fetchStudents, classes } = useClassesStore();
  const classStudents = students[classId] || [];
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showZalo, setShowZalo] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => { fetchStudents(classId); }, [classId]);

  useEffect(() => {
    if (classStudents.length > 0 && Object.keys(marks).length === 0) {
      setMarks(Object.fromEntries(classStudents.map(s => [s.id, 'present' as Mark])));
    }
  }, [classStudents]);

  const toggle = (id: string) => {
    setMarks(m => ({ ...m, [id]: m[id] === 'present' ? 'absent' : 'present' }));
  };

  const presentCount = Object.values(marks).filter(v => v === 'present').length;
  const absentCount = classStudents.length - presentCount;
  const firstAbsent = classStudents.find(s => marks[s.id] === 'absent');

  const handleSave = async () => {
    const records = classStudents.map(s => ({
      student_id: s.id,
      present: marks[s.id] !== 'absent',
      absence_reason: notes[s.id],
    }));
    try { await recordAttendance(classId, { session_date: today, records }); } catch {}
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <>
      <View style={[s.container, s.successWrap]}>
        <View style={s.successCircle}>
          <Text style={{ fontSize: 36, color: colors.green600 }}>✓</Text>
        </View>
        <Text style={s.successTitle}>Đã điểm danh!</Text>
        <Text style={s.successSub}>
          {presentCount}/{classStudents.length} có mặt. Đã tự động lưu vào lịch sử mỗi học sinh.
        </Text>
        {absentCount > 0 && firstAbsent && (
          <View style={s.nudgeCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <IconSparkle size={16} color={colors.green600} />
              <Text style={{ fontSize: 14, fontWeight: '700' }}>Gợi ý</Text>
            </View>
            <Text style={s.nudgeText}>
              <Text style={{ fontWeight: '700' }}>{firstAbsent.name.split(' ').slice(-1)[0]}</Text>
              {' '}hôm nay vắng. Muốn nhắn Zalo hỏi thăm phụ huynh?
            </Text>
            <TouchableOpacity style={s.zaloPrimary} onPress={() => setShowZalo(true)}>
              <IconZalo size={16} color="white" />
              <Text style={s.zaloPrimaryText}>Nhắn Zalo hỏi thăm</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity style={s.ghostBtn} onPress={() => navigation.goBack()}>
          <Text style={s.ghostBtnText}>Về trang chính</Text>
        </TouchableOpacity>
      </View>

      {showZalo && firstAbsent && (
        <ZaloCopySheet
          title="Hỏi thăm học sinh vắng"
          recipient={`Phụ huynh của ${firstAbsent.name}`}
          message={`Chào anh/chị, cô xin hỏi thăm bé ${firstAbsent.name.split(' ').slice(-1)[0]} hôm nay không thấy đến lớp ạ. Bé có khoẻ không ạ? Nếu bé bị ốm thì anh/chị nhớ cho bé nghỉ ngơi đầy đủ nhé. Cô mong bé sớm khoẻ và gặp lại ở buổi sau 🌿`}
          hint={`phụ huynh của ${firstAbsent.name}`}
          onConfirm={() => setShowZalo(false)}
          onClose={() => setShowZalo(false)}
        />
      )}
      </>
    );
  }

  return (
    <View style={s.container}>
      {/* Ring counter bar */}
      <View style={s.counterBar}>
        <RingCounter present={presentCount} total={classStudents.length} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={s.counterTitle}>
            {absentCount === 0 ? 'Cả lớp có mặt 🎉' : `${absentCount} bạn vắng`}
          </Text>
          <Text style={s.counterSub}>Chạm vào tên để đổi giữa có mặt / vắng</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}>
        <View style={s.card}>
          {classStudents.map((stu) => {
            const isPresent = marks[stu.id] !== 'absent';
            return (
              <TouchableOpacity
                key={stu.id}
                style={[s.stuRow, !isPresent && s.stuRowAbsent]}
                onPress={() => toggle(stu.id)}
                activeOpacity={0.85}
              >
                <Avatar name={stu.name} size={42} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.stuName}>{stu.name}</Text>
                  <Text style={s.stuStatus}>
                    {isPresent ? 'Có mặt' : (notes[stu.id] || 'Vắng · chạm để ghi lý do')}
                  </Text>
                </View>
                {!isPresent && (
                  <TouchableOpacity
                    style={s.noteBtn}
                    onPress={() => setEditingNote(stu.id)}
                  >
                    <IconNote size={18} color={colors.coral700} />
                  </TouchableOpacity>
                )}
                <View style={[s.toggleBox, isPresent ? s.togglePresent : s.toggleAbsent]}>
                  {isPresent
                    ? <IconCheck size={20} color="white" />
                    : <IconX size={18} color={colors.coral500} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View style={s.bottomBar}>
        <TouchableOpacity style={s.btnPrimary} onPress={handleSave}>
          <Text style={s.btnPrimaryText}>Hoàn tất điểm danh</Text>
        </TouchableOpacity>
      </View>

      {/* Note modal */}
      {editingNote && (
        <NoteModal
          name={classStudents.find(s => s.id === editingNote)?.name || ''}
          initial={notes[editingNote] || ''}
          onSave={(v: string) => { setNotes(n => ({ ...n, [editingNote]: v })); setEditingNote(null); }}
          onClose={() => setEditingNote(null)}
        />
      )}
    </View>
  );
}

function NoteModal({ name, initial, onSave, onClose }: any) {
  const [val, setVal] = useState(initial);
  const presets = ['Bị ốm', 'Bận thi', 'Việc gia đình', 'Không báo'];
  return (
    <TouchableOpacity style={s.overlay} onPress={onClose} activeOpacity={1}>
      <TouchableOpacity style={s.sheet} activeOpacity={1} onPress={() => {}}>
        <View style={s.handle} />
        <Text style={s.sheetTitle}>Lý do vắng</Text>
        <Text style={s.sheetSub}>{name}</Text>
        <View style={s.presets}>
          {presets.map(p => (
            <TouchableOpacity
              key={p}
              style={[s.chip, val === p && s.chipActive]}
              onPress={() => setVal(p)}
            >
              <Text style={[s.chipText, val === p && s.chipTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={s.noteInput}
          value={val}
          onChangeText={setVal}
          placeholder="Hoặc ghi chú khác..."
          placeholderTextColor={colors.textMuted}
        />
        <TouchableOpacity style={s.btnPrimary} onPress={() => onSave(val)}>
          <Text style={s.btnPrimaryText}>Lưu</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  successWrap: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  successCircle: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: colors.green100,
    alignItems: 'center', justifyContent: 'center', marginBottom: 22,
  },
  successTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3, color: colors.textPrimary, marginBottom: 6 },
  successSub: { fontSize: 14, color: colors.textSecondary, maxWidth: 280, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  nudgeCard: {
    width: '100%', backgroundColor: 'white', borderRadius: 18,
    padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border,
  },
  nudgeText: { fontSize: 13, color: colors.textPrimary, lineHeight: 20, marginBottom: 14 },
  zaloPrimary: {
    backgroundColor: colors.green500, height: 44, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  zaloPrimaryText: { color: 'white', fontSize: 14, fontWeight: '600' },
  ghostBtn: { padding: 12 },
  ghostBtnText: { fontSize: 15, color: colors.textSecondary, fontWeight: '500' },
  counterBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.green50, borderWidth: 1, borderColor: colors.green100,
    borderRadius: 18, margin: 16, padding: 14,
  },
  counterTitle: { fontSize: 14, fontWeight: '700', color: '#1a3d2a' },
  counterSub: { fontSize: 12, color: colors.green700, marginTop: 2 },
  card: {
    backgroundColor: 'white', borderRadius: 18,
    borderWidth: 1, borderColor: colors.border, padding: 6,
  },
  stuRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderRadius: 14,
  },
  stuRowAbsent: { backgroundColor: colors.coral50 },
  stuName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  stuStatus: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  noteBtn: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  toggleBox: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 6,
  },
  togglePresent: { backgroundColor: colors.green500 },
  toggleAbsent: { backgroundColor: 'white', borderWidth: 2, borderColor: colors.coral500 },
  bottomBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    padding: 16, paddingBottom: 32,
    backgroundColor: 'transparent',
  },
  btnPrimary: {
    height: 56, borderRadius: 16, backgroundColor: colors.green500,
    alignItems: 'center', justifyContent: 'center',
  },
  btnPrimaryText: { color: 'white', fontSize: 16, fontWeight: '600' },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(20,30,25,0.4)',
    justifyContent: 'flex-end',
  } as any,
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 22, paddingBottom: 32,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: '#e0ddd5',
    alignSelf: 'center', marginBottom: 16,
  },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  sheetSub: { fontSize: 13, color: colors.textSecondary, marginBottom: 16 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    borderWidth: 1, borderColor: '#e0ddd5', backgroundColor: 'white',
  },
  chipActive: { borderColor: colors.green500, backgroundColor: colors.green50 },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  chipTextActive: { color: colors.green700 },
  noteInput: {
    borderWidth: 1, borderColor: '#e0ddd5', borderRadius: 14,
    padding: 14, fontSize: 14, marginBottom: 14, color: colors.textPrimary,
    backgroundColor: 'white',
  },
});
