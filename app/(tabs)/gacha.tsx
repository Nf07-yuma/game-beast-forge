import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Animated, Easing, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore } from '@/store/gameStore';
import { GACHA_COOLDOWN_MS, GACHA_POOL } from '@/game/gacha';
import { COOLDOWNS } from '@/game/logic';
import { scheduleHatchReminder } from '@/notifications';
import { useNow, formatDuration } from '@/hooks/useNow';
import { GachaReveal } from '@/components/GachaReveal';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { theme } from '@/theme';

const totalWeight = GACHA_POOL.reduce((sum, entry) => sum + entry.weight, 0);
const commonCount = GACHA_POOL.filter((entry) => !entry.rare).length;
const rareCount = GACHA_POOL.filter((entry) => entry.rare).length;
const commonRatePercent = Math.round((GACHA_POOL.find((e) => !e.rare)!.weight / totalWeight) * 1000) / 10;
const rareRatePercent = Math.round((GACHA_POOL.find((e) => e.rare)!.weight / totalWeight) * 1000) / 10;

export default function GachaScreen() {
  const now = useNow();
  const lastGachaAt = useGameStore((s) => s.lastGachaAt);
  const pullGacha = useGameStore((s) => s.pullGacha);
  const [reveal, setReveal] = useState<{ rare: boolean; message: string } | null>(null);
  const pulse = useRef(new Animated.Value(0)).current;

  const remaining = lastGachaAt ? lastGachaAt + GACHA_COOLDOWN_MS - now : 0;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });

  function handlePull() {
    const result = pullGacha();
    if (!result.ok) {
      Alert.alert('できません', result.message);
      return;
    }
    setReveal({ rare: result.rare ?? false, message: result.message });
    if (result.eggId) {
      scheduleHatchReminder(result.eggId, COOLDOWNS.EGG_HATCH_MS).catch(() => {});
    }
  }

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>ガチャ</Text>
        <Text style={styles.subtitle}>
          タマゴが1つ手に入る。基本属性（{commonCount}種）は出やすく、希少なハイブリッド種（{rareCount}種）は出にくい。
        </Text>

        <View style={styles.card}>
          <Animated.View
            style={[
              styles.capsuleWrap,
              theme.glow(theme.colors.primary, 0.6, 16),
              { transform: [{ scale: pulseScale }] },
            ]}
          >
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryMuted]}
              style={styles.capsuleGradient}
            >
              <Text style={styles.emoji}>🎁</Text>
            </LinearGradient>
          </Animated.View>
          <Pressable
            onPress={handlePull}
            disabled={remaining > 0}
            style={({ pressed }) => [
              styles.pullButtonWrap,
              remaining === 0 && theme.glow(theme.colors.accent, 0.55, 10),
              pressed && !remaining && styles.pullButtonPressed,
            ]}
          >
            <LinearGradient
              colors={remaining > 0 ? [theme.colors.surfaceAlt, theme.colors.surface] : [theme.colors.accent, '#C98A1F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.pullButton}
            >
              <Text style={[styles.pullLabel, remaining > 0 && styles.pullLabelDisabled]}>ガチャを引く</Text>
              <Text style={[styles.pullSubtitle, remaining > 0 && styles.pullLabelDisabled]}>
                {remaining > 0 ? `あと ${formatDuration(remaining)}` : 'タマゴ1個'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>出現率</Text>
          <Text style={styles.rateText}>基本属性: 各{commonRatePercent}%</Text>
          <Text style={styles.rateText}>希少種: 各{rareRatePercent}%</Text>
        </View>
      </ScrollView>

      <GachaReveal
        visible={reveal !== null}
        rare={reveal?.rare ?? false}
        message={reveal?.message ?? ''}
        onClaim={() => setReveal(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  capsuleWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 20,
  },
  capsuleGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 48,
  },
  pullButtonWrap: {
    width: '100%',
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  pullButtonPressed: {
    opacity: 0.85,
  },
  pullButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pullLabel: {
    color: '#3A2A00',
    fontSize: 15,
    fontWeight: '800',
  },
  pullSubtitle: {
    color: '#3A2A00',
    fontSize: 11,
    opacity: 0.75,
    marginTop: 2,
  },
  pullLabelDisabled: {
    color: theme.colors.textMuted,
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  rateText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
});
