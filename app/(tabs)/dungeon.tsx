import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useGameStore } from '@/store/gameStore';
import { DUNGEONS } from '@/data/dungeons';
import { ITEMS } from '@/data/items';
import { canExplore } from '@/game/dungeon';
import { useNow } from '@/hooks/useNow';
import { MonsterCard } from '@/components/MonsterCard';
import { MonsterListControls } from '@/components/MonsterListControls';
import { PrimaryButton } from '@/components/PrimaryButton';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { filterMonstersByElement, sortMonsters } from '@/game/monsterList';
import { ElementType } from '@/types';
import { theme } from '@/theme';

export default function DungeonScreen() {
  const monsters = useGameStore((s) => s.monsters);
  const items = useGameStore((s) => s.items);
  const exploreDungeon = useGameStore((s) => s.exploreDungeon);
  const now = useNow();
  const [selectedDungeon, setSelectedDungeon] = useState<string | null>(null);
  const [selectedMonster, setSelectedMonster] = useState<string | null>(null);
  const sortKey = useGameStore((s) => s.monsterSortKey);
  const setSortKey = useGameStore((s) => s.setMonsterSortKey);
  const [elementFilter, setElementFilter] = useState<ElementType[]>([]);

  const allMonsters = useMemo(() => Object.values(monsters), [monsters]);
  const monsterList = useMemo(
    () => sortMonsters(filterMonstersByElement(allMonsters, elementFilter), sortKey),
    [allMonsters, elementFilter, sortKey]
  );

  function handleExplore() {
    if (!selectedDungeon || !selectedMonster) return;
    const result = exploreDungeon(selectedMonster, selectedDungeon);
    Alert.alert(result.ok ? '探索結果' : 'できません', result.message);
    if (result.ok) {
      setSelectedMonster(null);
    }
  }

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>ダンジョン</Text>
        <Text style={styles.subtitle}>
          モンスターを1匹選んで探索に送り出そう。属性に対応した進化石が手に入ることがある。
        </Text>

        <Text style={styles.sectionTitle}>ダンジョンを選択</Text>
        {Object.values(DUNGEONS).map((dungeon) => {
          const dropItem = ITEMS[dungeon.dropItemId];
          const selected = selectedDungeon === dungeon.id;
          return (
            <Pressable
              key={dungeon.id}
              style={[styles.dungeonCard, selected && styles.dungeonCardSelected]}
              onPress={() => setSelectedDungeon(dungeon.id)}
            >
              <Text style={styles.dungeonEmoji}>{dungeon.emoji}</Text>
              <View style={styles.dungeonInfo}>
                <Text style={styles.dungeonName}>{dungeon.name}</Text>
                <Text style={styles.dungeonDesc}>{dungeon.description}</Text>
                <Text style={styles.dungeonDrop}>
                  ドロップ: {dropItem.emoji} {dropItem.name}（所持: {items[dropItem.id] ?? 0}個）
                </Text>
              </View>
            </Pressable>
          );
        })}

        <Text style={styles.sectionTitle}>探索するモンスターを選択</Text>
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
                  const check = canExplore(monster, now);
                  return (
                    <MonsterCard
                      key={monster.id}
                      monster={monster}
                      selected={selectedMonster === monster.id}
                      disabled={!check.ok}
                      disabledReason={check.reason}
                      onPress={() => setSelectedMonster(monster.id)}
                    />
                  );
                })}
              </View>
            )}
          </>
        )}

        <PrimaryButton
          label="探索する"
          onPress={handleExplore}
          disabled={!selectedDungeon || !selectedMonster}
          style={styles.exploreButton}
        />
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
    lineHeight: 18,
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
  dungeonCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dungeonCardSelected: {
    borderColor: theme.colors.primary,
  },
  dungeonEmoji: {
    fontSize: 36,
    marginRight: 12,
  },
  dungeonInfo: {
    flex: 1,
  },
  dungeonName: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  dungeonDesc: {
    color: theme.colors.textMuted,
    ...theme.textShadow(),
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 4,
  },
  dungeonDrop: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: '600',
  },
  exploreButton: {
    marginTop: 14,
  },
});
