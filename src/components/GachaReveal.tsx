import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PrimaryButton } from './PrimaryButton';
import { theme } from '@/theme';

interface Props {
  visible: boolean;
  rare: boolean;
  message: string;
  onClaim: () => void;
}

const SPARKLE_COUNT = 8;
const SPARKLE_RADIUS = 92;
const SPARKLE_POSITIONS = Array.from({ length: SPARKLE_COUNT }, (_, i) => {
  const angle = (i / SPARKLE_COUNT) * Math.PI * 2;
  return { dx: Math.cos(angle) * SPARKLE_RADIUS, dy: Math.sin(angle) * SPARKLE_RADIUS };
});

export function GachaReveal({ visible, rare, message, onClaim }: Props) {
  const [stage, setStage] = useState<'rolling' | 'result'>('rolling');
  const shake = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const revealScale = useRef(new Animated.Value(0)).current;
  const revealOpacity = useRef(new Animated.Value(0)).current;
  const sparkles = useRef(SPARKLE_POSITIONS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!visible) return;
    setStage('rolling');
    shake.setValue(0);
    flash.setValue(0);
    revealScale.setValue(0);
    revealOpacity.setValue(0);
    sparkles.forEach((v) => v.setValue(0));

    Animated.sequence([
      Animated.sequence(
        [-1, 1, -1, 1, -0.6, 0.6, 0].map((toValue, i) =>
          Animated.timing(shake, {
            toValue,
            duration: i < 4 ? 60 : 50,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        )
      ),
      Animated.timing(flash, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStage('result');
      Animated.parallel([
        Animated.spring(revealScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
        Animated.timing(revealOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        ...(rare
          ? [
              Animated.stagger(
                55,
                sparkles.map((v) =>
                  Animated.timing(v, {
                    toValue: 1,
                    duration: 550,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                  })
                )
              ),
            ]
          : []),
      ]).start();
    });
  }, [visible, rare]);

  const shakeRotate = shake.interpolate({ inputRange: [-1, 1], outputRange: ['-12deg', '12deg'] });
  const flashScale = flash.interpolate({ inputRange: [0, 1], outputRange: [0.3, 2.6] });
  const flashOpacity = flash.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0] });

  const gradientColors = rare
    ? (['#F5C93B', '#C98A1F'] as const)
    : (['#4B4390', '#242B47'] as const);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.stage}>
          {stage === 'rolling' ? (
            <>
              <Animated.View style={[styles.flashCircle, { transform: [{ scale: flashScale }], opacity: flashOpacity }]} />
              <Animated.View style={[styles.capsule, { transform: [{ rotate: shakeRotate }] }]}>
                <LinearGradient colors={gradientColors} style={styles.capsuleGradient}>
                  <Text style={styles.capsuleEmoji}>🎁</Text>
                </LinearGradient>
              </Animated.View>
            </>
          ) : (
            <Animated.View style={[styles.resultWrap, { opacity: revealOpacity, transform: [{ scale: revealScale }] }]}>
              {rare
                ? sparkles.map((v, i) => {
                    const { dx, dy } = SPARKLE_POSITIONS[i];
                    const translateX = v.interpolate({ inputRange: [0, 1], outputRange: [0, dx] });
                    const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [0, dy] });
                    const opacity = v.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 0.4] });
                    return (
                      <Animated.Text
                        key={i}
                        style={[
                          styles.sparkle,
                          { opacity, transform: [{ translateX }, { translateY }] },
                        ]}
                      >
                        ✨
                      </Animated.Text>
                    );
                  })
                : null}
              <LinearGradient colors={gradientColors} style={styles.resultCircle}>
                <Text style={styles.resultEmoji}>🥚</Text>
              </LinearGradient>
              {rare ? (
                <View style={styles.rareBadge}>
                  <Text style={styles.rareBadgeText}>★ レア</Text>
                </View>
              ) : null}
              <Text style={styles.message}>{message}</Text>
              <PrimaryButton label="受け取る" onPress={onClaim} style={styles.claimButton} />
            </Animated.View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 8, 18, 0.86)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    width: 260,
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFFFFF',
  },
  capsule: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  capsuleGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capsuleEmoji: {
    fontSize: 56,
  },
  resultWrap: {
    alignItems: 'center',
  },
  sparkle: {
    position: 'absolute',
    top: 44,
    left: 44,
    fontSize: 20,
  },
  resultCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  resultEmoji: {
    fontSize: 52,
  },
  rareBadge: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 10,
  },
  rareBadgeText: {
    color: '#3A2A00',
    fontSize: 12,
    fontWeight: '800',
  },
  message: {
    color: theme.colors.text,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
    paddingHorizontal: 12,
  },
  claimButton: {
    minWidth: 160,
  },
});
