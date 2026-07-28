import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useGameStore } from '@/store/gameStore';
import { getSpecies } from '@/data/species';
import { canBattle } from '@/game/battle';
import { useNow } from '@/hooks/useNow';
import { MonsterCard } from '@/components/MonsterCard';
import { MonsterListControls } from '@/components/MonsterListControls';
import { PrimaryButton } from '@/components/PrimaryButton';
import { MonsterAvatar } from '@/components/MonsterAvatar';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { filterMonstersByElement, sortMonsters } from '@/game/monsterList';
import { ElementType } from '@/types';
import { theme } from '@/theme';

export default function BattleScreen() {
  const router = useRouter();
  const monsters = useGameStore((s) => s.monsters);
  const battleMonsters = useGameStore((s) => s.battleMonsters);
  const now = useNow();
  const [selected, setSelected] = useState<string[]>([]);
  const sortKey = useGameStore((s) => s.monsterSortKey);
  const setSortKey = useGameStore((s) => s.setMonsterSortKey);
  const [elementFilter, setElementFilter] = useState<ElementType[]>([]);

  const allMonsters = useMemo(() => Object.values(monsters), [monsters]);
  const monsterList = useMemo(
    () => sortMonsters(filterMonstersByElement(allMonsters, elementFilter), sortKey),
    [allMonsters, elementFilter, sortKey]
  );

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  }

  function handleBattle() {
    if (selected.length !== 2) return;
    const result = battleMonsters(selected[0], selected[1]);
    if (!result.ok) {
      Alert.alert('たたかえません', result.message);
      return;
    }
    setSelected([]);
    router.push('/battle/result');
  }

  const fighterA = selected[0] ? monsters[selected[0]] : null;
  const fighterB = selected[1] ? monsters[selected[1]] : null;

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>2匹選んでバトルしよう</Text>
        <Text style={styles.subtitle}>クールダウン中でないモンスター同士で対戦できます</Text>

        {(fighterA || fighterB) && (
          <View style={styles.previewCard}>
            <View style={styles.previewRow}>
              <View style={styles.previewSlot}>
                {fighterA ? (
                  <MonsterAvatar species={getSpecies(fighterA.speciesId)} size={56} />
                ) : (
                  <View style={styles.emptySlot}>
                    <Text style={styles.emptySlotText}>?</Text>
                  </View>
                )}
              </View>
              <Text style={styles.plus}>⚔️</Text>
              <View style={styles.previewSlot}>
                {fighterB ? (
                  <MonsterAvatar species={getSpecies(fighterB.speciesId)} size={56} />
                ) : (
                  <View style={styles.emptySlot}>
                    <Text style={styles.emptySlotText}>?</Text>
                  </View>
                )}
              </View>
            </View>
            <PrimaryButton
              label="たたかう"
              onPress={handleBattle}
              disabled={!(fighterA && fighterB)}
              style={styles.battleButton}
            />
          </View>
        )}

        <Text style={styles.sectionTitle}>モンスターを選択</Text>
        {allMonsters.length === 0 ? (
          <Text style={styles.empty}>モンスターがいません</Text>
        ) : (
          <>
            <MonsterListControls
              sortKey={sortKey}
              onChangeSort={setSortKey}
              elementFilter={elementFilter}
              onChangeElementFilter={setElementFilter}
            />
            {monsterList.length === 0 ? (
              <Text style={styles.empty}>該当するモンスターがいません</Text>
            ) : (
              <View style={styles.grid}>
                {monsterList.map((monster) => {
                  const check = canBattle(monster, now);
                  const isSelected = selected.includes(monster.id);
                  return (
                    <MonsterCard
                      key={monster.id}
                      monster={monster}
                      selected={isSelected}
                      disabled={!check.ok && !isSelected}
                      disabledReason={check.reason}
                      onPress={() => toggle(monster.id)}
                    />
                  );
                })}
              </View>
            )}
          </>
        )}
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
    ...theme.textShadow(),
    fontSize: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    color: theme.colors.textMuted,
    ...theme.textShadow(),
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  empty: {
    color: theme.colors.textMuted,
    ...theme.textShadow(),
    fontSize: 13,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  previewCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewSlot: {
    alignItems: 'center',
    marginHorizontal: 12,
  },
  emptySlot: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlotText: {
    color: theme.colors.textMuted,
    ...theme.textShadow(),
    fontSize: 20,
  },
  plus: {
    fontSize: 20,
  },
  battleButton: {
    marginTop: 14,
  },
});
