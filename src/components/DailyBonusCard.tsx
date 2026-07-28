import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useGameStore } from '@/store/gameStore';
import {
  DAILY_BONUS_COOLDOWN_MS,
  canClaimDailyBonus,
  isMilestoneStreak,
  nextDailyBonusStreak,
} from '@/game/dailyBonus';
import { useNow, formatDuration } from '@/hooks/useNow';
import { PrimaryButton } from './PrimaryButton';
import { theme } from '@/theme';

export function DailyBonusCard() {
  const now = useNow();
  const lastDailyBonusAt = useGameStore((s) => s.lastDailyBonusAt);
  const dailyBonusStreak = useGameStore((s) => s.dailyBonusStreak);
  const claimDailyBonus = useGameStore((s) => s.claimDailyBonus);

  const claimable = canClaimDailyBonus(lastDailyBonusAt, now);
  const previewStreak = nextDailyBonusStreak(lastDailyBonusAt, dailyBonusStreak, now);
  const remaining = lastDailyBonusAt ? lastDailyBonusAt + DAILY_BONUS_COOLDOWN_MS - now : 0;

  function handleClaim() {
    const result = claimDailyBonus();
    Alert.alert(result.ok ? 'ログインボーナス' : '受け取れません', result.message);
  }

  return (
    <View style={styles.card}>
      <Text style={styles.emoji}>🎁</Text>
      <View style={styles.info}>
        <Text style={styles.title}>ログインボーナス</Text>
        <PrimaryButton
          label={claimable ? '受け取る' : '受け取り済み'}
          subtitle={
            claimable
              ? isMilestoneStreak(previewStreak)
                ? `${previewStreak}日目・全属性の進化石セット！`
                : `${previewStreak}日連続ログイン中`
              : `連続${dailyBonusStreak}日目・次まであと ${formatDuration(remaining)}`
          }
          onPress={handleClaim}
          disabled={!claimable}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emoji: {
    fontSize: 40,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    color: theme.colors.text,
    fontWeight: '700',
    marginBottom: 8,
  },
});
