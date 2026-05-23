import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { colors, spacing, typography, radius } from '../../theme';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';
import { useClassesStore } from '../../store/classes';
import {
  IconCheck, IconWallet, IconBell, IconChart, IconUsers, IconSettings,
} from '../../components/icons';

type Action = { Icon: any; iconColor: string; label: string; kind: string; color: string };

const ACTIONS: Action[] = [
  { Icon: IconCheck,    iconColor: '#2f6849', label: 'Điểm danh', kind: 'Attendance',  color: '#d8f3e3' },
  { Icon: IconWallet,   iconColor: '#b85a42', label: 'Thu tiền',   kind: 'ClassTuition', color: '#ffe5da' },
  { Icon: IconBell,     iconColor: '#b85a42', label: 'Báo nghỉ',  kind: 'CancelClass',  color: '#fff4f0' },
  { Icon: IconChart,    iconColor: '#2f6849', label: 'Báo cáo',   kind: 'ClassReport',  color: '#f0faf4' },
  { Icon: IconUsers,    iconColor: '#555',    label: 'Học sinh',  kind: 'ClassStudents', color: '#f5f3ed' },
  { Icon: IconSettings, iconColor: '#555',    label: 'Cài đặt',   kind: 'settings',    color: '#f5f3ed' },
];

export function ClassDetailScreen({ route, navigation }: any) {
  const { classId } = route.params;
  const { classes, students, fetchStudents, addStudent } = useClassesStore();
  const klass = classes.find(c => c.id === classId);
  const classStudents = students[classId] || [];
  const [loaded, setLoaded] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('');

  useEffect(() => {
    if (!loaded) { fetchStudents(classId); setLoaded(true); }
  }, [classId]);

  if (!klass) return null;

  const handleAdd = async () => {
    if (!addName.trim()) return;
    try {
      await addStudent(classId, { name: addName.trim(), parent_phone: addPhone || null });
      setAddName(''); setAddPhone(''); setShowAdd(false);
    } catch {
      Alert.alert('Lỗi', 'Không thể thêm học sinh.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Class info card */}
      <View style={styles.classInfo}>
        <Text style={styles.classSubject}>{klass.subject} · Lớp {klass.grade}</Text>
        <Text style={styles.className}>{klass.name}</Text>
        <Text style={styles.classMeta}>{klass.student_count} học sinh · {klass.default_fee.toLocaleString('vi-VN')}đ/tháng</Text>
      </View>

      {/* 6 action tiles */}
      <View style={styles.grid}>
        {ACTIONS.map(a => (
          <TouchableOpacity
            key={a.label}
            style={[styles.action, { backgroundColor: a.color }]}
            onPress={() => {
              if (a.kind.startsWith('tab:')) {
                const tabScreen = a.kind.replace('tab:', '');
                navigation.navigate('MainTabs', { screen: tabScreen, params: { filterClassId: classId } });
              } else if (a.kind === 'settings') {
                navigation.navigate('ClassSettings', { classId, className: klass.name });
              } else {
                navigation.navigate(a.kind, { classId, className: klass.name });
              }
            }}
            activeOpacity={0.8}
          >
            <a.Icon size={26} color={a.iconColor} />
            <Text style={styles.actionLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Student section — tappable rows + inline add */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Học sinh ({classStudents.length})</Text>
        <TouchableOpacity onPress={() => setShowAdd(true)}>
          <Text style={styles.addLink}>+ Thêm</Text>
        </TouchableOpacity>
      </View>
      <Card>
        {classStudents.length === 0 ? (
          <TouchableOpacity style={styles.emptyRow} onPress={() => setShowAdd(true)}>
            <Text style={styles.emptyText}>+ Thêm học sinh đầu tiên vào lớp</Text>
          </TouchableOpacity>
        ) : (
          classStudents.map((s, i) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.studentRow, i > 0 && styles.divider]}
              onPress={() => navigation.navigate('MainTabs', { screen: 'Students', params: { filterClassId: classId } })}
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
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Thêm học sinh</Text>
            <TouchableOpacity onPress={() => { setShowAdd(false); setAddName(''); setAddPhone(''); }}>
              <Text style={styles.modalClose}>Huỷ</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Tên học sinh *"
            value={addName}
            onChangeText={setAddName}
            autoFocus
          />
          <TextInput
            style={styles.input}
            placeholder="SĐT phụ huynh"
            value={addPhone}
            onChangeText={setAddPhone}
            keyboardType="phone-pad"
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
  classInfo: { backgroundColor: colors.green500, padding: spacing.lg, borderRadius: radius.lg },
  classSubject: { ...typography.caption, color: colors.green100 },
  className: { ...typography.h2, color: '#fff', marginTop: 4 },
  classMeta: { ...typography.caption, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  action: { width: '31%', aspectRatio: 1, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  actionLabel: { ...typography.caption, fontWeight: '600', textAlign: 'center' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { ...typography.h3 },
  addLink: { fontSize: 14, fontWeight: '600', color: colors.green600 },
  emptyRow: { paddingVertical: spacing.md, alignItems: 'center' },
  emptyText: { ...typography.caption, color: colors.green600, fontWeight: '600' },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.sm },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  studentInfo: { flex: 1 },
  studentName: { ...typography.bodyMedium },
  studentPhone: { ...typography.caption },
  chevron: { fontSize: 20, color: colors.textMuted },
  modal: { flex: 1, padding: 24, backgroundColor: colors.bg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  modalClose: { fontSize: 16, color: colors.green600, fontWeight: '600' },
  input: { backgroundColor: 'white', borderWidth: 1.5, borderColor: colors.border, borderRadius: 14, padding: 14, fontSize: 16, marginBottom: 12, color: colors.textPrimary },
  saveBtn: { backgroundColor: colors.green500, padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
