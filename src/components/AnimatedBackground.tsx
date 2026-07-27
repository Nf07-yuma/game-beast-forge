import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { theme } from '@/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface OrbConfig {
  color: string;
  size: number;
  left: number;
  top: number;
  rangeX: number;
  rangeY: number;
  duration: number;
}

const ORBS: OrbConfig[] = [
  { color: theme.colors.primary, size: 260, left: -70, top: -50, rangeX: 40, rangeY: 55, duration: 9000 },
  { color: theme.colors.neonCyan, size: 220, left: SCREEN_W - 150, top: SCREEN_H * 0.32, rangeX: -50, rangeY: 45, duration: 11500 },
  { color: theme.colors.neonPink, size: 240, left: SCREEN_W * 0.1, top: SCREEN_H * 0.72, rangeX: 55, rangeY: -45, duration: 13000 },
];

const STAR_COUNT = 8;
const STARS = Array.from({ length: STAR_COUNT }, (_, i) => ({
  left: (SCREEN_W / STAR_COUNT) * i + ((i * 37) % 40),
  top: 60 + ((i * 173) % (SCREEN_H - 160)),
  delay: (i * 250) % 2000,
  duration: 1800 + (i % 3) * 500,
}));

function FloatingOrb({ orb }: { orb: OrbConfig }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: orb.duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: orb.duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [progress, orb.duration]);

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, orb.rangeX] });
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, orb.rangeY] });
  const outerSize = orb.size * 1.6;

  return (
    <Animated.View
      style={[
        styles.orbWrap,
        {
          width: outerSize,
          height: outerSize,
          left: orb.left,
          top: orb.top,
          transform: [{ translateX }, { translateY }],
        },
      ]}
    >
      <View
        style={[
          styles.orbLayer,
          { width: outerSize, height: outerSize, borderRadius: outerSize / 2, backgroundColor: orb.color, opacity: 0.05 },
        ]}
      />
      <View
        style={[
          styles.orbLayer,
          {
            width: orb.size * 1.2,
            height: orb.size * 1.2,
            borderRadius: (orb.size * 1.2) / 2,
            backgroundColor: orb.color,
            opacity: 0.09,
          },
        ]}
      />
      <View
        style={[
          styles.orbLayer,
          { width: orb.size, height: orb.size, borderRadius: orb.size / 2, backgroundColor: orb.color, opacity: 0.16 },
        ]}
      />
    </Animated.View>
  );
}

function TwinkleStar({ star }: { star: (typeof STARS)[number] }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: star.duration, delay: star.delay, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.15, duration: star.duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, star.delay, star.duration]);

  return (
    <Animated.View style={[styles.star, { left: star.left, top: star.top, opacity }]} />
  );
}

export function AnimatedBackground() {
  return (
    <View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="none">
      {ORBS.map((orb, i) => (
        <FloatingOrb key={i} orb={orb} />
      ))}
      {STARS.map((star, i) => (
        <TwinkleStar key={i} star={star} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    overflow: 'hidden',
  },
  orbWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbLayer: {
    position: 'absolute',
  },
  star: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: theme.colors.neonCyan,
  },
});
