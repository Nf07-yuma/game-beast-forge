import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useGameStore } from '@/store/gameStore';
import { SPECIES, STARTER_SPECIES_IDS } from '@/data/species';
import { MonsterAvatar } from '@/components/MonsterAvatar';
import { MonsterCard } from '@/components/MonsterCard';
import { EggCard } from '@/components/EggCard';
import { theme } from '@/theme';

function StarterPicker() {
  const chooseStarter = useGameStore((s) => s.chooseStarter);

  function handleSelect(id: string) {
    const species = SPECIES[id];
    Alert.alert(
      `${species.name}に決定しますか?`,
      '性別を選んでください。はじめての相棒は後から変更できません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '♂ オス', onPress: () => chooseStarter(id, 'male') },
        { text: '♀ メス', onPress: () => chooseStarter(id, 'female') },
      ]
    );
  }

  return (
    <View style={styles.starterWrap}>
      <Text style={styles.starterTitle}>はじめての相棒を選ぼう</Text>
      <Text style={styles.starterSubtitle}>ここで選んだモンスターから育成がスタートします</Text>
      {STARTER_SPECIES_IDS.map((id) => {
        const species = SPECIES[id];
        return (
          <Pressable key={id} style={styles.starterCard} onPress={() => handleSelect(id)}>
            <MonsterAvatar species={species} size={64} />
            <View style={styles.starterInfo}>
              <Text style={styles.starterName}>{species.name}</Text>
              <Text style={styles.starterDesc}>{species.description}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function CollectionScreen() {
  const router = useRouter();
  const hasStarter = useGameStore((s) => s.hasStarter);
  const monsters = useGameStore((s) => s.monsters);
  const eggs = useGameStore((s) => s.eggs);

  if (!hasStarter) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <StarterPicker />
        </ScrollView>
      </View>
    );
  }

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
        {monsterList.map((monster) => (
          <MonsterCard
            key={monster.id}
            monster={monster}
            onPress={() => router.push(`/monster/${monster.id}`)}
          />
        ))}
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
  sectionTitle: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  starterWrap: {
    paddingTop: 16,
  },
  starterTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  starterSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginBottom: 20,
  },
  starterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  starterInfo: {
    flex: 1,
    marginLeft: 14,
  },
  starterName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  starterDesc: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
});
