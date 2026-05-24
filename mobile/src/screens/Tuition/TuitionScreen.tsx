import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { colors, spacing, typography, radius } from '../../theme';
import { getTuition, recordPayment } from '../../api/tuition';

const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(); d.setMonth(d.getMonth() - i);
  return d.toISOString().slice(0, 7);
});

const ZALO_TEMPLATES = [
  (name: string, amount: string) => `Nhắc nhẹ phụ huynh bé ${name}: học phí tháng này ${amount}đ ạ 🙏`,
  (name: string, amount: string) => `Phụ huynh bé ${name} ơi, học phí tháng này ${amount}đ, nhờ phụ huynh đóng giúp nhé.`,
  (name: string, amount: string) => `Phụ huynh bé ${name}: học phí ${amount}đ. STK: 1234567890 Vietcombank - Nguyễn Thị Lan.`,
];

export function TuitionScreen({ route }: any) {
  const { classId } = route.params;
  const month = new Date().toISOString().slice(0, 7);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = async () => {
    const list = await getTuition(classId, month);
    setData(list);
  };

  useEffect(() => { load(); }, []);

  const togglePaid = async (studentId: string, current: boolean) => {
    await recordPayment(classId, { student_id: studentId, paid: !current });
    setData(d => d.map(t => t.student_id === studentId ? { ...t, paid: !current } : t));
  };

  const toggleSelect = (id: string) => {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const sendZalo = (templateIdx: number) => {
    const recipients = data.filter(t => selected.has(t.student_id));
    recipients.forEach(t => {
      const msg = ZALO_TEMPLATES[templateIdx](t.student_name, t.amount.toLocaleString('vi-VN'));
      if (t.parent_phone) {
        Linking.openURL(`zalo://app?phone=${t.parent_phone}&msg=${encodeURIComponent(msg)}`);
      }
    });
    setSelected(new Set());
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.month}>Tháng {month}</Text>
        <Text style={styles.summary}>
          {data.filter(t => t.paid).length}/{data.length} đã đóng
        </Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={t => t.student_id}
        renderItem={({ item: t }) => (
          <TouchableOpacity
            style={[styles.row, selected.has(t.student_id) && styles.rowSelected]}
            onLongPress={() => toggleSelect(t.student_id)}
            onPress={() => selected.size > 0 ? toggleSelect(t.student_id) : togglePaid(t.student_id, t.paid)}
            activeOpacity={0.8}
          >
            <Avatar name={t.student_name} size={40} />
            <View style={styles.info}>
              <Text style={styles.name}>{t.student_name}</Text>
              <Text style={styles.amount}>{t.amount.toLocaleString('vi-VN')}đ</Text>
            </View>
            <TouchableOpacity
              style={[styles.badge, t.paid ? styles.badgePaid : styles.badgeUnpaid]}
              onPress={() => togglePaid(t.student_id, t.paid)}
            >
              <Text style={styles.badgeText}>{t.paid ? '✓ Đã đóng' : 'Chưa đóng'}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />

      {selected.size > 0 && (
        <View style={styles.zaloPanel}>
          <Text style={styles.zaloTitle}>Gửi nhắc qua Zalo ({selected.size} phụ huynh)</Text>
          <View style={styles.zaloButtons}>
            {['Nhẹ nhàng', 'Trực tiếp', 'Kèm STK'].map((label, i) => (
              <Button key={i} label={label} onPress={() => sendZalo(i)} variant="secondary" style={styles.zaloBtn} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { padding: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  month: { ...typography.bodyMedium, color: colors.green600 },
  summary: { ...typography.caption },
  list: { padding: spacing.md, gap: spacing.xs, paddingBottom: 160 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border,
  },
  rowSelected: { borderColor: colors.green500, backgroundColor: colors.green50 },
  info: { flex: 1 },
  name: { ...typography.bodyMedium },
  amount: { ...typography.caption, color: colors.green600 },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.full },
  badgePaid: { backgroundColor: colors.green100 },
  badgeUnpaid: { backgroundColor: colors.coral100 },
  badgeText: { ...typography.label },
  zaloPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: spacing.md, backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.sm,
  },
  zaloTitle: { ...typography.bodyMedium, color: colors.green600 },
  zaloButtons: { flexDirection: 'row', gap: spacing.xs },
  zaloBtn: { flex: 1, height: 44 },
});
