import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';
import { colors, spacing, typography, radius } from '../../theme';
import { useClassesStore } from '../../store/classes';

const FEE_TYPES = [
  { key: 'default', label: 'Mặc định' },
  { key: 'discount', label: 'Giảm giá' },
  { key: 'free', label: 'Miễn phí' },
  { key: 'custom', label: 'Tuỳ chỉnh' },
];

export function StudentListScreen({ route }: any) {
  const { classId } = route.params;
  const { students, fetchStudents, addStudent, setStudentFee } = useClassesStore();
  const classStudents = students[classId] || [];
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [feeModal, setFeeModal] = useState<any>(null);
  const [feeType, setFeeType] = useState('default');
  const [feeAmount, setFeeAmount] = useState('');

  useEffect(() => { fetchStudents(classId); }, [classId]);

  const handleAdd = async () => {
    if (!name.trim()) { Alert.alert('Nhập tên học sinh'); return; }
    await addStudent(classId, { name: name.trim(), parent_name: parentName, parent_phone: parentPhone });
    setName(''); setParentName(''); setParentPhone(''); setShowAdd(false);
  };

  const handleSaveFee = async () => {
    if (!feeModal) return;
    await setStudentFee(feeModal.id, {
      fee_type: feeType,
      amount: ['discount', 'custom'].includes(feeType) ? parseFloat(feeAmount) : undefined,
    });
    setFeeModal(null);
    fetchStudents(classId);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={classStudents}
        keyExtractor={s => s.id}
        renderItem={({ item: s }) => (
          <Card style={styles.studentCard}>
            <View style={styles.cardRow}>
              <Avatar name={s.name} size={44} />
              <View style={styles.info}>
                <Text style={styles.name}>{s.name}</Text>
                {s.parent_name && <Text style={styles.meta}>{s.parent_name} · {s.parent_phone}</Text>}
                <TouchableOpacity onPress={() => { setFeeModal(s); setFeeType(s.fee_setting?.fee_type || 'default'); setFeeAmount(String(s.fee_setting?.amount || '')); }}>
                  <Text style={styles.feeBadge}>
                    {s.fee_setting?.fee_type === 'free' ? '🎁 Miễn phí' :
                      s.fee_setting?.fee_type === 'discount' ? `🏷️ ${s.fee_setting.amount?.toLocaleString('vi-VN')}đ` :
                        s.fee_setting?.fee_type === 'custom' ? `⚙️ ${s.fee_setting.amount?.toLocaleString('vi-VN')}đ` :
                          '📋 Mặc định'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        )}
        contentContainerStyle={styles.list}
      />

      {showAdd ? (
        <View style={styles.addForm}>
          <TextInput style={styles.input} placeholder="Tên học sinh *" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Tên phụ huynh" value={parentName} onChangeText={setParentName} />
          <TextInput style={styles.input} placeholder="SĐT phụ huynh" value={parentPhone} onChangeText={setParentPhone} keyboardType="phone-pad" />
          <View style={styles.addBtns}>
            <Button label="Huỷ" onPress={() => setShowAdd(false)} variant="ghost" style={styles.halfBtn} />
            <Button label="Thêm" onPress={handleAdd} style={styles.halfBtn} />
          </View>
        </View>
      ) : (
        <View style={styles.footer}>
          <Button label="+ Thêm học sinh" onPress={() => setShowAdd(true)} />
        </View>
      )}

      <Modal visible={!!feeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Học phí — {feeModal?.name}</Text>
            <View style={styles.feeTypes}>
              {FEE_TYPES.map(f => (
                <TouchableOpacity key={f.key} style={[styles.feeType, feeType === f.key && styles.feeTypeSelected]}
                  onPress={() => setFeeType(f.key)}>
                  <Text style={[styles.feeTypeText, feeType === f.key && styles.feeTypeTextSelected]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {['discount', 'custom'].includes(feeType) && (
              <TextInput style={styles.input} placeholder="Số tiền (đ)" value={feeAmount} onChangeText={setFeeAmount} keyboardType="number-pad" />
            )}
            <View style={styles.addBtns}>
              <Button label="Huỷ" onPress={() => setFeeModal(null)} variant="ghost" style={styles.halfBtn} />
              <Button label="Lưu" onPress={handleSaveFee} style={styles.halfBtn} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.md, gap: spacing.sm, paddingBottom: 120 },
  studentCard: {},
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  info: { flex: 1 },
  name: { ...typography.bodyMedium },
  meta: { ...typography.caption, marginTop: 2 },
  feeBadge: { ...typography.caption, color: colors.green600, marginTop: 4 },
  addForm: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.sm },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  input: { height: 48, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, ...typography.body, backgroundColor: colors.bg },
  addBtns: { flexDirection: 'row', gap: spacing.sm },
  halfBtn: { flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, gap: spacing.md },
  modalTitle: { ...typography.h3 },
  feeTypes: { flexDirection: 'row', gap: spacing.xs },
  feeType: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center' },
  feeTypeSelected: { borderColor: colors.green500, backgroundColor: colors.green50 },
  feeTypeText: { ...typography.caption },
  feeTypeTextSelected: { color: colors.green700, fontWeight: '600' },
});
