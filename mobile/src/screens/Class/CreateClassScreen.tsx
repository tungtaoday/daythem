import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Button } from '../../components/ui/Button';
import { colors, spacing, typography, radius } from '../../theme';
import { CLASS_COLORS, CLASS_COLOR_KEYS, ClassColorKey } from '../../theme/classColors';
import { DAY_SHORT } from '../../utils/schedule';
import { ClassFeeType, FEE_TYPES, FEE_UNIT, FEE_PRESETS_BY_TYPE } from '../../utils/feeTypes';
import { useClassesStore } from '../../store/classes';

const SUBJECTS = ['Toán', 'Văn', 'Anh', 'Lý', 'Hóa', 'Sinh', 'Sử', 'Địa'];
const GRADES = ['1','2','3','4','5','6','7','8','9','10','11','12'];
const DAYS = [
  { label: 'T2', value: 1 }, { label: 'T3', value: 2 }, { label: 'T4', value: 3 },
  { label: 'T5', value: 4 }, { label: 'T6', value: 5 }, { label: 'T7', value: 6 },
  { label: 'CN', value: 7 },
];
const TIME_PRESETS = ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'];
const feeLabel = (n: number) => (n >= 1000000 ? `${n / 1000000}tr` : `${n / 1000}k`);
const DURATIONS = [{ l: '60p', v: 60 }, { l: '1h30', v: 90 }, { l: '2h', v: 120 }, { l: '2h30', v: 150 }];
const PLACES = ['Tại nhà', 'Zoom', 'Quán cà phê', 'Khác'];

type Sess = { day: number; start_time: string; duration: number; location: string };

