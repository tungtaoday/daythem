import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { useAuthStore } from '../../store/auth';

export function OTPScreen({ route, navigation }: any) {
  const { phone } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const refs = useRef<(TextInput | null)[]>([]);
  const { verifyOTP, isLoading } = useAuthStore();

  const maskedPhone = phone.slice(0, 4) + ' *** ' + phone.slice(-3);

  const handleChange = (val: string, idx: number) => {
    const digit = val.replace(/[^\d]/g, '').slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    if (digit && idx < 5) refs.current[idx + 1]?.focus();
    if (next.every(d => d) && digit) {
      setTimeout(() => handleVerify(next.join('')), 300);
    }
  };

  const handleBackspace = (key: string, idx: number) => {
    if (key === 'Backspace' && !otp[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async (code: string) => {
    try {
      await verifyOTP(phone, code);
    } catch {
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => refs.current[0]?.focus(), 100);
    }
  };

  return (
    <View style={s.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
        <Text style={s.backBtnText}>←</Text>
      </TouchableOpacity>

      <View style={s.content}>
        <Text style={s.title}>Nhập mã xác thực</Text>
        <Text style={s.sub}>
          Mã 6 chữ số đã gửi đến số{' '}
          <Text style={s.subPhone}>{maskedPhone}</Text>
          {' '}qua tin nhắn.
        </Text>

        <View style={s.cells}>
          {otp.map((d, i) => (
            <TextInput
              key={i}
              ref={r => { refs.current[i] = r; }}
              style={[s.cell, d ? s.cellFilled : null]}
              value={d}
              onChangeText={v => handleChange(v, i)}
              onKeyPress={({ nativeEvent }) => handleBackspace(nativeEvent.key, i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              caretHidden
            />
          ))}
        </View>

        <Text style={s.resend}>
          Chưa nhận được mã?{' '}
          <Text style={s.resendLink}>Gửi lại sau 0:42</Text>
        </Text>

        {__DEV__ && (
          <View style={s.devHint}>
            <Text style={s.devHintText}>✦  Dev: mã luôn là 123456</Text>
          </View>
        )}
      </View>

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.btnPrimary, (otp.some(d => !d) || isLoading) && s.btnDisabled]}
          onPress={() => handleVerify(otp.join(''))}
          disabled={otp.some(d => !d) || isLoading}
        >
          {isLoading
            ? <ActivityIndicator color="white" />
            : <Text style={s.btnText}>Xác nhận</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  backBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', margin: spacing.lg, marginTop: 56 },
  backBtnText: { fontSize: 18, color: colors.textPrimary },

  content: { flex: 1, paddingHorizontal: spacing.lg },
  title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.4, lineHeight: 30, marginBottom: 8 },
  sub: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 32 },
  subPhone: { fontWeight: '700', color: colors.textPrimary },

  cells: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  cell: {
    width: 48, height: 56, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.md, textAlign: 'center', fontSize: 22, fontWeight: '700',
    backgroundColor: 'white', color: colors.textPrimary,
  },
  cellFilled: { borderColor: colors.green500, backgroundColor: colors.green50 },

  resend: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginBottom: 20 },
  resendLink: { color: colors.green600, fontWeight: '600' },

  devHint: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: 12, flexDirection: 'row', alignItems: 'center' },
  devHintText: { fontSize: 13, color: colors.textSecondary },

  footer: { padding: spacing.lg, paddingBottom: 32 },
  btnPrimary: { height: 52, borderRadius: radius.lg, backgroundColor: colors.green500, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: 'white', fontSize: 15, fontWeight: '600' },
  btnDisabled: { opacity: 0.5 },
});
