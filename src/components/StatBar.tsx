import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/theme';

interface Props {
  label: string;
  value: number;
  max: number;
  color?: string;
}

export function StatBar({ label, value, max, color = theme.colors.primary }: Props) {
  const ratio = Math.min(1, Math.max(0, value / max));
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, theme.glow(color, 0.6, 8), { width: `${ratio * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    width: 36,
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  track: {
    flex: 1,
    height: 10,
    borderRadius: 6,
    backgroundColor: theme.colors.surfaceAlt,
    marginHorizontal: 8,
  },
  fill: {
    height: '100%',
    borderRadius: 6,
  },
  value: {
    width: 32,
    color: theme.colors.text,
    fontSize: 13,
    textAlign: 'right',
    fontWeight: '600',
  },
});