export function CreateClassScreen({ navigation }: any) {
  const [subject, setSubject] = useState('Toán');
  const [grade, setGrade] = useState('9');
  const [name, setName] = useState('');
  const [fee, setFee] = useState('800000');
  const [feeType, setFeeType] = useState<ClassFeeType>('month');
  const [days, setDays] = useState<number[]>([3]);
  const [time, setTime] = useState('18:30');
  const [duration, setDuration] = useState(90);
  const [place, setPlace] = useState('Tại nhà');
  const [perSession, setPerSession] = useState(false);
  const [sessions, setSessions] = useState<Sess[]>([]);
  const [color, setColor] = useState<ClassColorKey>('green');
  const { createClass } = useClassesStore();
  const [loading, setLoading] = useState(false);

  const toggleDay = (v: number) => {
    const has = days.includes(v);
    setDays(has ? days.filter(x => x !== v) : [...days, v].sort((a, b) => a - b));
    if (perSession) {
      setSessions(ss => has
        ? ss.filter(s => s.day !== v)
        : [...ss, { day: v, start_time: time, duration, location: place }].sort((a, b) => a.day - b.day));
    }
  };

  const enablePerSession = () => {
    setSessions(days.map(d => ({ day: d, start_time: time, duration, location: place })));
    setPerSession(true);
  };
  const patchSession = (day: number, patch: Partial<Sess>) =>
    setSessions(ss => ss.map(s => s.day === day ? { ...s, ...patch } : s));

  const autoName = `${subject} · Lớp ${grade}`;

  const handleCreate = async () => {
    if (days.length === 0) { Alert.alert('Chọn ngày học', 'Chọn ít nhất 1 ngày trong tuần.'); return; }
    setLoading(true);
    try {
      const schedule = perSession && sessions.length
        ? { sessions, day: sessions[0].day, days: sessions.map(s => s.day), start_time: sessions[0].start_time, duration: sessions[0].duration, location: sessions[0].location }
        : { days, day: days[0], start_time: time, duration, location: place };
      await createClass({
        name: name || autoName, subject, grade,
        default_fee: parseFloat(fee) || 0, fee_type: feeType, color,
        schedule,
      });
      navigation.goBack();
    } catch {
      Alert.alert('Lỗi', 'Không thể tạo lớp. Thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const chip = (label: string, active: boolean, onPress: () => void) => (
    <Button key={label} label={label} onPress={onPress} variant={active ? 'primary' : 'secondary'} style={styles.chip} />
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Môn dạy</Text>
      <View style={styles.chips}>{SUBJECTS.map(s => chip(s, subject === s, () => setSubject(s)))}</View>

      <Text style={styles.label}>Khối lớp</Text>
      <View style={styles.chips}>{GRADES.map(g => chip(g, grade === g, () => setGrade(g)))}</View>

      <Text style={styles.label}>Tên lớp (tự đặt hoặc để mặc định)</Text>
      <TextInput style={styles.input} placeholder={autoName} placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} />

      <Text style={styles.label}>Cách thu học phí</Text>
      <View style={styles.chips}>
        {FEE_TYPES.map(t => chip(t.label, feeType === t.id, () => {
          setFeeType(t.id);
          setFee(String(FEE_PRESETS_BY_TYPE[t.id][2])); // gợi ý lại giá đúng đơn vị
        }))}
      </View>
      <Text style={styles.feeHint}>{FEE_TYPES.find(t => t.id === feeType)?.hint}</Text>

      <Text style={styles.label}>Học phí mặc định (đ/{FEE_UNIT[feeType]})</Text>
      <View style={styles.chips}>{FEE_PRESETS_BY_TYPE[feeType].map(p => chip(feeLabel(p), fee === String(p), () => setFee(String(p))))}</View>
      <TextInput style={styles.input} placeholder="800000" placeholderTextColor={colors.textMuted} keyboardType="number-pad" value={fee} onChangeText={setFee} />

      <Text style={styles.label}>Ngày học trong tuần (chọn nhiều được)</Text>
      <View style={styles.chips}>{DAYS.map(d => chip(d.label, days.includes(d.value), () => toggleDay(d.value)))}</View>

      {!perSession ? (
        <>
          <Text style={styles.label}>Giờ học</Text>
          <View style={styles.chips}>{TIME_PRESETS.map(t => chip(t, time === t, () => setTime(t)))}</View>

          <Text style={styles.label}>Thời lượng</Text>
          <View style={styles.chips}>{DURATIONS.map(d => chip(d.l, duration === d.v, () => setDuration(d.v)))}</View>

          <Text style={styles.label}>Địa điểm</Text>
          <View style={styles.chips}>{PLACES.map(p => chip(p, place === p, () => setPlace(p)))}</View>

          {days.length >= 2 && (
            <TouchableOpacity style={styles.perSessionHint} onPress={enablePerSession} activeOpacity={0.7}>
              <Text style={styles.hintText}>
                Các buổi đang cùng giờ <Text style={{ fontWeight: '700' }}>{time}</Text>. Buổi khác giờ nhau?{' '}
                <Text style={styles.hintLink}>Đặt giờ riêng từng buổi →</Text>
              </Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <>
          <View style={styles.perSessionTop}>
            <Text style={styles.label}>Giờ từng buổi</Text>
            <TouchableOpacity onPress={() => setPerSession(false)}><Text style={styles.hintLink}>Dùng chung 1 giờ</Text></TouchableOpacity>
          </View>
          {sessions.map(s => (
            <View key={s.day} style={styles.sessCard}>
              <Text style={styles.sessDay}>{DAY_SHORT[s.day]}</Text>
              <View style={styles.chips}>{TIME_PRESETS.map(t => chip(t, s.start_time === t, () => patchSession(s.day, { start_time: t })))}</View>
              <View style={styles.chips}>{DURATIONS.map(d => chip(d.l, s.duration === d.v, () => patchSession(s.day, { duration: d.v })))}</View>
              <View style={styles.chips}>{PLACES.map(p => chip(p, s.location === p, () => patchSession(s.day, { location: p })))}</View>
            </View>
          ))}
        </>
      )}

      <Text style={styles.label}>Màu nhận diện lớp</Text>
      <View style={styles.swatchRow}>
        {CLASS_COLOR_KEYS.map(k => (
          <TouchableOpacity key={k} onPress={() => setColor(k)}
            style={[styles.swatch, { backgroundColor: CLASS_COLORS[k].dot }, color === k && styles.swatchActive]} activeOpacity={0.8}>
            {color === k && <Text style={styles.swatchCheck}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

      <Button label="Tạo lớp" onPress={handleCreate} loading={loading} style={styles.btn} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: 40 },
  label: { ...typography.label, marginTop: spacing.sm },
  feeHint: { fontSize: 12.5, color: colors.textSecondary, lineHeight: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { height: 40, paddingHorizontal: spacing.sm, minWidth: 56 },
  input: { height: 52, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, ...typography.body, backgroundColor: colors.surface },
  btn: { marginTop: spacing.md },
  perSessionHint: { marginTop: spacing.xs, backgroundColor: colors.green50, borderRadius: radius.md, padding: 12 },
  hintText: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  hintLink: { color: colors.green700, fontWeight: '700' },
  perSessionTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sessCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 12, gap: 6, marginBottom: 6 },
  sessDay: { fontSize: 14, fontWeight: '800', color: colors.green700 },
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  swatch: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  swatchActive: { borderColor: colors.textPrimary },
  swatchCheck: { color: 'white', fontSize: 18, fontWeight: '800' },
});
