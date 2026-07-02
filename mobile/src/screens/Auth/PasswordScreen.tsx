import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../../theme';
import { BackButton } from '../../components/ui/BackButton';
import { useAuthStore } from '../../store/auth';

export function PasswordScreen({ route, navigation }: any) {
  const { phone } = route.params;
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const { loginWithPassword, isLoading } = useAuthStore();

  const maskedPhone = phone.slice(0, 4) + ' *** ' + phone.slice(-3);
  const valid = password.length >= 6;

  const handleLogin = async () => {
    try {
      await loginWithPassword(phone, password);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        Alert.alert('Mật khẩu không đúng', 'Vui lòng kiểm tra lại mật khẩu.');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={s.container}
    >
      <BackButton
        variant="boxed"
        onPress={() => navigation.goBack()}
        style={{ margin: spacing.lg, marginTop: insets.top + 8 }}
      />

      <View style={s.content}>
        <Text style={s.title}>Mật khẩu cho số này</Text>
        <Text style={s.sub}>
          Nhập mật khẩu cho số{' '}
          <Text style={s.subPhone}>{maskedPhone}</Text>
        </Text>
        <View style={s.infoBox}>
          <Text style={s.infoText}>
            Lần đầu dùng số này? Mật khẩu bạn nhập sẽ là mật khẩu để đăng nhập từ lần sau. Hãy chọn mật khẩu dễ nhớ nhé.
          </Text>
        </View>

        <View style={s.pwRow}>
          <TextInput
            style={s.pwInput}
            placeholder="Tối thiểu 6 ký tự"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPw}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={valid ? handleLogin : undefined}
          />
          <TouchableOpacity onPress={() => setShowPw(p => !p)} style={s.eyeBtn}>
            <Ionicons
              name={showPw ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {__DEV__ && (
          <View style={s.devHint}>
            <Text style={s.devHintText}>✦  Dev: mật khẩu bất kỳ ≥ 6 ký tự</Text>
          </View>
        )}
      </View>

      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom + 12, 32) }]}>
        <TouchableOpacity
          style={[s.btnPrimary, (!valid || isLoading) && s.btnDisabled]}
          onPress={handleLogin}
          disabled={!valid || isLoading}
        >
          {isLoading
            ? <ActivityIndicator color="white" />
            : <Text style={s.btnText}>Đăng nhập</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword', { phone })}>
          <Text style={s.forgotText}>Quên mật khẩu?</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  content: { flex: 1, paddingHorizontal: spacing.lg },
  title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.4, lineHeight: 30, marginBottom: 8 },
  sub: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 16 },
  subPhone: { fontWeight: '700', color: colors.textPrimary },
  infoBox: { backgroundColor: colors.green50, borderRadius: radius.md, padding: 12, marginBottom: 20 },
  infoText: { fontSize: 13, color: colors.green700, lineHeight: 19 },

  pwRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    backgroundColor: 'white', marginBottom: 16,
  },
  pwInput: {
    flex: 1, height: 52, paddingHorizontal: spacing.md,
    fontSize: 16, fontWeight: '500', color: colors.textPrimary,
  },
  eyeBtn: { paddingHorizontal: spacing.md, height: 52, alignItems: 'center', justifyContent: 'center' },

  devHint: {
    backgroundColor: colors.surfaceAlt, borderRadius: radius.md,
    padding: 12, flexDirection: 'row', alignItems: 'center',
  },
  devHintText: { fontSize: 13, color: colors.textSecondary },

  footer: { padding: spacing.lg, gap: 14 },
  btnPrimary: { height: 52, borderRadius: radius.lg, backgroundColor: colors.green500, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: 'white', fontSize: 15, fontWeight: '600' },
  btnDisabled: { opacity: 0.5 },
  forgotText: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
});
