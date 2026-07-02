import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../../theme';
import { Button } from '../../components/ui/Button';
import { requestOtp, resetPassword } from '../../api/auth';

export function ForgotPasswordScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<'phone' | 'reset'>('phone');
  const [phone, setPhone] = useState<string>(route?.params?.phone ?? '');
  const [devCode, setDevCode] = useState<string | null>(null);

  const [code, setCode] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const phoneValid = phone.trim().length >= 9;
  const resetValid =
    code.trim().length === 6 && newPw.length >= 6 && newPw === confirmPw;

  const handleRequestOtp = async () => {
    if (!phoneValid || loading) return;
    setLoading(true);
    try {
      const res = await requestOtp(phone.trim());
      setDevCode(res?.dev_code ?? null);
      setStep('reset');
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      Alert.alert('Không gửi được mã', detail ?? 'Vui lòng kiểm tra lại số điện thoại và thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!resetValid || loading) return;
    setLoading(true);
    try {
      await resetPassword(phone.trim(), code.trim(), newPw);
      Alert.alert('Đã đặt lại mật khẩu', 'Bạn hãy đăng nhập bằng mật khẩu mới nhé.', [
        {
          text: 'Đăng nhập',
          onPress: () => navigation.navigate('Password', { phone: phone.trim() }),
        },
      ]);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      Alert.alert('Không đặt lại được', detail ?? 'Mã xác thực không đúng hoặc đã hết hạn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'reset') {
      setStep('phone');
    } else {
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={s.container}
    >
      <TouchableOpacity onPress={handleBack} style={s.backBtn}>
        <Text style={s.backBtnText}>←</Text>
      </TouchableOpacity>

      <View style={s.content}>
        {step === 'phone' ? (
          <>
            <Text style={s.title}>Quên mật khẩu?</Text>
            <Text style={s.sub}>
              Đừng lo nhé! Nhập số điện thoại của bạn, chúng tôi sẽ gửi mã xác thực để đặt lại mật khẩu.
            </Text>

            <Text style={s.fieldLabel}>Số điện thoại</Text>
            <View style={s.pwRow}>
              <TextInput
                style={s.pwInput}
                placeholder="Ví dụ: 0901234567"
                placeholderTextColor={colors.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={phoneValid ? handleRequestOtp : undefined}
              />
            </View>
          </>
        ) : (
          <>
            <Text style={s.title}>Đặt lại mật khẩu</Text>
            <Text style={s.sub}>
              Nhập mã xác thực đã gửi và chọn mật khẩu mới cho số{' '}
              <Text style={s.subPhone}>{phone.trim()}</Text>.
            </Text>

            {devCode ? (
              <View style={s.infoBox}>
                <Text style={s.infoText}>
                  Mã xác thực của bạn: <Text style={s.infoCode}>{devCode}</Text>
                  {'\n'}(SMS chưa được bật nên tạm thời hiển thị mã ở đây.)
                </Text>
              </View>
            ) : null}

            <Text style={s.fieldLabel}>Mã xác thực</Text>
            <View style={s.pwRow}>
              <TextInput
                style={s.pwInput}
                placeholder="6 chữ số"
                placeholderTextColor={colors.textMuted}
                value={code}
                onChangeText={t => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
            </View>

            <Text style={s.fieldLabel}>Mật khẩu mới</Text>
            <View style={s.pwRow}>
              <TextInput
                style={s.pwInput}
                placeholder="Tối thiểu 6 ký tự"
                placeholderTextColor={colors.textMuted}
                value={newPw}
                onChangeText={setNewPw}
                secureTextEntry={!showPw}
              />
              <TouchableOpacity onPress={() => setShowPw(p => !p)} style={s.eyeBtn}>
                <Ionicons
                  name={showPw ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            <Text style={s.fieldLabel}>Xác nhận mật khẩu mới</Text>
            <View style={s.pwRow}>
              <TextInput
                style={s.pwInput}
                placeholder="Nhập lại mật khẩu mới"
                placeholderTextColor={colors.textMuted}
                value={confirmPw}
                onChangeText={setConfirmPw}
                secureTextEntry={!showPw}
                returnKeyType="done"
                onSubmitEditing={resetValid ? handleReset : undefined}
              />
            </View>

            {confirmPw.length > 0 && newPw !== confirmPw ? (
              <Text style={s.errText}>Mật khẩu xác nhận chưa khớp.</Text>
            ) : null}
          </>
        )}
      </View>

      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom + 12, 32) }]}>
        {step === 'phone' ? (
          <Button
            label="Gửi mã xác thực"
            onPress={handleRequestOtp}
            loading={loading}
            disabled={!phoneValid || loading}
          />
        ) : (
          <Button
            label="Đặt lại mật khẩu"
            onPress={handleReset}
            loading={loading}
            disabled={!resetValid || loading}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  backBtn: {
    width: 40, height: 40, borderRadius: 12, borderWidth: 1,
    borderColor: colors.border, backgroundColor: 'white',
    alignItems: 'center', justifyContent: 'center',
    margin: spacing.lg, marginTop: 56,
  },
  backBtnText: { fontSize: 18, color: colors.textPrimary },

  content: { flex: 1, paddingHorizontal: spacing.lg },
  title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.4, lineHeight: 30, marginBottom: 8 },
  sub: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 20 },
  subPhone: { fontWeight: '700', color: colors.textPrimary },

  infoBox: { backgroundColor: colors.green50, borderRadius: radius.md, padding: 12, marginBottom: 20 },
  infoText: { fontSize: 13, color: colors.green700, lineHeight: 19 },
  infoCode: { fontWeight: '700', fontSize: 15, letterSpacing: 2, color: colors.green900 },

  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginBottom: 6 },

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

  errText: { fontSize: 13, color: colors.coral700, marginTop: -8, marginBottom: 8 },

  footer: { padding: spacing.lg, gap: 14 },
});
