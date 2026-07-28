import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
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
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const sortLabel = SORT_OPTIONS.find((opt) => opt.key === sortKey)?.label ?? '';

  function toggleElement(el: ElementType) {
    if (elementFilter.includes(el)) {
      onChangeElementFilter(elementFilter.filter((e) => e !== el));
    } else {
      onChangeElementFilter([...elementFilter, el]);
    }
  }

  return (
    <View style={styles.row}>
      <Pressable style={styles.controlButton} onPress={() => setSortOpen(true)}>
        <Text style={styles.controlLabel}>{sortLabel}</Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>
      <Pressable style={styles.controlButton} onPress={() => setFilterOpen(true)}>
        <Text style={styles.controlLabel}>
          絞り込み{elementFilter.length > 0 ? `（${elementFilter.length}）` : ''}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      <Modal visible={sortOpen} transparent animationType="fade" onRequestClose={() => setSortOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setSortOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>並び替え</Text>
            {SORT_OPTIONS.map((opt) => {
              const active = sortKey === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  style={styles.optionRow}
                  onPress={() => {
                    onChangeSort(opt.key);
                    setSortOpen(false);
                  }}
                >
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>
                    {opt.label}
                  </Text>
                  {active ? <Text style={styles.check}>✓</Text> : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={filterOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setFilterOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>属性で絞り込み（複数選択可）</Text>
            <Pressable style={styles.optionRow} onPress={() => onChangeElementFilter([])}>
              <Text style={[styles.optionText, elementFilter.length === 0 && styles.optionTextActive]}>
                すべて
              </Text>
              {elementFilter.length === 0 ? <Text style={styles.check}>✓</Text> : null}
            </Pressable>
            {ELEMENT_OPTIONS.map((el) => {
              const active = elementFilter.includes(el);
              return (
                <Pressable key={el} style={styles.optionRow} onPress={() => toggleElement(el)}>
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>
                    {ELEMENT_LABELS[el]}
                  </Text>
                  {active ? <Text style={styles.check}>✓</Text> : null}
                </Pressable>
              );
            })}
            <Pressable style={styles.closeButton} onPress={() => setFilterOpen(false)}>
              <Text style={styles.closeButtonText}>閉じる</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  controlLabel: {
    color: theme.colors.text,
    ...theme.textShadow(),
    fontSize: 12,
    fontWeight: '700',
  },
  chevron: {
    color: theme.colors.textMuted,
    fontSize: 10,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
  },
  sheetTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  optionText: {
    color: theme.colors.textMuted,
    ...theme.textShadow(),
    fontSize: 14,
    fontWeight: '600',
  },
  optionTextActive: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
  check: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  closeButton: {
    marginTop: 14,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: theme.colors.text,
    fontWeight: '800',
    fontSize: 13,
  },
});
