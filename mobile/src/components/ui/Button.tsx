import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, View, Animated } from 'react-native';
import { colors, radius, typography, layout } from '../../theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'onHero';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  /** Icon tuỳ chọn hiển thị trước nhãn. */
  icon?: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
};

const VARIANTS: Record<Variant, { bg: string; fg: string; border?: string }> = {
  primary:   { bg: colors.green500, fg: '#ffffff' },
  secondary: { bg: colors.green100, fg: colors.green700 },
  ghost:     { bg: 'transparent', fg: colors.green600 },
  outline:   { bg: 'transparent', fg: colors.green700, border: colors.green200 },
  danger:    { bg: colors.coral500, fg: '#ffffff' },
  onHero:    { bg: '#ffffff', fg: colors.green700 },  // nút trắng trên nền hero màu
};

export function Button({ label, onPress, variant = 'primary', loading, disabled, icon, style, testID }: Props) {
  const v = VARIANTS[variant];
  // Phản hồi chạm: nút lún nhẹ (scale 0.97) khi giữ — người dùng "cảm" được cú bấm.
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.97, friction: 6, tension: 300, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, friction: 5, tension: 300, useNativeDriver: true }).start();
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        testID={testID}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled || loading}
        style={[
          styles.btn,
          { backgroundColor: v.bg, opacity: disabled ? 0.5 : 1 },
          v.border ? { borderWidth: 1.5, borderColor: v.border } : null,
          style,
        ]}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color={v.fg} size="small" />
        ) : (
          <View style={styles.inner}>
            {icon}
            <Text style={[styles.label, { color: v.fg }]}>{label}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: { minHeight: layout.tapMin, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 12 },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { ...typography.bodyMedium, fontWeight: '600' },
});
