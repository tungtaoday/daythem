import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { useAuthStore, Gender } from '../../store/auth';

export function SetupScreen() {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('co');
  const { updateProfile, isLoading } = useAuthStore();

  const placeholder = gender === 'co' ? 'Ví dụ: Lan, Hương, Mai...' : 'Ví dụ: Minh, Hùng, Tuấn...';
  const title = gender === 'co' ? 'Cô tên gì ạ?' : 'Thầy tên gì ạ?';

  const handleSave = async () => {
    if (!name.trim()) return;
    await updateProfile(name.trim(), gender);
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.content}>
        <Text style={s.emoji}>👋</Text>
        <Text style={s.welcome}>Chào mừng đến DayThem!</Text>
        <Text style={s.sub}>Cho chúng tôi biết thêm về bạn để cá nhân hóa trải nghiệm.</Text>

        {/* Gender toggle */}
        <Text style={s.label}>Bạn là</Text>
        <View style={s.genderRow}>
          <TouchableOpacity
            style={[s.genderChip, gender === 'co' && s.genderChipActive]}
            onPress={() => setGender('co')}
          >
            <Text style={[s.genderChipText, gender === 'co' && s.genderChipTextActive]}>Cô giáo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.genderChip, gender === 'thay' && s.genderChipActive]}
            onPress={() => setGender('thay')}
          >
            <Text style={[s.genderChipText, gender === 'thay' && s.genderChipTextActive]}>Thầy giáo</Text>
          </TouchableOpacity>
        </View>

        {/* Name */}
        <Text style={[s.label, { marginTop: 20 }]}>{title}</Text>
        <TextInput
          style={s.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />
      </View>

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.btn, (!name.trim() || isLoading) && s.btnDisabled]}
          onPress={handleSave}
          disabled={!name.trim() || isLoading}
        >
          <Text style={s.btnText}>Vào app 🌿</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, padding: spacing.xl, paddingTop: 100 },
  emoji: { fontSize: 52, marginBottom: 14 },
  welcome: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.4, marginBottom: 8 },
  sub: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 28 },
  label: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.2, marginBottom: 10 },

  genderRow: { flexDirection: 'row', gap: 10 },
  genderChip: {
    flex: 1, height: 52, borderRadius: radius.lg,
    borderWidth: 2, borderColor: colors.border,
    backgroundColor: 'white', alignItems: 'center', justifyContent: 'center',
  },
  genderChipActive: { borderColor: colors.green500, backgroundColor: colors.green50 },
  genderChipText: { fontSize: 16, fontWeight: '600', color: colors.textSecondary },
  genderChipTextActive: { color: colors.green700 },

  input: {
    height: 52, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md,
    fontSize: 16, fontWeight: '500', color: colors.textPrimary,
    backgroundColor: 'white',
  },
  footer: { padding: spacing.lg, paddingBottom: 40 },
  btn: { height: 56, borderRadius: radius.lg, backgroundColor: colors.green500, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  btnDisabled: { opacity: 0.45 },
});
