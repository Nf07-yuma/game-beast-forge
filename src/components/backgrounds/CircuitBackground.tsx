import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { theme } from '@/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CELL = 34;

const COLS = Math.ceil(SCREEN_W / CELL) + 1;
const ROWS = Math.ceil(SCREEN_H / CELL) + 1;

const NODES = [
  { col: 2, row: 3, delay: 0 },
  { col: 6, row: 2, delay: 500 },
  { col: 3, row: 7, delay: 1100 },
  { col: 8, row: 9, delay: 300 },
  { col: 5, row: 12, delay: 900 },
  { col: 1, row: 15, delay: 1500 },
  { col: 7, row: 17, delay: 700 },
].filter((n) => n.col <= COLS && n.row <= ROWS);

function TravelingPulse({
  axis,
  offset,
  color,
  duration,
  delay,
}: {
  axis: 'horizontal' | 'vertical';
  offset: number;
  color: string;
  duration: number;
  delay: number;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(progress, {
          toValue: 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(progress, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [progress, duration, delay]);

  const travel = axis === 'horizontal' ? SCREEN_W + 80 : SCREEN_H + 80;
  const translate = progress.interpolate({ inputRange: [0, 1], outputRange: [-80, travel - 80] });
  const opacity = progress.interpolate({
    inputRange: [0, 0.08, 0.85, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <Animated.View
      style={[
        axis === 'horizontal' ? styles.pulseH : styles.pulseV,
        {
          backgroundColor: color,
          shadowColor: color,
          [axis === 'horizontal' ? 'top' : 'left']: offset,
          opacity,
          transform: axis === 'horizontal' ? [{ translateX: translate }] : [{ translateY: translate }],
        },
      ]}
    />
  );
}

function PulseNode({ left, top, delay }: { left: number; top: number; delay: number }) {
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1300, delay, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [glow, delay]);

  const scale = glow.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.6] });
  const opacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  return (
    <Animated.View
      style={[styles.node, { left: left - 4, top: top - 4, opacity, transform: [{ scale }] }]}
    />
  );
}

export function CircuitBackground() {
  return (
    <View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="none">
      {Array.from({ length: COLS }, (_, i) => (
        <View key={`v${i}`} style={[styles.vLine, { left: i * CELL }]} />
      ))}
      {Array.from({ length: ROWS }, (_, i) => (
        <View key={`h${i}`} style={[styles.hLine, { top: i * CELL }]} />
      ))}
      {NODES.map((n, i) => (
        <PulseNode key={i} left={n.col * CELL} top={n.row * CELL} delay={n.delay} />
      ))}
      <TravelingPulse axis="horizontal" offset={SCREEN_H * 0.22} color={theme.colors.neonPink} duration={4200} delay={0} />
      <TravelingPulse axis="horizontal" offset={SCREEN_H * 0.68} color={theme.colors.neonCyan} duration={5200} delay={1600} />
      <TravelingPulse axis="vertical" offset={SCREEN_W * 0.75} color={theme.colors.primary} duration={5600} delay={800} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    overflow: 'hidden',
  },
  vLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: theme.colors.border,
    opacity: 0.35,
  },
  hLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: theme.colors.border,
    opacity: 0.35,
  },
  node: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.neonCyan,
    shadowColor: theme.colors.neonCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4,
  },
  pulseH: {
    position: 'absolute',
    width: 70,
    height: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 3,
  },
  pulseV: {
    position: 'absolute',
    width: 2,
    height: 70,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 3,
  },
});
