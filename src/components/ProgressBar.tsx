import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '@/theme';

interface Props {
  ratio: number;
  color?: string;
  height?: number;
}

export function ProgressBar({ ratio, color = theme.colors.accent, height = 8 }: Props) {
  const clamped = Math.min(1, Math.max(0, ratio));
  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <View
        style={[
          styles.fill,
          { width: `${clamped * 100}%`, backgroundColor: color, borderRadius: height / 2 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: theme.colors.surfaceAlt,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
