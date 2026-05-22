import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { Button } from '../../components/ui/Button';
import { colors, spacing, typography, radius } from '../../theme';
import { listReports, generateReport } from '../../api/reports';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';

function getMondayOfWeek(d = new Date()) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().slice(0, 10);
}

export function ReportScreen({ route }: any) {
  const { classId } = route.params;
  const [reports, setReports] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const weekStart = getMondayOfWeek();

  useEffect(() => {
    listReports(classId).then(setReports);
  }, [classId]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const report = await generateReport(classId, weekStart);
      setReports(r => [report, ...r]);
      setSelected(report);
    } catch {
      Alert.alert('Lỗi', 'Không thể tạo báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const sendViaZalo = (student: any) => {
    const msg = `Báo cáo tuần (${selected.week_start} - ${selected.content.week_end}):\n` +
      `Bé ${student.name}:\n` +
      `📚 Đi học: ${student.sessions_attended}/${student.sessions_total} buổi\n` +
      `💰 Học phí: ${student.tuition_paid ? '✅ Đã đóng' : `⏳ Chưa đóng (${student.tuition_amount?.toLocaleString('vi-VN')}đ)`}`;
    if (student.parent_phone) {
      Linking.openURL(`zalo://app?phone=${student.parent_phone}&msg=${encodeURIComponent(msg)}`);
    }
  };

  const currentReport = selected || reports[0];

  return (
    <View style={styles.container}>
      <Button
        label={`📊 Tạo báo cáo tuần này (${weekStart})`}
        onPress={handleGenerate}
        loading={loading}
        style={styles.genBtn}
      />

      {currentReport && (
        <>
          <Text style={styles.sectionTitle}>
            Báo cáo tuần {currentReport.week_start} → {currentReport.content?.week_end}
          </Text>
          <FlatList
            data={currentReport.content?.students || []}
            keyExtractor={s => s.student_id}
            renderItem={({ item: s }) => (
              <Card style={styles.studentCard}>
                <View style={styles.cardRow}>
                  <Avatar name={s.name} size={40} />
                  <View style={styles.cardInfo}>
                    <Text style={styles.studentName}>{s.name}</Text>
                    <Text style={styles.attendance}>📚 {s.sessions_attended}/{s.sessions_total} buổi</Text>
                    <Text style={[styles.tuition, s.tuition_paid ? styles.paid : styles.unpaid]}>
                      {s.tuition_paid ? '✅ Đã đóng tiền' : `⏳ Chưa đóng (${s.tuition_amount?.toLocaleString('vi-VN')}đ)`}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.zaloBtn} onPress={() => sendViaZalo(s)}>
                    <Text style={styles.zaloBtnText}>Zalo</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            )}
            contentContainerStyle={styles.list}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.md },
  genBtn: { marginBottom: spacing.md },
  sectionTitle: { ...typography.h3, marginBottom: spacing.sm },
  list: { gap: spacing.sm, paddingBottom: 40 },
  studentCard: {},
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardInfo: { flex: 1 },
  studentName: { ...typography.bodyMedium },
  attendance: { ...typography.caption, marginTop: 2 },
  tuition: { ...typography.caption, marginTop: 2 },
  paid: { color: colors.green600 },
  unpaid: { color: colors.coral500 },
  zaloBtn: { backgroundColor: colors.green100, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.full },
  zaloBtnText: { ...typography.label, color: colors.green700 },
});
