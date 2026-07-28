import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useGameStore } from '@/store/gameStore';
import { MonsterCard } from '@/components/MonsterCard';
import { EggCard } from '@/components/EggCard';
import { theme } from '@/theme';

export function CollectionSection() {
  const router = useRouter();
  const monsters = useGameStore((s) => s.monsters);
  const eggs = useGameStore((s) => s.eggs);

  const monsterList = Object.values(monsters).sort((a, b) => b.createdAt - a.createdAt);
  const eggList = Object.values(eggs).sort((a, b) => a.hatchAt - b.hatchAt);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {eggList.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>タマゴ</Text>
            {eggList.map((egg) => (
              <EggCard key={egg.id} egg={egg} onPress={() => router.push(`/egg/${egg.id}`)} />
            ))}
          </>
        ) : null}
        <Text style={styles.sectionTitle}>モンスター（{monsterList.length}）</Text>
        <View style={styles.grid}>
          {monsterList.map((monster) => (
            <MonsterCard
              key={monster.id}
              monster={monster}
              onPress={() => router.push(`/monster/${monster.id}`)}
            />
          ))}
        </View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});
