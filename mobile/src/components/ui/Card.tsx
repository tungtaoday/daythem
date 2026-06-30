import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing, shadow } from '../../theme';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  /** Bỏ padding mặc định (dùng cho thẻ chứa danh sách hàng tự padding). */
  flush?: boolean;
};

export function Card({ children, style, flush }: Props) {
  return (
    <View style={[styles.card, flush && styles.flush, ...(Array.isArray(style) ? style : [style])]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,        // 20 — thống nhất toàn app
    padding: spacing.md,            // 16
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  flush: { padding: 0, overflow: 'hidden' },
});
