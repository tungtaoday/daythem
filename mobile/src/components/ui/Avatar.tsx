import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Solid colors (no gradients — backgroundImage is ignored on native).
// Tone matches the app theme: greens / coral / honey-amber / soft blue-purple-rose.
const PALETTE = [
  '#4f9e6a',  // green
  '#d97742',  // coral
  '#d9a23b',  // honey amber
  '#5d8aa8',  // blue
  '#9b7bb0',  // purple
  '#a85e5e',  // rose
];

function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h * 31) + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return parts[parts.length - 1][0].toUpperCase();
}

type Props = { name: string; size?: number; ring?: string };

export function Avatar({ name, size = 40, ring }: Props) {
  const bg = avatarColor(name);
  return (
    <View style={[
      styles.avatar,
      { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
      ring ? { borderWidth: 2, borderColor: ring } : null,
    ]}>
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#4f9e6a' },
  text: { color: '#fff', fontWeight: '700' },
});
