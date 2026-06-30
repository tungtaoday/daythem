import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Button } from '../../components/ui/Button';
import { colors, spacing, typography, radius } from '../../theme';
import { CLASS_COLORS, CLASS_COLOR_KEYS, ClassColorKey } from '../../theme/classColors';
import { useClassesStore } from '../../store/classes';

const SUBJECTS = ['Toán', 'Văn', 'Anh', 'Lý', 'Hóa', 'Sinh', 'Sử', 'Địa'];
const GRADES = ['1','2','3','4','5','6','7','8','9','10','11','12'];
const DAYS = [
  { label: 'T2', value: 1 }, { label: 'T3', value: 2 }, { label: 'T4', value: 3 },
  { label: 'T5', value: 4 }, { label: 'T6', value: 5 }, { label: 'T7', value: 6 },
  { label: 'CN', value: 7 },
];
const TIME_PRESETS = ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'];
const PLACES = ['Tại nhà', 'Zoom', 'Quán cà phê', 'Khác'];

export function CreateClassScreen({ navigation }: any) {
  const [subject, setSubject] = useState('Toán');
  const [grade, setGrade] = useState('9');
  const [name, setName] = useState('');
  const [fee, setFee] = useState('800000');
  const [day, setDay] = useState(3);
  const [time, setTime] = useState('18:30');
  const [place, setPlace] = useState('Tại nhà');
  const [color, setColor] = useState<ClassColorKey>('green');
  const { createClass } = useClassesStore();
  const [loading, setLoading] = useState(false);

  const autoName = `${subject} · Lớp ${grade}`;

  const handleCreate = async () => {
    setLoading(true);
    try {
      await createClass({
        name: name || autoName,
        subject,
        grade,
        default_fee: parseFloat(fee) || 0,
        fee_type: 'month',
        color,
        schedule: { day, start_time: time, duration: 90, location: place },
      });
      navigation.goBack();
    } catch {
      Alert.alert('Lỗi', 'Không thể tạo lớp. Thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Môn dạy</Text>
      <View style={styles.chips}>
        {SUBJECTS.map(s => (
          <Button key={s} label={s} onPress={() => setSubject(s)}
            variant={subject === s ? 'primary' : 'secondary'}
            style={styles.chip}
          />
        ))}
      </View>

      <Text style={styles.label}>Khối lớp</Text>
      <View style={styles.chips}>
        {GRADES.map(g => (
          <Button key={g} label={g} onPress={() => setGrade(g)}
            variant={grade === g ? 'primary' : 'secondary'}
            style={styles.chip}
          />
        ))}
      </View>

      <Text style={styles.label}>Tên lớp (tự đặt hoặc để mặc định)</Text>
      <TextInput
        style={styles.input}
        placeholder={autoName}
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Học phí mặc định (đ/tháng)</Text>
      <TextInput
        style={styles.input}
        placeholder="800000"
        placeholderTextColor={colors.textMuted}
        keyboardType="number-pad"
        value={fee}
        onChangeText={setFee}
      />

      <Text style={styles.label}>Ngày học trong tuần</Text>
      <View style={styles.chips}>
        {DAYS.map(d => (
          <Button key={d.value} label={d.label} onPress={() => setDay(d.value)}
            variant={day === d.value ? 'primary' : 'secondary'}
            style={styles.chip}
          />
        ))}
      </View>

      <Text style={styles.label}>Giờ học</Text>
      <View style={styles.chips}>
        {TIME_PRESETS.map(t => (
          <Button key={t} label={t} onPress={() => setTime(t)}
            variant={time === t ? 'primary' : 'secondary'}
            style={styles.chip}
          />
        ))}
      </View>

      <Text style={styles.label}>Địa điểm</Text>
      <View style={styles.chips}>
        {PLACES.map(p => (
          <Button key={p} label={p} onPress={() => setPlace(p)}
            variant={place === p ? 'primary' : 'secondary'}
            style={styles.chip}
          />
        ))}
      </View>

      <Text style={styles.label}>Màu nhận diện lớp</Text>
      <View style={styles.swatchRow}>
        {CLASS_COLOR_KEYS.map(k => (
          <TouchableOpacity
            key={k}
            onPress={() => setColor(k)}
            style={[styles.swatch, { backgroundColor: CLASS_COLORS[k].dot }, color === k && styles.swatchActive]}
            activeOpacity={0.8}
          >
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { height: 40, paddingHorizontal: spacing.sm, minWidth: 60 },
  input: {
    height: 52, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md,
    ...typography.body, backgroundColor: colors.surface,
  },
  btn: { marginTop: spacing.md },
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  swatch: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  swatchActive: { borderColor: colors.textPrimary },
  swatchCheck: { color: 'white', fontSize: 18, fontWeight: '800' },
});
