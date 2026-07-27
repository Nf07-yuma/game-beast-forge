import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { theme } from '@/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const EMBER_COLORS = [theme.colors.accent, theme.colors.neonPink, theme.colors.neonCyan];
const EMBER_COUNT = 16;

const EMBERS = Array.from({ length: EMBER_COUNT }, (_, i) => ({
  left: (((i * 61) % 100) / 100) * SCREEN_W,
  size: 3 + (i % 4),
  color: EMBER_COLORS[i % EMBER_COLORS.length],
  duration: 5500 + (i % 5) * 700,
  delay: (i * 480) % 6000,
}));

function SoftBlob({ size, left, top, color }: { size: number; left: number; top: number; color: string }) {
  const layers = [
    { scale: 1, opacity: 0.06 },
    { scale: 0.66, opacity: 0.11 },
    { scale: 0.36, opacity: 0.2 },
  ];
  return (
    <View style={[styles.blobWrap, { width: size, height: size, left, top }]}>
      {layers.map((layer, i) => {
        const s = size * layer.scale;
        return (
          <View
            key={i}
            style={[
              styles.blobLayer,
              { width: s, height: s, borderRadius: s / 2, backgroundColor: color, opacity: layer.opacity },
            ]}
          />
        );
      })}
    </View>
  );
}

function Ember({ ember }: { ember: (typeof EMBERS)[number] }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: ember.duration,
        delay: ember.delay,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [progress, ember.duration, ember.delay]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -SCREEN_H * 0.75] });
  const opacity = progress.interpolate({
    inputRange: [0, 0.1, 0.85, 1],
    outputRange: [0, 1, 0.9, 0],
  });
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.5] });

  return (
    <Animated.View
      style={[
        styles.ember,
        {
          left: ember.left,
          width: ember.size,
          height: ember.size,
          borderRadius: ember.size / 2,
          backgroundColor: ember.color,
          shadowColor: ember.color,
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    />
  );
}

export function EmberBackground() {
  return (
    <View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="none">
      <SoftBlob size={SCREEN_W * 0.9} left={-SCREEN_W * 0.35} top={SCREEN_H * 0.02} color={theme.colors.primaryMuted} />
      <SoftBlob size={SCREEN_W * 0.95} left={SCREEN_W * 0.35} top={SCREEN_H * 0.62} color={theme.colors.neonPink} />
      {EMBERS.map((ember, i) => (
        <Ember key={i} ember={ember} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    overflow: 'hidden',
  },
  blobWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blobLayer: {
    position: 'absolute',
  },
  ember: {
    position: 'absolute',
    bottom: -10,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
    elevation: 3,
  },
});
