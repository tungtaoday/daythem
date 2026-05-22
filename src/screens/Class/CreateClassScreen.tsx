import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button } from '../../components/ui/Button';
import { colors, spacing, typography, radius } from '../../theme';
import { useClassesStore } from '../../store/classes';

const SUBJECTS = ['Toán', 'Văn', 'Anh', 'Lý', 'Hóa', 'Sinh', 'Sử', 'Địa'];
const GRADES = ['1','2','3','4','5','6','7','8','9','10','11','12'];

export function CreateClassScreen({ navigation }: any) {
  const [subject, setSubject] = useState('Toán');
  const [grade, setGrade] = useState('9');
  const [name, setName] = useState('');
  const [fee, setFee] = useState('800000');
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
        fee_type: 'monthly',
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
});
