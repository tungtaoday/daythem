import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { colors } from '../../theme';
import { classColor } from '../../theme/classColors';
import { useClassesStore } from '../../store/classes';
import { EmptyState } from '../../components/ui/EmptyState';

export function ArchivedClassesScreen({ navigation }: any) {
  const { archivedClasses, fetchArchived, restoreClass, fetchClasses } = useClassesStore();
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    Promise.resolve(fetchArchived()).finally(() => setLoading(false));
  }, []);

  const onRestore = (id: string, name: string) => {
    Alert.alert('Khôi phục lớp', `Đưa "${name}" trở lại danh sách lớp chính?`, [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Khôi phục',
        onPress: async () => {
          setRestoring(id);
          try {
            await restoreClass(id);
            await fetchClasses();
          } catch {
            Alert.alert('Lỗi', 'Không khôi phục được. Kiểm tra mạng và thử lại.');
          } finally {
            setRestoring(null);
          }
        },
      },
    ]);
  };

  if (loading) {
    return <View style={[s.container, s.center]}><ActivityIndicator color={colors.green500} size="large" /></View>;
  }

  if (archivedClasses.length === 0) {
    return (
      <View style={s.container}>
        <EmptyState
          icon="📦"
          title="Chưa có lớp lưu trữ"
          subtitle="Khi lưu trữ một lớp, lớp đó sẽ nằm ở đây và có thể khôi phục bất cứ lúc nào."
        />
      </View>
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 16 }}>
      {archivedClasses.map(c => {
        const cc = classColor(c.color);
        return (
          <View key={c.id} style={s.row}>
            <View style={[s.dot, { backgroundColor: cc.dot }]} />
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{c.name}</Text>
              <Text style={s.sub}>{c.subject}{c.student_count ? ` · ${c.student_count} học sinh` : ''}</Text>
            </View>
            <TouchableOpacity
              style={s.restoreBtn}
              onPress={() => onRestore(c.id, c.name)}
              disabled={restoring === c.id}
            >
              <Text style={s.restoreText}>{restoring === c.id ? '…' : 'Khôi phục'}</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 10 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  name: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  sub: { fontSize: 12.5, color: colors.textSecondary, marginTop: 2 },
  restoreBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: colors.green500, backgroundColor: colors.green50 },
  restoreText: { fontSize: 13, fontWeight: '700', color: colors.green700 },
});
