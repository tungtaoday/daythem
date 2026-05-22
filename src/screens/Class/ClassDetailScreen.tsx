import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
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
  { Icon: IconWallet,   iconColor: '#b85a42', label: 'Thu tiền',  kind: 'tab:Tuition', color: '#ffe5da' },
  { Icon: IconBell,     iconColor: '#b85a42', label: 'Báo nghỉ',  kind: 'CancelClass', color: '#fff4f0' },
  { Icon: IconChart,    iconColor: '#2f6849', label: 'Báo cáo',   kind: 'tab:Reports', color: '#f0faf4' },
  { Icon: IconUsers,    iconColor: '#555',    label: 'Học sinh',  kind: 'tab:Students',color: '#f5f3ed' },
  { Icon: IconSettings, iconColor: '#555',    label: 'Cài đặt',   kind: 'settings',    color: '#f5f3ed' },
];

export function ClassDetailScreen({ route, navigation }: any) {
  const { classId } = route.params;
  const { classes, students, fetchStudents } = useClassesStore();
  const klass = classes.find(c => c.id === classId);
  const classStudents = students[classId] || [];
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded) { fetchStudents(classId); setLoaded(true); }
  }, [classId]);

  if (!klass) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.classInfo}>
        <Text style={styles.classSubject}>{klass.subject} · Lớp {klass.grade}</Text>
        <Text style={styles.className}>{klass.name}</Text>
        <Text style={styles.classMeta}>{klass.student_count} học sinh · {klass.default_fee.toLocaleString('vi-VN')}đ/tháng</Text>
      </View>

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

      <Text style={styles.sectionTitle}>Học sinh ({classStudents.length})</Text>
      <Card>
        {classStudents.length === 0
          ? <Text style={styles.emptyText}>Chưa có học sinh. Thêm từ màn hình Học sinh.</Text>
          : classStudents.map((s, i) => (
            <View key={s.id} style={[styles.studentRow, i > 0 && styles.divider]}>
              <Avatar name={s.name} size={36} />
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{s.name}</Text>
                {s.parent_phone && <Text style={styles.studentPhone}>{s.parent_phone}</Text>}
              </View>
            </View>
          ))
        }
      </Card>
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
  sectionTitle: { ...typography.h3 },
  emptyText: { ...typography.caption, textAlign: 'center', paddingVertical: spacing.md },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  studentInfo: { flex: 1 },
  studentName: { ...typography.bodyMedium },
  studentPhone: { ...typography.caption },
});
