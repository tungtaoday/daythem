import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../../theme';
import { Button } from '../../components/ui/Button';
import { BackButton } from '../../components/ui/BackButton';

const SUPPORT_EMAIL = 'support@gieochu.vn';

// Đặt lại mật khẩu qua hỗ trợ thủ công (chưa dùng SMS). Người dùng liên hệ hỗ trợ,
// cung cấp SĐT đăng ký; bên hỗ trợ đặt lại (admin CLI) và gửi mật khẩu mới.
export function ForgotPasswordScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const phone: string = route.params?.phone || '';

  const emailBody = `Chào GieoChữ, mình quên mật khẩu.\nSĐT đăng ký: ${phone || '(điền SĐT của bạn)'}\nNhờ hỗ trợ đặt lại giúp mình nhé. Cảm ơn!`;
  const openEmail = () => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Quên mật khẩu GieoChữ')}&body=${encodeURIComponent(emailBody)}`;
    Linking.openURL(url).catch(() => Alert.alert('Liên hệ hỗ trợ', `Email: ${SUPPORT_EMAIL}`));
  };

  return (
    <View style={[s.container, { paddingTop: insets.top + 8 }]}>
      <BackButton variant="boxed" onPress={() => navigation.goBack()} style={{ margin: spacing.lg }} />

      <View style={s.content}>
        <Text style={s.emoji}>🔑</Text>
        <Text style={s.title}>Quên mật khẩu?</Text>
        <Text style={s.sub}>
          Để bảo mật, việc đặt lại mật khẩu được hỗ trợ trực tiếp. Bạn liên hệ hỗ trợ và cung cấp
          {' '}<Text style={s.bold}>số điện thoại đăng ký</Text>, hỗ trợ sẽ đặt lại và gửi mật khẩu mới cho bạn.
        </Text>

        {phone ? (
          <View style={s.phoneBox}>
            <Text style={s.phoneLabel}>SĐT đăng ký</Text>
            <Text style={s.phoneVal}>{phone}</Text>
          </View>
        ) : null}

        <View style={{ height: 8 }} />
        <Button label="Gửi email hỗ trợ" onPress={openEmail} />
        <TouchableOpacity onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {})}>
          <Text style={s.emailText}>hoặc email trực tiếp: {SUPPORT_EMAIL}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, paddingHorizontal: spacing.lg },
  emoji: { fontSize: 40, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.4, marginBottom: 10 },
  sub: { fontSize: 15, color: colors.textSecondary, lineHeight: 22, marginBottom: 20 },
  bold: { fontWeight: '700', color: colors.textPrimary },
  phoneBox: { backgroundColor: colors.green50, borderRadius: radius.md, padding: 14, marginBottom: 12 },
  phoneLabel: { fontSize: 12, color: colors.green700, fontWeight: '700' },
  phoneVal: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: 2 },
  emailText: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 14 },
});
