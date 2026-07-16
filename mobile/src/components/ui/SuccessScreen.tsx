import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../../theme';
import { Button } from './Button';

type Props = {
  title: string;
  sub?: string;
  /** Ký hiệu trong vòng tròn (mặc định ✓). */
  emoji?: string;
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** Nội dung thêm (vd thẻ gợi ý Zalo) giữa phần chữ và nút. */
  children?: React.ReactNode;
};

// Màn "Thành công" dùng chung (gộp các màn Điểm danh/Báo nghỉ/Học bù/Báo cáo...).
// Hiệu ứng = PHẢN HỒI (không trang trí): dấu ✓ nảy nhẹ 1 lần khẳng định "xong rồi",
// chữ mờ dần vào — tổng <400ms, không lặp, không chớp nháy (hợp mắt người lớn tuổi).
export function SuccessScreen({ title, sub, emoji = '✓', primaryLabel, onPrimary, secondaryLabel, onSecondary, children }: Props) {
  const insets = useSafeAreaInsets();
  const scale = useRef(new Animated.Value(0.3)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 320, delay: 80, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View
      testID="success-screen"
      style={[s.wrap, { paddingTop: insets.top + 24, paddingBottom: Math.max(insets.bottom + 16, 32) }]}
    >
      <Animated.View style={[s.circle, { transform: [{ scale }] }]}>
        <Text style={s.check}>{emoji}</Text>
      </Animated.View>
      <Animated.View style={{ opacity: fade, alignItems: 'center', alignSelf: 'stretch' }}>
        <Text testID="success-title" style={s.title}>{title}</Text>
        {sub ? <Text testID="success-sub" style={s.sub}>{sub}</Text> : null}

        {children}

        <View style={s.actions}>
          {primaryLabel && onPrimary && (
            <Button label={primaryLabel} onPress={onPrimary} />
          )}
          {secondaryLabel && onSecondary && (
            <Button label={secondaryLabel} variant="ghost" onPress={onSecondary} />
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  circle: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.green100, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  check: { fontSize: 40, color: colors.green600, fontWeight: '800' },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', letterSpacing: -0.3 },
  sub: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  actions: { alignSelf: 'stretch', gap: 10, marginTop: 28, borderRadius: radius.lg },
});
