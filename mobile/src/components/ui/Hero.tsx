import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, shadow } from '../../theme';

export type HeroStat = { value: string; label: string };
export type HeroVariant = 'green' | 'coral' | 'honey';

type Props = {
  variant?: HeroVariant;
  eyebrow?: string;
  title?: string;
  sub?: string;
  stats?: HeroStat[];
  /** Slot góc phải hàng đầu (vd nút bánh răng). */
  right?: React.ReactNode;
  /** Safe-area top khi hero chạm đỉnh màn (full-bleed). */
  topInset?: number;
  /** Full-bleed: chỉ bo 2 góc dưới, không bóng (hero chạm đỉnh). */
  flushTop?: boolean;
  children?: React.ReactNode;
  style?: ViewStyle;
};

// Mỗi variant: gradient 2 màu (chuyển màu mượt) — dùng expo-linear-gradient nên
// hiện đúng trên cả iOS/Android (không phải CSS web-only).
const V: Record<HeroVariant, { grad: [string, string]; base: string; fg: string; dim: string; panel: string; divider: string }> = {
  green: { grad: ['#55b083', '#2f6849'], base: colors.green600, fg: '#ffffff', dim: 'rgba(255,255,255,0.85)', panel: 'rgba(255,255,255,0.16)', divider: 'rgba(255,255,255,0.24)' },
  coral: { grad: ['#ec8b73', '#c2593f'], base: colors.coral500, fg: '#ffffff', dim: 'rgba(255,255,255,0.88)', panel: 'rgba(255,255,255,0.18)', divider: 'rgba(255,255,255,0.26)' },
  honey: { grad: ['#fef1d2', '#f7e1ab'], base: colors.honey100, fg: colors.honey700, dim: 'rgba(94,71,21,0.72)', panel: 'rgba(255,255,255,0.5)', divider: 'rgba(94,71,21,0.18)' },
};

export function Hero({ variant = 'green', eyebrow, title, sub, stats, right, topInset = 0, flushTop, children, style }: Props) {
  const c = V[variant];
  return (
    <LinearGradient
      colors={c.grad}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        s.hero,
        { backgroundColor: c.base },
        flushTop
          ? { paddingTop: topInset + 14, borderTopLeftRadius: 0, borderTopRightRadius: 0 }
          : shadow.hero,
        style,
      ]}
    >
      {(eyebrow || right) && (
        <View style={s.topRow}>
          {eyebrow ? <Text style={[s.eyebrow, { color: c.dim }]} numberOfLines={1}>{eyebrow}</Text> : <View style={{ flex: 1 }} />}
          {right}
        </View>
      )}
      {title ? <Text style={[s.title, { color: c.fg }]}>{title}</Text> : null}
      {sub ? <Text style={[s.sub, { color: c.dim }]}>{sub}</Text> : null}

      {stats && stats.length > 0 && (
        <View style={[s.statRow, { backgroundColor: c.panel }]}>
          {stats.map((st, i) => (
            <React.Fragment key={st.label}>
              {i > 0 && <View style={[s.statDivider, { backgroundColor: c.divider }]} />}
              <View style={s.stat}>
                <Text style={[s.statVal, { color: c.fg }]}>{st.value}</Text>
                <Text style={[s.statLabel, { color: c.dim }]}>{st.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      )}

      {children}
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  hero: { padding: spacing.lg, borderRadius: radius.xl },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 10 },
  eyebrow: { flex: 1, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
  sub: { fontSize: 14, marginTop: 4 },
  statRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18, borderRadius: radius.md, paddingVertical: 12 },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, alignSelf: 'stretch', marginVertical: 4 },
});
