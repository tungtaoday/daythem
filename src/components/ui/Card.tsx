import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

type Props = { children: React.ReactNode; style?: ViewStyle | ViewStyle[] };

export function Card({ children, style }: Props) {
  return <View style={[styles.card, ...(Array.isArray(style) ? style : [style])]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eeece6',
    shadowColor: 'rgba(40,30,20,1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
});
