import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../../theme';
import { Button } from '../../components/ui/Button';
import { BackButton } from '../../components/ui/BackButton';
import { requestPasswordReset } from '../../api/auth';

// Quên mật khẩu = gửi YÊU CẦU vào hệ thống. GieoChữ xử lý trên dashboard rồi
// đặt lại và gửi mật khẩu mới cho bạn qua Zalo/điện thoại (chưa dùng SMS tự động).
export function ForgotPasswordScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState<string>(route.params?.phone || '');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    const p = phone.trim();
    if (!p) {
      Alert.alert('Thiếu số điện thoại', 'Vui lòng nhập số điện thoại bạn đã dùng để đăng ký.');
      return;
    }
    setSending(true);
    try {
      await requestPasswordReset(p, note.trim() || undefined);
      setSent(true);
    } catch {
      Alert.alert('Chưa gửi được', 'Kiểm tra kết nối mạng rồi thử lại.');
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
      <BackButton variant="boxed" onPress={() => navigation.goBack()} style={{ margin: spacing.lg, marginTop: insets.top + 8 }} />

      <View style={s.content}>
        {sent ? (
          <>
            <Text style={s.emoji}>✅</Text>
            <Text style={s.title}>Đã gửi yêu cầu</Text>
            <Text style={s.sub}>
              GieoChữ đã nhận yêu cầu đặt lại mật khẩu cho số{' '}
              <Text style={s.bold}>{phone.trim()}</Text>. Chúng tôi sẽ đặt lại và gửi mật khẩu mới cho bạn
              qua Zalo/điện thoại. Bạn quay lại đăng nhập sau khi nhận được mật khẩu mới nhé.
            </Text>
            <View style={{ height: 12 }} />
            <Button label="Quay lại đăng nhập" onPress={() => navigation.goBack()} />
          </>
        ) : (
          <>
            <Text style={s.emoji}>🔑</Text>
            <Text style={s.title}>Quên mật khẩu?</Text>
            <Text style={s.sub}>
              Nhập số điện thoại đã đăng ký, GieoChữ sẽ đặt lại giúp bạn và gửi mật khẩu mới qua
              Zalo/điện thoại.
            </Text>

            <Text style={s.label}>Số điện thoại đăng ký</Text>
            <TextInput
              style={s.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="VD: 0901234567"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
            />

            <Text style={s.label}>Lời nhắn cho hỗ trợ (không bắt buộc)</Text>
            <TextInput
              style={[s.input, { height: 80, textAlignVertical: 'top' }]}
              value={note}
              onChangeText={setNote}
              placeholder="VD: tên của bạn để dễ tìm, hoặc ghi chú thêm"
              placeholderTextColor={colors.textMuted}
              multiline
            />

            <View style={{ height: 16 }} />
            {sending ? (
              <View style={s.loadingBtn}><ActivityIndicator color="white" /></View>
            ) : (
              <Button label="Gửi yêu cầu đặt lại" onPress={submit} />
            )}
            <Text style={s.hint}>
              Yêu cầu được gửi thẳng tới GieoChữ — bạn không cần tự gửi email. Thường xử lý trong ít giờ.
            </Text>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, paddingHorizontal: spacing.lg },
  emoji: { fontSize: 40, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.4, marginBottom: 10 },
  sub: { fontSize: 15, color: colors.textSecondary, lineHeight: 22, marginBottom: 20 },
  bold: { fontWeight: '700', color: colors.textPrimary },
  label: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 6, marginTop: 6 },
  input: {
    backgroundColor: 'white', borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.textPrimary, marginBottom: 6,
  },
  loadingBtn: {
    backgroundColor: colors.green500, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  hint: { fontSize: 12.5, color: colors.textMuted, textAlign: 'center', marginTop: 14, lineHeight: 18 },
});
