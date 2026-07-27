import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { theme } from '@/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface BandConfig {
  color: string;
  top: number;
  height: number;
  duration: number;
  swing: number;
}

const BANDS: BandConfig[] = [
  { color: theme.colors.primary, top: -SCREEN_H * 0.06, height: SCREEN_H * 0.34, duration: 9000, swing: 9 },
  { color: theme.colors.neonCyan, top: SCREEN_H * 0.36, height: SCREEN_H * 0.3, duration: 12000, swing: -7 },
  { color: theme.colors.neonPink, top: SCREEN_H * 0.68, height: SCREEN_H * 0.32, duration: 10500, swing: 8 },
];

function Band({ band }: { band: BandConfig }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, { toValue: 1, duration: band.duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(progress, { toValue: 0, duration: band.duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [progress, band.duration]);

  const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${band.swing}deg`] });
  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [-SCREEN_W * 0.08, SCREEN_W * 0.08] });

  const layers = [
    { scale: 1, opacity: 0.1 },
    { scale: 0.62, opacity: 0.18 },
    { scale: 0.3, opacity: 0.3 },
  ];

  return (
    <Animated.View
      style={[
        styles.bandWrap,
        {
          top: band.top,
          height: band.height,
          transform: [{ translateX }, { rotate }],
        },
      ]}
    >
      {layers.map((layer, i) => {
        const h = band.height * layer.scale;
        return (
          <View
            key={i}
            style={[
              styles.bandLayer,
              {
                top: (band.height - h) / 2,
                height: h,
                borderRadius: h / 2,
                backgroundColor: band.color,
                opacity: layer.opacity,
              },
            ]}
          />
        );
      })}
    </Animated.View>
  );
}

export function AuroraBackground() {
  return (
    <View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="none">
      {BANDS.map((band, i) => (
        <Band key={i} band={band} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    overflow: 'hidden',
  },
  bandWrap: {
    position: 'absolute',
    left: -SCREEN_W * 0.3,
    width: SCREEN_W * 1.6,
  },
  bandLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
