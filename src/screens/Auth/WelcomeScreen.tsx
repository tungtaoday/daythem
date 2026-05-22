import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { colors, spacing, radius, typography } from '../../theme';
import { useAuthStore } from '../../store/auth';
import { Ionicons } from '@expo/vector-icons';

type Phase = 'welcome' | 'phone';

export function WelcomeScreen({ navigation }: any) {
  const [phase, setPhase] = useState<Phase>('welcome');
  const [phone, setPhone] = useState('');
  const [zaloLoading, setZaloLoading] = useState(false);
  const { requestOTP, verifyOTP, isLoading } = useAuthStore();

  const phoneValid = /^0\d{9}$/.test(phone);

  const handleZalo = async () => {
    setZaloLoading(true);
    try {
      await requestOTP('0901234567');
      await verifyOTP('0901234567', '123456');
    } catch {
      setZaloLoading(false);
    }
  };

  const handleSendOTP = async () => {
    await requestOTP(phone);
    navigation.navigate('OTP', { phone });
  };

  if (phase === 'phone') {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={s.container}
      >
        <TouchableOpacity onPress={() => setPhase('welcome')} style={s.backBtn}>
          <Text style={s.backBtnText}>←</Text>
        </TouchableOpacity>

        <View style={s.phoneContent}>
          <Text style={s.phoneTitle}>Số điện thoại của cô</Text>
          <Text style={s.phoneSub}>
            Chúng tôi sẽ gửi mã xác thực qua tin nhắn.
          </Text>

          <View style={s.phoneRow}>
            <View style={s.countryCode}>
              <Text style={s.countryCodeText}>🇻🇳 +84</Text>
            </View>
            <TextInput
              style={[s.phoneInput, phone.length > 0 && !phoneValid && s.phoneInputError]}
              placeholder="091 234 5678"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={t => setPhone(t.replace(/[^\d]/g, ''))}
              maxLength={10}
              autoFocus
            />
          </View>

          {phone.length > 0 && !phoneValid && (
            <Text style={s.phoneError}>
              Số điện thoại phải bắt đầu bằng 0 và có 10 chữ số
            </Text>
          )}
        </View>

        <View style={s.phoneFooter}>
          <TouchableOpacity
            style={[s.btnPrimary, (!phoneValid || isLoading) && s.btnDisabled]}
            onPress={handleSendOTP}
            disabled={!phoneValid || isLoading}
          >
            {isLoading
              ? <ActivityIndicator color="white" />
              : <Text style={s.btnPrimaryText}>Gửi mã xác thực</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={s.container}>
      {/* Brand */}
      <View style={s.brand}>
        <View style={s.brandMark}>
          <Text style={s.brandLeaf}>✦</Text>
        </View>
        <Text style={s.brandName}>DayThem</Text>
      </View>

      {/* Hero illustration */}
      <View style={s.heroWrap}>
        <HeroArt />
      </View>

      {/* Title block */}
      <View style={s.titleBlock}>
        <Text style={s.title}>Quản lý lớp dạy thêm{'\n'}nhẹ như nhắn Zalo.</Text>
        <Text style={s.subtitle}>
          Điểm danh, thu học phí, báo nghỉ, học bù — tất cả 1 nút.
        </Text>
      </View>

      {/* Buttons */}
      <View style={s.buttons}>
        <TouchableOpacity
          style={[s.btnPrimary, s.btnRow]}
          onPress={handleZalo}
          disabled={zaloLoading}
        >
          {zaloLoading
            ? <ActivityIndicator color="white" />
            : <>
                <Ionicons name="chatbubble-ellipses" size={20} color="white" />
                <Text style={s.btnPrimaryText}>Đăng nhập với Zalo</Text>
              </>}
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.btnOutline, s.btnRow]}
          onPress={() => setPhase('phone')}
        >
          <Ionicons name="call-outline" size={20} color={colors.textPrimary} />
          <Text style={s.btnOutlineText}>Tiếp tục với số điện thoại</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.terms}>
        Tiếp tục đồng nghĩa với việc bạn đồng ý{'\n'}
        <Text style={s.termsLink}>Điều khoản</Text>{'  ·  '}
        <Text style={s.termsLink}>Chính sách bảo mật</Text>
      </Text>

      {/* Zalo loading overlay */}
      {zaloLoading && (
        <View style={s.overlay}>
          <View style={s.overlayIcon}>
            <Ionicons name="chatbubble-ellipses" size={30} color="white" />
          </View>
          <Text style={s.overlayTitle}>Đang kết nối Zalo...</Text>
          <Text style={s.overlaySub}>Lấy tên & ảnh đại diện</Text>
        </View>
      )}
    </View>
  );
}

