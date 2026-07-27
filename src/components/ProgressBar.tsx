import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '@/theme';

interface Props {
  ratio: number;
  color?: string;
  height?: number;
  style?: ViewStyle;
}

export function ProgressBar({ ratio, color = theme.colors.accent, height = 8, style }: Props) {
  const clamped = Math.min(1, Math.max(0, ratio));
  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }, style]}>
      <View
        style={[
          styles.fill,
          theme.glow(color, 0.65, height),
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
  },
  fill: {
    height: '100%',
  },
});
