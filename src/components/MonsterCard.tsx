import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Monster } from '@/types';
import { getSpecies } from '@/data/species';
import { MonsterAvatar } from './MonsterAvatar';
import { ProgressBar } from './ProgressBar';
import { theme, ELEMENT_LABELS, GENDER_SYMBOLS } from '@/theme';

interface Props {
  monster: Monster;
  onPress: () => void;
  selected?: boolean;
  disabled?: boolean;
  disabledReason?: string;
}

export function MonsterCard({ monster, onPress, selected, disabled, disabledReason }: Props) {
  const species = getSpecies(monster.speciesId);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.card,
        selected && { borderColor: theme.colors.primary, borderWidth: 2 },
        disabled && styles.cardDisabled,
      ]}
    >
      <MonsterAvatar species={species} size={56} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {monster.nickname}
        </Text>
        <View style={styles.badgeRow}>
          <View style={[styles.elementBadge, { backgroundColor: species.color + '33' }]}>
            <Text style={[styles.elementText, { color: species.color }]}>
              {ELEMENT_LABELS[species.element]}
            </Text>
          </View>
          <Text style={styles.level}>Lv.{monster.level}</Text>
          <Text
            style={[
              styles.gender,
              { color: monster.gender === 'male' ? theme.colors.male : theme.colors.female },
            ]}
          >
            {GENDER_SYMBOLS[monster.gender]}
          </Text>
        </View>
        <View style={styles.affectionRow}>
          <Text style={styles.heart}>♥</Text>
          <ProgressBar
            ratio={monster.affection / 100}
            color={theme.colors.heart}
            height={6}
            style={styles.affectionBar}
          />
        </View>
        {disabled && disabledReason ? (
          <Text style={styles.disabledReason}>{disabledReason}</Text>
        ) : null}
      </View>
    </Pressable>
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
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardDisabled: {
    opacity: 0.45,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  elementBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  elementText: {
    fontSize: 11,
    fontWeight: '700',
  },
  level: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  gender: {
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 8,
  },
  affectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  heart: {
    color: theme.colors.heart,
    fontSize: 12,
    marginRight: 6,
  },
  affectionBar: {
    flex: 1,
  },
  disabledReason: {
    color: theme.colors.danger,
    fontSize: 11,
    marginTop: 4,
  },
});