function HeroArt() {
  return (
    <View style={h.wrap}>
      <View style={h.blob} />
      <View style={h.phone}>
        <View style={h.notch} />
        <View style={[h.card, { backgroundColor: colors.green500 }]}>
          <View style={[h.line, { width: 40, opacity: 0.6 }]} />
          <View style={[h.line, { width: 60, marginTop: 6 }]} />
          <View style={[h.line, { width: 30, marginTop: 6, opacity: 0.6 }]} />
        </View>
        <View style={[h.card, { backgroundColor: colors.honey100, borderWidth: 1, borderColor: '#f0d99a', marginTop: 8 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[h.dot, { backgroundColor: '#d9a23b' }]} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <View style={[h.line, { width: '80%', backgroundColor: '#5a4a2a' }]} />
              <View style={[h.line, { width: '55%', backgroundColor: '#a08e6c', marginTop: 5 }]} />
            </View>
          </View>
        </View>
        <View style={[h.card, { backgroundColor: '#fbeeea', borderWidth: 1, borderColor: '#e9c4ba', marginTop: 8 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[h.dot, { backgroundColor: colors.coral500 }]} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <View style={[h.line, { width: '70%', backgroundColor: '#a85e5e' }]} />
              <View style={[h.line, { width: '50%', backgroundColor: '#c98e8e', marginTop: 5 }]} />
            </View>
          </View>
        </View>
      </View>
      <View style={h.leafLeft} />
      <View style={h.leafRight} />
    </View>
  );
}

const h = StyleSheet.create({
  wrap: { width: 200, height: 210, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  blob: { position: 'absolute', right: 8, top: 0, width: 110, height: 170, borderRadius: 60, backgroundColor: colors.green500, opacity: 0.1 },
  phone: { width: 130, backgroundColor: 'white', borderRadius: 22, borderWidth: 1.5, borderColor: colors.border, padding: 10, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  notch: { width: 40, height: 5, backgroundColor: colors.border, borderRadius: 3, alignSelf: 'center', marginBottom: 10 },
  card: { borderRadius: 10, padding: 10 },
  line: { height: 5, backgroundColor: 'white', borderRadius: 3 },
  dot: { width: 13, height: 13, borderRadius: 7 },
  leafLeft: { position: 'absolute', left: 2, top: 55, width: 26, height: 38, borderRadius: 18, backgroundColor: colors.green200, opacity: 0.7, transform: [{ rotate: '-30deg' }] },
  leafRight: { position: 'absolute', right: 2, bottom: 28, width: 20, height: 30, borderRadius: 14, backgroundColor: colors.green200, opacity: 0.7, transform: [{ rotate: '20deg' }] },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  // Brand
  brand: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, paddingTop: 56 },
  brandMark: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.green500, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  brandLeaf: { color: 'white', fontSize: 14, fontWeight: '700' },
  brandName: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.3 },

  // Hero
  heroWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 180, maxHeight: 240 },

  // Title
  titleBlock: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  title: { fontSize: 26, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.5, lineHeight: 32, marginBottom: 10 },
  subtitle: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 },

  // Buttons
  buttons: { paddingHorizontal: spacing.lg, gap: 10 },
  btnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnPrimary: { height: 52, borderRadius: radius.lg, backgroundColor: colors.green500, alignItems: 'center', justifyContent: 'center' },
  btnPrimaryText: { color: 'white', fontSize: 15, fontWeight: '600' },
  btnOutline: { height: 52, borderRadius: radius.lg, backgroundColor: 'white', borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  btnOutlineText: { color: colors.textPrimary, fontSize: 15, fontWeight: '500' },
  btnDisabled: { opacity: 0.5 },

  // Terms
  terms: { fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 14, marginBottom: 24, lineHeight: 18 },
  termsLink: { color: colors.green600, fontWeight: '600' },

  // Overlay
  overlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(250,248,242,0.95)', alignItems: 'center', justifyContent: 'center' } as any,
  overlayIcon: { width: 64, height: 64, borderRadius: 18, backgroundColor: colors.green500, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  overlayTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 6 },
  overlaySub: { fontSize: 13, color: colors.textSecondary },

  // Phone phase
  backBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', margin: spacing.lg, marginTop: 56 },
  backBtnText: { fontSize: 18, color: colors.textPrimary },
  phoneContent: { flex: 1, paddingHorizontal: spacing.lg },
  phoneTitle: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.4, lineHeight: 30, marginBottom: 8 },
  phoneSub: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 28 },
  phoneRow: { flexDirection: 'row', gap: 8 },
  countryCode: { paddingHorizontal: 14, height: 52, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  countryCodeText: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  phoneInput: { flex: 1, height: 52, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, fontSize: 16, fontWeight: '600', color: colors.textPrimary, backgroundColor: 'white' },
  phoneInputError: { borderColor: colors.coral500 },
  phoneError: { fontSize: 12, color: colors.coral700, marginTop: 6 },
  phoneFooter: { padding: spacing.lg, paddingBottom: 32 },
});
