import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useGameStore } from '@/store/gameStore';
import { getSpecies } from '@/data/species';
import { computeStats, expForLevel, COOLDOWNS } from '@/game/logic';
import { useNow, formatDuration } from '@/hooks/useNow';
import { MonsterAvatar } from '@/components/MonsterAvatar';
import { ProgressBar } from '@/components/ProgressBar';
import { StatBar } from '@/components/StatBar';
import { PrimaryButton } from '@/components/PrimaryButton';
import { theme, ELEMENT_LABELS, GENDER_LABELS, GENDER_SYMBOLS } from '@/theme';

const STAT_DISPLAY_MAX = 60;

export default function MonsterDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const now = useNow();
  const monster = useGameStore((s) => s.monsters[id]);
  const feedMonster = useGameStore((s) => s.feedMonster);
  const trainMonster = useGameStore((s) => s.trainMonster);
  const renameMonster = useGameStore((s) => s.renameMonster);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(monster?.nickname ?? '');

  if (!monster) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>モンスターが見つかりませんでした</Text>
      </View>
    );
  }

  const species = getSpecies(monster.speciesId);
  const stats = computeStats(species, monster.level, monster.ivs);
  const expNeeded = expForLevel(monster.level);

  const feedRemaining = monster.lastFedAt
    ? monster.lastFedAt + COOLDOWNS.FEED_MS - now
    : 0;
  const trainRemaining = monster.lastTrainedAt
    ? monster.lastTrainedAt + COOLDOWNS.TRAIN_MS - now
    : 0;
  const breedRemaining = monster.breedingCooldownUntil
    ? monster.breedingCooldownUntil - now
    : 0;

  function handleFeed() {
    const result = feedMonster(monster.id);
    if (!result.ok) Alert.alert('できません', result.message);
  }

  function handleTrain() {
    const result = trainMonster(monster.id);
    if (!result.ok) Alert.alert('できません', result.message);
  }

  function saveName() {
    if (nameDraft.trim()) {
      renameMonster(monster.id, nameDraft);
      navigation.setOptions({ title: nameDraft.trim().slice(0, 20) });
    }
    setEditingName(false);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <MonsterAvatar species={species} size={96} />
        {editingName ? (
          <TextInput
            style={styles.nameInput}
            value={nameDraft}
            onChangeText={setNameDraft}
            autoFocus
            maxLength={20}
            onSubmitEditing={saveName}
            onBlur={saveName}
          />
        ) : (
          <Text style={styles.name} onPress={() => setEditingName(true)}>
            {monster.nickname} ✎
          </Text>
        )}
        <View style={styles.badgeRow}>
          <View style={[styles.elementBadge, { backgroundColor: species.color + '33' }]}>
            <Text style={[styles.elementText, { color: species.color }]}>
              {species.name} ・ {ELEMENT_LABELS[species.element]}属性
            </Text>
          </View>
          <View
            style={[
              styles.genderBadge,
              {
                backgroundColor:
                  (monster.gender === 'male' ? theme.colors.male : theme.colors.female) + '33',
              },
            ]}
          >
            <Text
              style={[
                styles.genderText,
                { color: monster.gender === 'male' ? theme.colors.male : theme.colors.female },
              ]}
            >
              {GENDER_SYMBOLS[monster.gender]} {GENDER_LABELS[monster.gender]}
            </Text>
          </View>
        </View>
        {monster.generation > 1 ? (
          <Text style={styles.generation}>第{monster.generation}世代</Text>
        ) : null}
      </View>

      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Lv.{monster.level}</Text>
          <Text style={styles.expText}>
            {monster.exp} / {expNeeded} EXP
          </Text>
        </View>
        <ProgressBar ratio={monster.exp / expNeeded} color={theme.colors.primary} />
      </View>

      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>なつき度</Text>
          <Text style={styles.expText}>{monster.affection} / 100</Text>
        </View>
        <ProgressBar ratio={monster.affection / 100} color={theme.colors.heart} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ステータス</Text>
        <StatBar label="HP" value={stats.hp} max={STAT_DISPLAY_MAX} color={theme.colors.success} />
        <StatBar label="ATK" value={stats.atk} max={STAT_DISPLAY_MAX} color={theme.colors.danger} />
        <StatBar label="DEF" value={stats.def} max={STAT_DISPLAY_MAX} color={theme.colors.primary} />
        <StatBar label="SPD" value={stats.spd} max={STAT_DISPLAY_MAX} color={theme.colors.accent} />
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          label="🍖 エサをあげる"
          subtitle={feedRemaining > 0 ? `あと ${formatDuration(feedRemaining)}` : `+EXP ・ なつき度UP`}
          onPress={handleFeed}
          disabled={feedRemaining > 0}
          style={styles.actionButton}
        />
        <PrimaryButton
          label="💪 トレーニング"
          subtitle={trainRemaining > 0 ? `あと ${formatDuration(trainRemaining)}` : `+EXP（大）`}
          onPress={handleTrain}
          disabled={trainRemaining > 0}
          variant="secondary"
          style={styles.actionButton}
        />
      </View>

      {breedRemaining > 0 ? (
        <Text style={styles.cooldownNote}>交配クールダウン中: あと {formatDuration(breedRemaining)}</Text>
      ) : null}
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
  nameInput: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary,
    minWidth: 160,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  elementBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  elementText: {
    fontSize: 12,
    fontWeight: '700',
  },
  genderBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  genderText: {
    fontSize: 12,
    fontWeight: '700',
  },
  generation: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 8,
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  expText: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
  },
  cooldownNote: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
});
