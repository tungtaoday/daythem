import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { Button } from '../../components/ui/Button';
import { colors, spacing, typography, radius } from '../../theme';
import { useAuthStore } from '../../store/auth';

export function SetupScreen() {
  const [name, setName] = useState('');
  const { updateProfile, isLoading } = useAuthStore();

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Nhập tên của bạn'); return; }
    await updateProfile(name.trim());
  };

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>👋</Text>
      <Text style={styles.title}>Chào mừng đến DayThem!</Text>
      <Text style={styles.sub}>Để bắt đầu, cho chúng tôi biết tên của bạn</Text>

      <Text style={styles.label}>Tên của bạn (hoặc tên lớp)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ví dụ: Cô Lan, Thầy Minh..."
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={setName}
      />

      <Button label="Vào app 🌿" onPress={handleSave} loading={isLoading} style={styles.btn} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.xl, paddingTop: 100 },
  emoji: { fontSize: 56, marginBottom: spacing.md },
  title: { ...typography.h2, marginBottom: spacing.xs },
  sub: { ...typography.caption, marginBottom: spacing.xl },
  label: { ...typography.label, marginBottom: spacing.xs },
  input: {
    height: 52, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md,
    ...typography.body, backgroundColor: colors.surface, marginBottom: spacing.md,
  },
  btn: {},
});
