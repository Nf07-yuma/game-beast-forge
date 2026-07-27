import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useGameStore } from '@/store/gameStore';
import { GACHA_COOLDOWN_MS, GACHA_POOL } from '@/game/gacha';
import { COOLDOWNS } from '@/game/logic';
import { scheduleHatchReminder } from '@/notifications';
import { useNow, formatDuration } from '@/hooks/useNow';
import { PrimaryButton } from '@/components/PrimaryButton';
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

  const remaining = lastGachaAt ? lastGachaAt + GACHA_COOLDOWN_MS - now : 0;

  function handlePull() {
    const result = pullGacha();
    if (!result.ok) {
      Alert.alert('できません', result.message);
      return;
    }
    Alert.alert('ガチャ結果', `${result.message}\nコレクションのタマゴを確認しよう。`);
    if (result.eggId) {
      scheduleHatchReminder(result.eggId, COOLDOWNS.EGG_HATCH_MS).catch(() => {});
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>ガチャ</Text>
        <Text style={styles.subtitle}>
          タマゴが1つ手に入る。基本属性（{commonCount}種）は出やすく、希少なハイブリッド種（{rareCount}種）は出にくい。
        </Text>

        <View style={styles.card}>
          <Text style={styles.emoji}>🎁</Text>
          <PrimaryButton
            label="ガチャを引く"
            subtitle={remaining > 0 ? `あと ${formatDuration(remaining)}` : 'タマゴ1個'}
            onPress={handlePull}
            disabled={remaining > 0}
            style={styles.pullButton}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>出現率</Text>
          <Text style={styles.rateText}>基本属性: 各{commonRatePercent}%</Text>
          <Text style={styles.rateText}>希少種: 各{rareRatePercent}%</Text>
        </View>
      </ScrollView>
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
  emoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  pullButton: {
    width: '100%',
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
