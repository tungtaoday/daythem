import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PALETTES = [
  ['#7cc28a', '#4f9e6a'],  // green
  ['#f4a76b', '#d97742'],  // coral
  ['#f0c862', '#d9a23b'],  // honey
  ['#9bbed6', '#5d8aa8'],  // blue
  ['#c9a4d6', '#9b7bb0'],  // purple
  ['#d68d8d', '#a85e5e'],  // rose
];

function avatarPalette(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h * 31) + name.charCodeAt(i)) >>> 0;
  return PALETTES[h % PALETTES.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return parts[parts.length - 1][0].toUpperCase();
}

type Props = { name: string; size?: number; ring?: string };

export function Avatar({ name, size = 40, ring }: Props) {
  const [a, b] = avatarPalette(name);
  return (
    <View style={[
      styles.avatar,
      { width: size, height: size, borderRadius: size / 2 },
      ring ? { borderWidth: 2, borderColor: ring } : null,
      { backgroundImage: `linear-gradient(135deg, ${a}, ${b})` } as any,
    ]}>
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#4f9e6a' },
  text: { color: '#fff', fontWeight: '700' },
});
