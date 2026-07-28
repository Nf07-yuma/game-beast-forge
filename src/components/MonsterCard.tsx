import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Monster } from '@/types';
import { formatDexNo, getSpecies } from '@/data/species';
import { MonsterAvatar } from './MonsterAvatar';
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
        selected && [
          { borderColor: theme.colors.primary, borderWidth: 2 },
          theme.glow(theme.colors.primary, 0.4, 8),
        ],
        disabled && styles.cardDisabled,
      ]}
    >
      <MonsterAvatar species={species} size={48} />
      <Text style={styles.dexNo}>{formatDexNo(species.dexNo)}</Text>
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
      {disabled && disabledReason ? (
        <Text style={styles.disabledReason} numberOfLines={2}>
          {disabledReason}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: 150,
    flexGrow: 1,
    maxWidth: '48%',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardDisabled: {
    opacity: 0.45,
  },
  dexNo: {
    color: theme.colors.textMuted,
    ...theme.textShadow(),
    fontSize: 10,
    fontWeight: '700',
    marginTop: 6,
  },
  name: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
    maxWidth: '100%',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 6,
  },
  elementBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  elementText: {
    fontSize: 11,
    fontWeight: '700',
  },
  level: {
    color: theme.colors.textMuted,
    ...theme.textShadow(),
    fontSize: 12,
    fontWeight: '600',
  },
  gender: {
    fontSize: 13,
    fontWeight: '800',
  },
  disabledReason: {
    color: theme.colors.danger,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
  },
});
