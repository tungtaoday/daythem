import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../../theme';
import { Avatar } from '../../components/ui/Avatar';
import { ZaloCopySheet } from '../../components/ui/ZaloCopySheet';
import { SuccessScreen } from '../../components/ui/SuccessScreen';
import { IconCheck, IconX, IconNote, IconSparkle, IconZalo } from '../../components/icons';
import { useClassesStore } from '../../store/classes';
import { recordAttendance, listSessions } from '../../api/attendance';
import { useAuthStore, isDemoToken } from '../../store/auth';
import { getDays } from '../../utils/schedule';

// Hero progress ring — react-native-svg renders on iOS, Android and web.
function HeroRing({ present, total }: { present: number; total: number }) {
  const size = 156;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? present / total : 0;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth={stroke} />
        <Circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ffffff" strokeWidth={stroke}
          strokeDasharray={`${pct * circ} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={s.ringCenter}>
        <Text style={s.ringNumber}>{present}<Text style={s.ringTotal}>/{total}</Text></Text>
        <Text style={s.ringLabel}>có mặt</Text>
      </View>
    </View>
  );
}

const WEEKDAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
const WD_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parseYmd = (s: string) => { const [y, m, dd] = s.split('-').map(Number); return new Date(y, m - 1, dd); };

function formatDateLine(s: string): string {
  const d = parseYmd(s);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${WEEKDAYS[d.getDay()]} · ${dd}/${mm}/${d.getFullYear()}`;
}

// Các buổi gần nhất theo lịch lớp (lùi về quá khứ), gộp TẤT CẢ các thứ trong tuần.
// Không có lịch → vài ngày gần đây.
function recentSessionDates(schedule: any, count = 6): Date[] {
  const today = new Date();
  const days = getDays(schedule); // 1=T2..7=CN (đã sort, dedupe)
  if (!days.length) {
    const out: Date[] = [];
    for (let i = 0; i < count; i++) { const x = new Date(today); x.setDate(today.getDate() - i); out.push(x); }
    return out;
  }
  // Với mỗi thứ trong lịch, sinh `count` buổi gần nhất → gộp lại.
  const merged: Date[] = [];
  for (const day of days) {
    const targetJs = day % 7; // 1=Mon..6=Sat, 7(CN)→0
    const cur = new Date(today);
    while (cur.getDay() !== targetJs) cur.setDate(cur.getDate() - 1);
    for (let i = 0; i < count; i++) { merged.push(new Date(cur)); cur.setDate(cur.getDate() - 7); }
  }
  // Sort DESC (mới nhất trước), dedupe theo ngày, lấy `count` buổi gần nhất.
  merged.sort((a, b) => b.getTime() - a.getTime());
  const seen = new Set<string>();
  const out: Date[] = [];
  for (const d of merged) {
    const key = ymd(d);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(d);
    if (out.length >= count) break;
  }
  return out;
}

type Mark = 'present' | 'absent';

export function AttendanceScreen({ route, navigation }: any) {
  const { classId } = route.params;
  const insets = useSafeAreaInsets();
  const { students, fetchStudents, classes } = useClassesStore();
  const cls = classes.find((c: any) => c.id === classId);
  const className = route.params.className || cls?.name || 'Lớp';
  const subject = cls?.subject || '';
  const isDemo = isDemoToken(useAuthStore(st => st.token));
  const teacher = useAuthStore(st => st.teacher);
  const gw = teacher?.gender === 'thay' ? 'thầy' : 'cô';
  const classStudents = students[classId] || [];
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showZalo, setShowZalo] = useState(false);

  // ── Chọn buổi (cho điểm danh buổi quá khứ) ──
  const todayYmd = ymd(new Date());
  // Các buổi chọn được: vài buổi gần nhất theo lịch lớp + buổi truyền từ Lịch (nếu có).
  const sessionDates = useMemo(() => {
    const list = recentSessionDates(cls?.schedule, 6).map(ymd);
    const fromParam: string | undefined = route.params?.sessionDate;
    if (fromParam && !list.includes(fromParam)) list.unshift(fromParam);
    return list;
  }, [cls?.schedule, route.params?.sessionDate]);
  const [sessionDate, setSessionDate] = useState<string>(route.params?.sessionDate || sessionDates[0] || todayYmd);
  const [sessionsByDate, setSessionsByDate] = useState<Record<string, any>>({});
  const dateLine = formatDateLine(sessionDate);

  useEffect(() => { fetchStudents(classId); }, [classId]);

  // Tải các buổi đã điểm danh để (a) đánh dấu chip đã có, (b) nạp lại khi sửa.
  useEffect(() => {
    if (isDemo) return;
    listSessions(classId)
      .then((sessions: any[]) => {
        const map: Record<string, any> = {};
        sessions.forEach(s => { map[s.session_date] = s; });
        setSessionsByDate(map);
      })
      .catch(() => {});
  }, [classId, isDemo]);

  // Khi đổi buổi (hoặc dữ liệu sẵn sàng): nạp trạng thái buổi đó (nếu đã điểm danh) hoặc mặc định có mặt.
  useEffect(() => {
    if (classStudents.length === 0) return;
    const existing = sessionsByDate[sessionDate];
    if (existing) {
      const m: Record<string, Mark> = {};
      const n: Record<string, string> = {};
      classStudents.forEach(s => { m[s.id] = 'present'; });
      existing.records?.forEach((r: any) => {
        m[r.student_id] = r.present ? 'present' : 'absent';
        if (r.absence_reason) n[r.student_id] = r.absence_reason;
      });
      setMarks(m);
      setNotes(n);
    } else {
      setMarks(Object.fromEntries(classStudents.map(s => [s.id, 'present' as Mark])));
      setNotes({});
    }
  }, [classStudents, sessionDate, sessionsByDate]);

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
    // Demo sessions: keep optimistic success without touching the API
    if (isDemo) {
      setSubmitted(true);
      return;
    }
    try {
      const saved = await recordAttendance(classId, { session_date: sessionDate, records });
      setSessionsByDate(prev => ({ ...prev, [sessionDate]: saved }));
      setSubmitted(true);
    } catch {
      Alert.alert('Chưa lưu được', 'Không lưu được điểm danh. Kiểm tra mạng và thử lại.');
    }
  };

  if (submitted) {
    return (
      <>
      <SuccessScreen
        title="Đã điểm danh!"
        sub={`${presentCount}/${classStudents.length} có mặt. Đã tự động lưu vào lịch sử mỗi học sinh.`}
        secondaryLabel="Về trang chính"
        onSecondary={() => navigation.goBack()}
      >
        {absentCount > 0 && firstAbsent && (
          <View style={s.nudgeCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <IconSparkle size={16} color={colors.green600} />
              <Text style={{ fontSize: 14, fontWeight: '700' }}>Gợi ý</Text>
            </View>
            <Text style={s.nudgeText}>
              <Text style={{ fontWeight: '700' }}>{firstAbsent.name.split(' ').slice(-1)[0]}</Text>
              {' '}vắng buổi này. Muốn nhắn Zalo hỏi thăm phụ huynh?
            </Text>
            <TouchableOpacity style={s.zaloPrimary} onPress={() => setShowZalo(true)}>
              <IconZalo size={16} color="white" />
              <Text style={s.zaloPrimaryText}>Nhắn Zalo hỏi thăm</Text>
            </TouchableOpacity>
          </View>
        )}
      </SuccessScreen>

      {showZalo && firstAbsent && (
        <ZaloCopySheet
          title="Hỏi thăm học sinh vắng"
          recipient={`Phụ huynh của ${firstAbsent.name}`}
          message={`Chào anh/chị, ${gw} xin hỏi thăm bé ${firstAbsent.name.split(' ').slice(-1)[0]} buổi vừa rồi không thấy đến lớp ạ. Bé có khoẻ không ạ? Nếu bé bị ốm thì anh/chị nhớ cho bé nghỉ ngơi đầy đủ nhé. ${gw.charAt(0).toUpperCase() + gw.slice(1)} mong bé sớm khoẻ và gặp lại ở buổi sau 🌿`}
          hint={`phụ huynh của ${firstAbsent.name}`}
          onConfirm={() => setShowZalo(false)}
          onClose={() => setShowZalo(false)}
        />
      )}
      </>
    );
  }

  const total = classStudents.length;
  const allPresent = total > 0 && absentCount === 0;

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}>
        {/* Hero — counter ring */}
        <View style={[s.hero, { paddingTop: insets.top + 18 }]}>
          <LinearGradient
            colors={['#55b083', '#2f6849']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={s.heroEyebrow}>
            ĐIỂM DANH · {className.toUpperCase()}{subject ? ` · ${subject.toUpperCase()}` : ''}
          </Text>
          <Text style={s.heroDate}>{dateLine}</Text>

          <View style={s.ringWrap}>
            <HeroRing present={presentCount} total={total} />
          </View>

          <Text style={s.heroCaption}>
            {allPresent ? 'Cả lớp có mặt 🎉' : `${presentCount}/${total} có mặt`}
          </Text>
          <Text style={s.heroHint}>Chạm vào tên để đổi có mặt / vắng</Text>
        </View>

        {/* Chọn buổi — cho phép điểm danh / sửa buổi quá khứ */}
        <View style={s.dateChipsWrap}>
          <Text style={s.dateChipsLabel}>CHỌN BUỔI</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
            {sessionDates.map(d => {
              const dt = parseYmd(d);
              const active = d === sessionDate;
              const done = !!sessionsByDate[d];
              return (
                <TouchableOpacity key={d} style={[s.dateChip, active && s.dateChipActive]} onPress={() => setSessionDate(d)} activeOpacity={0.8}>
                  <Text style={[s.dateChipText, active && s.dateChipTextActive]}>
                    {d === todayYmd ? 'Hôm nay' : `${WD_SHORT[dt.getDay()]} ${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`}
                  </Text>
                  {done && <View style={[s.dateChipDot, active && { backgroundColor: 'white' }]} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {sessionsByDate[sessionDate] && (
            <Text style={s.dateChipsHint}>Buổi này đã điểm danh — chỉnh rồi lưu lại để cập nhật.</Text>
          )}
        </View>

        <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
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
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom + 12, 32) }]}>
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
  hero: {
    alignItems: 'center',
    backgroundColor: colors.green600,
    overflow: 'hidden',
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    paddingHorizontal: 24, paddingBottom: 24,
  },
  heroEyebrow: {
    fontSize: 12, fontWeight: '700', letterSpacing: 0.6,
    color: 'rgba(255,255,255,0.92)', textAlign: 'center',
  },
  heroDate: {
    fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.8)',
    marginTop: 4, textAlign: 'center',
  },
  ringWrap: { marginTop: 18, marginBottom: 6 },
  ringCenter: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  ringNumber: { fontSize: 44, fontWeight: '800', color: '#ffffff', letterSpacing: -1 },
  ringTotal: { fontSize: 24, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  ringLabel: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.85)', marginTop: -2 },
  heroCaption: {
    fontSize: 17, fontWeight: '700', color: '#ffffff',
    marginTop: 10, textAlign: 'center',
  },
  heroHint: {
    fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.8)',
    marginTop: 4, textAlign: 'center',
  },
  dateChipsWrap: { paddingLeft: 16, marginTop: 16 },
  dateChipsLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.4, color: colors.textSecondary, marginBottom: 8 },
  dateChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, backgroundColor: 'white' },
  dateChipActive: { borderColor: colors.green500, backgroundColor: colors.green500 },
  dateChipText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  dateChipTextActive: { color: 'white' },
  dateChipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green500 },
  dateChipsHint: { fontSize: 12, color: colors.textSecondary, marginTop: 8, paddingRight: 16 },
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
    padding: 16,
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
