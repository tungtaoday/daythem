import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/auth';

type Phase = 'welcome' | 'phone';

export function WelcomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>('welcome');
  const [phone, setPhone] = useState('');
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);
  const { loginWithPassword, isLoading } = useAuthStore();

  const phoneValid = /^0\d{9}$/.test(phone);

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setSocialLoading(provider);
    try {
      await loginWithPassword('0901234567', 'demo123');
    } catch {
      setSocialLoading(null);
    }
  };

  const handlePhoneNext = () => {
    navigation.navigate('Password', { phone });
  };

  if (phase === 'phone') {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={s.container}
      >
        <TouchableOpacity onPress={() => setPhase('welcome')} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={s.phoneContent}>
          <Text style={s.phoneTitle}>Số điện thoại của bạn</Text>
          <Text style={s.phoneSub}>
            Nhập số để đăng nhập, hoặc tạo tài khoản mới nếu chưa có.
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

        <View style={[s.phoneFooter, { paddingBottom: Math.max(insets.bottom + 12, 32) }]}>
          <TouchableOpacity
            style={[s.btnPrimary, s.btnRow, !phoneValid && s.btnDisabled]}
            onPress={handlePhoneNext}
            disabled={!phoneValid}
          >
            <Text style={s.btnPrimaryText}>Tiếp tục</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  const loading = socialLoading !== null;

  return (
    <View style={s.container}>
      {/* Brand */}
      <View style={s.brand}>
        <Image source={require('../../../assets/wordmark.png')} style={s.wordmark} resizeMode="contain" />
      </View>

      {/* Hero */}
      <View style={s.heroWrap}>
        <HeroArt />
      </View>

      {/* Title */}
      <View style={s.titleBlock}>
        <Text style={s.title}>Quản lý lớp dạy thêm{'\n'}nhẹ như nhắn tin.</Text>
        <Text style={s.subtitle}>
          Điểm danh, thu học phí, báo nghỉ, học bù — tất cả 1 nút.
        </Text>
      </View>

      {/* Buttons */}
      <View style={s.buttons}>
        {/* Phone — primary, honest path */}
        <TouchableOpacity
          style={[s.btnPrimaryWelcome, s.btnRow]}
          onPress={() => setPhase('phone')}
          disabled={loading}
        >
          <Ionicons name="call-outline" size={20} color="white" />
          <Text style={s.btnPrimaryWelcomeText}>Tiếp tục với số điện thoại</Text>
        </TouchableOpacity>

        {/* Social login is demo-only (mock account) until real OAuth is wired */}
        {__DEV__ && (
          <>
            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>dùng thử nhanh (demo)</Text>
              <View style={s.dividerLine} />
            </View>
            <TouchableOpacity
              style={[s.btnSocial, s.btnRow]}
              onPress={() => handleSocialLogin('google')}
              disabled={loading}
            >
              {socialLoading === 'google'
                ? <ActivityIndicator color={colors.textPrimary} size="small" />
                : <>
                    <GoogleIcon />
                    <Text style={s.btnSocialText}>Dùng thử với tài khoản demo</Text>
                  </>}
            </TouchableOpacity>
          </>
        )}
      </View>

      <Text style={[s.terms, { marginBottom: Math.max(insets.bottom + 8, 24) }]}>
        Tiếp tục đồng nghĩa với việc bạn đồng ý{'\n'}
        <Text style={s.termsLink}>Điều khoản</Text>{'  ·  '}
        <Text style={s.termsLink}>Chính sách bảo mật</Text>
      </Text>

      {/* Social loading overlay */}
      {loading && (
        <View style={s.overlay}>
          <View style={s.overlayIcon}>
            {socialLoading === 'google'
              ? <GoogleIcon size={28} />
              : <Ionicons name="logo-facebook" size={28} color="white" />}
          </View>
          <Text style={s.overlayTitle}>Đang mở tài khoản demo...</Text>
          <Text style={s.overlaySub}>Dùng để trải nghiệm thử</Text>
        </View>
      )}
    </View>
  );
}

function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.65, fontWeight: '700', color: '#4285F4', lineHeight: size }}>G</Text>
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
              <View style={[h.line, { width: '80%' as any, backgroundColor: '#5a4a2a' }]} />
              <View style={[h.line, { width: '55%' as any, backgroundColor: '#a08e6c', marginTop: 5 }]} />
            </View>
          </View>
        </View>
        <View style={[h.card, { backgroundColor: '#fbeeea', borderWidth: 1, borderColor: '#e9c4ba', marginTop: 8 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[h.dot, { backgroundColor: colors.coral500 }]} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <View style={[h.line, { width: '70%' as any, backgroundColor: '#a85e5e' }]} />
              <View style={[h.line, { width: '50%' as any, backgroundColor: '#c98e8e', marginTop: 5 }]} />
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

  brand: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, paddingTop: 56 },
  brandMark: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.green500, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  brandLeaf: { color: 'white', fontSize: 14, fontWeight: '700' },
  brandName: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.3 },
  brandTagline: { fontSize: 11, color: colors.green700, fontWeight: '600', marginTop: 1 },
  wordmark: { width: 220, height: 58 },

  heroWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 180, maxHeight: 240 },

  titleBlock: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  title: { fontSize: 26, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.5, lineHeight: 32, marginBottom: 10 },
  subtitle: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 },

  buttons: { paddingHorizontal: spacing.lg, gap: 10 },
  btnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },

  btnSocial: {
    height: 52, borderRadius: radius.lg, backgroundColor: 'white',
    borderWidth: 1.5, borderColor: colors.border,
  },
  btnSocialText: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },

  btnFacebook: {
    height: 52, borderRadius: radius.lg, backgroundColor: '#1877F2',
  },
  btnFacebookText: { fontSize: 15, fontWeight: '600', color: 'white' },

  btnOutline: {
    height: 52, borderRadius: radius.lg, backgroundColor: 'transparent',
  },
  btnOutlineText: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
  btnPrimaryWelcome: { height: 52, borderRadius: radius.lg, backgroundColor: colors.green500 },
  btnPrimaryWelcomeText: { fontSize: 15, fontWeight: '600', color: 'white' },
  btnDisabled: { opacity: 0.5 },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 2 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },

  terms: { fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 14, lineHeight: 18 },
  termsLink: { color: colors.green600, fontWeight: '600' },

  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(250,248,242,0.95)', alignItems: 'center', justifyContent: 'center' } as any,
  overlayIcon: { width: 64, height: 64, borderRadius: 18, backgroundColor: colors.green500, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  overlayTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 6 },
  overlaySub: { fontSize: 13, color: colors.textSecondary },

  backBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', margin: spacing.lg, marginTop: 56 },
  phoneContent: { flex: 1, paddingHorizontal: spacing.lg },
  phoneTitle: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.4, lineHeight: 30, marginBottom: 8 },
  phoneSub: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 28 },
  phoneRow: { flexDirection: 'row', gap: 8 },
  countryCode: { paddingHorizontal: 14, height: 52, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  countryCodeText: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  phoneInput: { flex: 1, height: 52, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.lg, fontSize: 16, fontWeight: '600', color: colors.textPrimary, backgroundColor: 'white' },
  phoneInputError: { borderColor: colors.coral500 },
  phoneError: { fontSize: 12, color: colors.coral700, marginTop: 6 },
  phoneFooter: { padding: spacing.lg, paddingBottom: 32 },
  btnPrimary: { height: 52, borderRadius: radius.lg, backgroundColor: colors.green500, alignItems: 'center', justifyContent: 'center' },
  btnPrimaryText: { color: 'white', fontSize: 15, fontWeight: '600' },
});
