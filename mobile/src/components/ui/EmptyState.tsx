import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../theme';

type Props = {
  icon?: string;            // emoji
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
  /** Smaller variant for inline/section empties */
  compact?: boolean;
};

/** Friendly, consistent empty state with an optional call-to-action. */
export function EmptyState({ icon = '🌱', title, subtitle, ctaLabel, onCta, compact }: Props) {
  return (
    <View style={[s.wrap, compact && s.wrapCompact]}>
      <Text style={[s.icon, compact && { fontSize: 36 }]}>{icon}</Text>
      <Text style={s.title}>{title}</Text>
      {subtitle ? <Text style={s.sub}>{subtitle}</Text> : null}
      {ctaLabel && onCta ? (
        <TouchableOpacity style={s.cta} onPress={onCta} activeOpacity={0.85}>
          <Text style={s.ctaText}>{ctaLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 28 },
  wrapCompact: { paddingVertical: 28 },
  icon: { fontSize: 48, marginBottom: 14 },
  title: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginBottom: 6 },
  sub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 18 },
  cta: { backgroundColor: colors.green500, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center' },
  ctaText: { color: 'white', fontSize: 15, fontWeight: '700' },
});
