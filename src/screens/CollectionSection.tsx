import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useGameStore } from '@/store/gameStore';
import { MonsterCard } from '@/components/MonsterCard';
import { MonsterListControls } from '@/components/MonsterListControls';
import { EggCard } from '@/components/EggCard';
import { filterMonstersByElement, sortMonsters } from '@/game/monsterList';
import { ElementType } from '@/types';
import { theme } from '@/theme';

export function CollectionSection() {
  const router = useRouter();
  const monsters = useGameStore((s) => s.monsters);
  const eggs = useGameStore((s) => s.eggs);
  const sortKey = useGameStore((s) => s.monsterSortKey);
  const setSortKey = useGameStore((s) => s.setMonsterSortKey);
  const [elementFilter, setElementFilter] = useState<ElementType[]>([]);

  const allMonsters = useMemo(() => Object.values(monsters), [monsters]);
  const monsterList = useMemo(
    () => sortMonsters(filterMonstersByElement(allMonsters, elementFilter), sortKey),
    [allMonsters, elementFilter, sortKey]
  );
  const eggList = Object.values(eggs).sort((a, b) => a.hatchAt - b.hatchAt);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {eggList.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>タマゴ</Text>
            {eggList.map((egg) => (
              <EggCard key={egg.id} egg={egg} onPress={() => router.push(`/egg/${egg.id}`)} />
            ))}
          </>
        ) : null}
        <Text style={styles.sectionTitle}>モンスター（{monsterList.length}）</Text>
        {allMonsters.length > 0 ? (
          <MonsterListControls
            sortKey={sortKey}
            onChangeSort={setSortKey}
            elementFilter={elementFilter}
            onChangeElementFilter={setElementFilter}
          />
        ) : null}
        {allMonsters.length > 0 && monsterList.length === 0 ? (
          <Text style={styles.empty}>該当するモンスターがいません</Text>
        ) : (
          <View style={styles.grid}>
            {monsterList.map((monster) => (
              <MonsterCard
                key={monster.id}
                monster={monster}
                onPress={() => router.push(`/monster/${monster.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
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
});
