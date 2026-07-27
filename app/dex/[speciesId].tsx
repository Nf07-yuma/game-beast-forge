import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useGameStore } from '@/store/gameStore';
import { SPECIES } from '@/data/species';
import { MonsterAvatar } from '@/components/MonsterAvatar';
import { StatBar } from '@/components/StatBar';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { theme, ELEMENT_LABELS } from '@/theme';

const STAT_DISPLAY_MAX = 40;

export default function DexDetailScreen() {
  const { speciesId } = useLocalSearchParams<{ speciesId: string }>();
  const navigation = useNavigation();
  const monsters = useGameStore((s) => s.monsters);
  const species = SPECIES[speciesId];
  const ownedCount = Object.values(monsters).filter((m) => m.speciesId === speciesId).length;
  const discovered = ownedCount > 0;

  useEffect(() => {
    if (species) {
      navigation.setOptions({ title: discovered ? species.name : '？？？' });
    }
  }, [navigation, species, discovered]);

  if (!species || !discovered) {
    return (
      <View style={styles.container}>
        <AnimatedBackground />
        <Text style={styles.notFound}>まだ発見していません</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <MonsterAvatar species={species} size={96} />
          <Text style={styles.name}>{species.name}</Text>
          <View style={[styles.elementBadge, { backgroundColor: species.color + '33' }]}>
            <Text style={[styles.elementText, { color: species.color }]}>
              {ELEMENT_LABELS[species.element]}属性
            </Text>
          </View>
          <Text style={styles.ownedCount}>現在{ownedCount}匹所持中</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>説明</Text>
          <Text style={styles.description}>{species.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>種族値</Text>
          <StatBar label="HP" value={species.baseStats.hp} max={STAT_DISPLAY_MAX} color={theme.colors.success} />
          <StatBar label="ATK" value={species.baseStats.atk} max={STAT_DISPLAY_MAX} color={theme.colors.danger} />
          <StatBar label="DEF" value={species.baseStats.def} max={STAT_DISPLAY_MAX} color={theme.colors.primary} />
          <StatBar label="SPD" value={species.baseStats.spd} max={STAT_DISPLAY_MAX} color={theme.colors.accent} />
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 48,
  },
  notFound: {
    color: theme.colors.textMuted,
    ...theme.textShadow(),
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  name: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 12,
  },
  elementBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10,
  },
  elementText: {
    fontSize: 12,
    fontWeight: '700',
  },
  ownedCount: {
    color: theme.colors.textMuted,
    ...theme.textShadow(),
    fontSize: 12,
    marginTop: 10,
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
  description: {
    color: theme.colors.textMuted,
    ...theme.textShadow(),
    fontSize: 13,
    lineHeight: 19,
  },
});
