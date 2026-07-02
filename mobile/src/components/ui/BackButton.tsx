import React from 'react';
import { TouchableOpacity, View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme';
import { IconChevron } from '../icons';

type Props = {
  onPress: () => void;
  /** 'boxed' = nút viền trắng (mặc định, dùng trên nền sáng); 'chip' = nền mờ trên hero. */
  variant?: 'boxed' | 'chip';
  color?: string;
  style?: ViewStyle;
};

// Nút quay lại thống nhất toàn app (chevron xoay 180°, vùng chạm 44px).
export function BackButton({ onPress, variant = 'boxed', color, style }: Props) {
  const fg = color || (variant === 'chip' ? '#fff' : colors.textPrimary);
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.hit, variant === 'boxed' ? styles.boxed : styles.chip, style]}
      accessibilityLabel="Quay lại"
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <View style={{ transform: [{ rotate: '180deg' }] }}>
        <IconChevron size={18} color={fg} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  hit: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  boxed: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chip: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 22 },
});
