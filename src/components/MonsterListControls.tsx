import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ElementType } from '@/types';
import { theme, ELEMENT_LABELS } from '@/theme';
import { MonsterSortKey } from '@/game/monsterList';

const SORT_OPTIONS: { key: MonsterSortKey; label: string }[] = [
  { key: 'new', label: '新しい順' },
  { key: 'level', label: 'レベル順' },
  { key: 'dexNo', label: '図鑑No順' },
  { key: 'name', label: '名前順' },
];

const ELEMENT_OPTIONS: ElementType[] = ['fire', 'water', 'grass', 'electric', 'rock', 'mystic'];

interface Props {
  sortKey: MonsterSortKey;
  onChangeSort: (key: MonsterSortKey) => void;
  elementFilter: ElementType[];
  onChangeElementFilter: (elements: ElementType[]) => void;
}

export function MonsterListControls({
  sortKey,
  onChangeSort,
  elementFilter,
  onChangeElementFilter,
}: Props) {
  function toggleElement(el: ElementType) {
    if (elementFilter.includes(el)) {
      onChangeElementFilter(elementFilter.filter((e) => e !== el));
    } else {
      onChangeElementFilter([...elementFilter, el]);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {SORT_OPTIONS.map((opt) => {
          const active = sortKey === opt.key;
          return (
            <Pressable
              key={opt.key}
              style={[styles.pill, active && styles.pillActive]}
              onPress={() => onChangeSort(opt.key)}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.row}>
        <Pressable
          style={[styles.chip, elementFilter.length === 0 && styles.chipActive]}
          onPress={() => onChangeElementFilter([])}
        >
          <Text style={[styles.chipText, elementFilter.length === 0 && styles.chipTextActive]}>
            すべて
          </Text>
        </Pressable>
        {ELEMENT_OPTIONS.map((el) => {
          const active = elementFilter.includes(el);
          return (
            <Pressable
              key={el}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => toggleElement(el)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {ELEMENT_LABELS[el]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  pillText: {
    color: theme.colors.textMuted,
    ...theme.textShadow(),
    fontSize: 11,
    fontWeight: '700',
  },
  pillTextActive: {
    color: theme.colors.text,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipActive: {
    backgroundColor: theme.colors.primaryMuted,
    borderColor: theme.colors.primary,
  },
  chipText: {
    color: theme.colors.textMuted,
    ...theme.textShadow(),
    fontSize: 11,
    fontWeight: '600',
  },
  chipTextActive: {
    color: theme.colors.text,
  },
});
