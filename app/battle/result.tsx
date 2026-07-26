import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useGameStore } from '@/store/gameStore';
import { getSpecies } from '@/data/species';
import { BATTLE_LOSE_AFFECTION, BATTLE_LOSE_EXP, BATTLE_WIN_AFFECTION, BATTLE_WIN_EXP } from '@/game/battle';
import { MonsterAvatar } from '@/components/MonsterAvatar';
import { ProgressBar } from '@/components/ProgressBar';
import { PrimaryButton } from '@/components/PrimaryButton';
import { theme } from '@/theme';

export default function BattleResultScreen() {
  const router = useRouter();
  const battle = useGameStore((s) => s.lastBattle);
  const monsters = useGameStore((s) => s.monsters);

  if (!battle) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>バトル結果が見つかりませんでした</Text>
      </View>
    );
  }

  const fighterA = monsters[battle.monsterAId];
  const fighterB = monsters[battle.monsterBId];

  if (!fighterA || !fighterB) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>バトル結果が見つかりませんでした</Text>
      </View>
    );
  }

  function finalHp(id: string): number {
    for (let i = battle!.turns.length - 1; i >= 0; i--) {
      if (battle!.turns[i].defenderId === id) return battle!.turns[i].defenderHpRemaining;
    }
    return battle!.maxHpById[id];
  }

  const winner = monsters[battle.winnerId];
  const loser = monsters[battle.loserId];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.resultBanner}>🏆 {winner.nickname} の勝利！</Text>

      <View style={styles.vsRow}>
        {[fighterA, fighterB].map((fighter) => {
          const species = getSpecies(fighter.speciesId);
          const hp = finalHp(fighter.id);
          const maxHp = battle.maxHpById[fighter.id];
          const isWinner = fighter.id === battle.winnerId;
          return (
            <View key={fighter.id} style={styles.fighterCard}>
              <MonsterAvatar species={species} size={64} />
              <Text style={styles.fighterName} numberOfLines={1}>
                {fighter.nickname}
              </Text>
              <Text style={isWinner ? styles.winnerLabel : styles.loserLabel}>
                {isWinner ? '勝利' : '敗北'}
              </Text>
              <View style={styles.hpRow}>
                <Text style={styles.hpText}>
                  HP {hp} / {maxHp}
                </Text>
              </View>
              <ProgressBar
                ratio={hp / maxHp}
                color={hp > 0 ? theme.colors.success : theme.colors.danger}
                height={8}
              />
            </View>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>報酬</Text>
        <Text style={styles.rewardText}>
          🏆 {winner.nickname}: +{BATTLE_WIN_EXP} EXP ・ なつき度 +{BATTLE_WIN_AFFECTION}
        </Text>
        <Text style={styles.rewardText}>
          🥈 {loser.nickname}: +{BATTLE_LOSE_EXP} EXP ・ なつき度 +{BATTLE_LOSE_AFFECTION}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>バトルログ（全{battle.turns.length}ターン）</Text>
        {battle.turns.map((turn) => {
          const attacker = monsters[turn.attackerId];
          const defender = monsters[turn.defenderId];
          return (
            <Text key={turn.turn} style={styles.logLine}>
              ターン{turn.turn}: {attacker?.nickname ?? '???'} の攻撃 → {turn.damage} ダメージ
              （{defender?.nickname ?? '???'} 残りHP {turn.defenderHpRemaining}）
            </Text>
          );
        })}
      </View>

      <PrimaryButton
        label="コレクションへ戻る"
        onPress={() => router.replace('/')}
        style={styles.backButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 48,
  },
  notFound: {
    color: theme.colors.textMuted,
    padding: 20,
  },
  resultBanner: {
    color: theme.colors.accent,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
  },
  vsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  fighterCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  fighterName: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  winnerLabel: {
    color: theme.colors.success,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
    marginBottom: 8,
  },
  loserLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
    marginBottom: 8,
  },
  hpRow: {
    width: '100%',
    marginBottom: 4,
  },
  hpText: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  rewardText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginBottom: 6,
  },
  logLine: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginBottom: 6,
    lineHeight: 17,
  },
  backButton: {
    marginTop: 8,
  },
});
