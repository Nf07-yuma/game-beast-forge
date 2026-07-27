import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useGameStore } from '@/store/gameStore';
import { SPECIES, STARTER_SPECIES_IDS } from '@/data/species';
import { MonsterAvatar } from '@/components/MonsterAvatar';
import { CollectionSection } from '@/screens/CollectionSection';
import { BreedingSection } from '@/screens/BreedingSection';
import { DexSection } from '@/screens/DexSection';
import { AnimatedBackground } from '@/components/AnimatedBackground';
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

type Section = 'collection' | 'breeding' | 'dex';

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'collection', label: 'コレクション' },
  { key: 'breeding', label: '交配' },
  { key: 'dex', label: '図鑑' },
];

export default function MonsterScreen() {
  const hasStarter = useGameStore((s) => s.hasStarter);
  const [section, setSection] = useState<Section>('collection');

  if (!hasStarter) {
    return (
      <View style={styles.container}>
        <AnimatedBackground />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <StarterPicker />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <View style={styles.switcher}>
        {SECTIONS.map((s) => (
          <Pressable
            key={s.key}
            style={[
              styles.switchButton,
              section === s.key && [styles.switchButtonActive, theme.glow(theme.colors.primary, 0.5, 6)],
            ]}
            onPress={() => setSection(s.key)}
          >
            <Text style={[styles.switchLabel, section === s.key && styles.switchLabelActive]}>
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {section === 'collection' ? <CollectionSection /> : null}
      {section === 'breeding' ? <BreedingSection /> : null}
      {section === 'dex' ? <DexSection /> : null}
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
  switcher: {
    flexDirection: 'row',
    padding: 4,
    margin: 16,
    marginBottom: 0,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  switchButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
  },
  switchButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  switchLabel: {
    color: theme.colors.textMuted,
    ...theme.textShadow(),
    fontSize: 13,
    fontWeight: '700',
  },
  switchLabelActive: {
    color: theme.colors.text,
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
    ...theme.textShadow(),
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
    ...theme.textShadow(),
    fontSize: 12,
    lineHeight: 17,
  },
});
