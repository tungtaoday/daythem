import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../../theme';
import { BackButton } from '../../components/ui/BackButton';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/auth';
import { checkPhone } from '../../api/auth';

export function PasswordScreen({ route, navigation }: any) {
  const { phone } = route.params;
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  // null = chưa biết (mạng chậm) → coi như đăng nhập bình thường; false = SĐT mới → chế độ TẠO mật khẩu.
  const [exists, setExists] = useState<boolean | null>(null);
  const { loginWithPassword, isLoading } = useAuthStore();

  useEffect(() => {
    let alive = true;
    checkPhone(phone)
      .then(d => { if (alive) setExists(d.exists); })
      .catch(() => {}); // không chặn luồng nếu check lỗi
    return () => { alive = false; };
  }, [phone]);

  const isCreate = exists === false;
  const valid = password.length >= 6 && (!isCreate || confirm === password);

  const handleLogin = async () => {
    // Chống gõ nhầm khi tạo mật khẩu lần đầu: bắt nhập lại trùng khớp.
    if (isCreate && confirm !== password) {
      Alert.alert('Mật khẩu chưa khớp', 'Hai ô mật khẩu phải giống nhau.');
      return;
    }
    try {
      await loginWithPassword(phone, password);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        Alert.alert('Mật khẩu không đúng', 'Vui lòng kiểm tra lại mật khẩu, hoặc bấm "Quên mật khẩu?" bên dưới.');
      } else {
        Alert.alert('Không kết nối được', 'Kiểm tra mạng rồi thử lại nhé. Tài khoản của bạn vẫn an toàn.');
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
        <Text style={s.title}>{isCreate ? 'Tạo mật khẩu mới' : 'Mật khẩu cho số này'}</Text>
        <Text style={s.sub}>
          Số điện thoại: <Text style={s.subPhone}>{phone}</Text>
          {'  '}
          <Text style={s.editPhone} onPress={() => navigation.goBack()}>Sửa số</Text>
        </Text>
        {isCreate ? (
          <View style={s.infoBox}>
            <Text style={s.infoText}>
              Số này lần đầu dùng GieoChữ. Hãy tạo mật khẩu dễ nhớ — nhập 2 lần cho khớp nhé.
            </Text>
          </View>
        ) : exists === null ? (
          <View style={s.infoBox}>
            <Text style={s.infoText}>
              Nhập mật khẩu bạn đã đặt. Lần đầu dùng số này? Mật khẩu bạn nhập sẽ dùng để đăng nhập từ lần sau.
            </Text>
          </View>
        ) : null}

        <View style={s.pwRow}>
          <TextInput
            style={s.pwInput}
            placeholder="Tối thiểu 6 ký tự"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPw}
            autoFocus
            returnKeyType={isCreate ? 'next' : 'done'}
            onSubmitEditing={!isCreate && valid ? handleLogin : undefined}
          />
          <TouchableOpacity
            onPress={() => setShowPw(p => !p)}
            style={s.eyeBtn}
            accessibilityRole="button"
            accessibilityLabel={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            <Ionicons
              name={showPw ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {isCreate && (
          <View style={s.pwRow}>
            <TextInput
              style={s.pwInput}
              placeholder="Nhập lại mật khẩu"
              placeholderTextColor={colors.textMuted}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!showPw}
              returnKeyType="done"
              onSubmitEditing={valid ? handleLogin : undefined}
            />
            {confirm.length > 0 && (
              <View style={s.eyeBtn}>
                <Ionicons
                  name={confirm === password ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={confirm === password ? colors.green600 : colors.coral500}
                />
              </View>
            )}
          </View>
        )}

        {__DEV__ && (
          <View style={s.devHint}>
            <Text style={s.devHintText}>✦  Dev: mật khẩu bất kỳ ≥ 6 ký tự</Text>
          </View>
        )}
      </View>

      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom + 12, 32) }]}>
        <Button
          label={isCreate ? 'Tạo tài khoản' : 'Đăng nhập'}
          onPress={handleLogin}
          loading={isLoading}
          disabled={!valid || isLoading}
        />
        {!isCreate && (
          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword', { phone })}
            style={s.forgotBtn}
            hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
          >
            <Text style={s.forgotText}>Quên mật khẩu?</Text>
          </TouchableOpacity>
        )}
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
  forgotBtn: { alignSelf: 'center', paddingVertical: 6, paddingHorizontal: 12 },
  forgotText: { fontSize: 14.5, fontWeight: '600', color: colors.green700, textAlign: 'center' },
  editPhone: { fontSize: 14, fontWeight: '700', color: colors.green700 },
});
