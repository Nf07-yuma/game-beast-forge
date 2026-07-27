import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useGameStore } from '@/store/gameStore';
import { getSpecies, HYBRID_TABLE } from '@/data/species';
import { canBreed, canBreedPair, COOLDOWNS } from '@/game/logic';
import { scheduleHatchReminder } from '@/notifications';
import { useNow } from '@/hooks/useNow';
import { MonsterCard } from '@/components/MonsterCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { MonsterAvatar } from '@/components/MonsterAvatar';
import { theme, GENDER_SYMBOLS } from '@/theme';

export function BreedingSection() {
  const monsters = useGameStore((s) => s.monsters);
  const breedMonsters = useGameStore((s) => s.breedMonsters);
  const now = useNow();
  const [selected, setSelected] = useState<string[]>([]);

  const monsterList = useMemo(
    () => Object.values(monsters).sort((a, b) => b.createdAt - a.createdAt),
    [monsters]
  );

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  }

  function handleBreed() {
    if (selected.length !== 2) return;
    const result = breedMonsters(selected[0], selected[1]);
    Alert.alert(result.ok ? 'こうはい成功' : 'こうはい失敗', result.message);
    if (result.ok) {
      setSelected([]);
      if (result.eggId) {
        scheduleHatchReminder(result.eggId, COOLDOWNS.EGG_HATCH_MS).catch(() => {});
      }
    }
  }

  const parentA = selected[0] ? monsters[selected[0]] : null;
  const parentB = selected[1] ? monsters[selected[1]] : null;
  const pairCheck = parentA && parentB ? canBreedPair(parentA, parentB, now) : null;

  let hint: string | null = null;
  if (parentA && parentB) {
    if (pairCheck && !pairCheck.ok) {
      hint = pairCheck.reason ?? null;
    } else {
      const elA = getSpecies(parentA.speciesId).element;
      const elB = getSpecies(parentB.speciesId).element;
      if (parentA.speciesId === parentB.speciesId) {
        hint = `${getSpecies(parentA.speciesId).name}が生まれるはず`;
      } else {
        const hybridId = HYBRID_TABLE[`${elA}+${elB}`] ?? HYBRID_TABLE[`${elB}+${elA}`];
        hint = hybridId
          ? `もしかしたら希少種「${getSpecies(hybridId).name}」が生まれるかも…！`
          : 'どちらかの親の種族が生まれます';
      }
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>2匹選んで交配しよう</Text>
        <Text style={styles.subtitle}>
          Lv.5以上、クールダウン中でないオスとメスのペアを選択できます
        </Text>

        {(parentA || parentB) && (
          <View style={styles.previewCard}>
            <View style={styles.previewRow}>
              <View style={styles.previewSlot}>
                {parentA ? (
                  <>
                    <MonsterAvatar species={getSpecies(parentA.speciesId)} size={56} />
                    <Text
                      style={[
                        styles.previewGender,
                        {
                          color:
                            parentA.gender === 'male' ? theme.colors.male : theme.colors.female,
                        },
                      ]}
                    >
                      {GENDER_SYMBOLS[parentA.gender]}
                    </Text>
                  </>
                ) : (
                  <View style={styles.emptySlot}>
                    <Text style={styles.emptySlotText}>?</Text>
                  </View>
                )}
              </View>
              <Text style={styles.plus}>×</Text>
              <View style={styles.previewSlot}>
                {parentB ? (
                  <>
                    <MonsterAvatar species={getSpecies(parentB.speciesId)} size={56} />
                    <Text
                      style={[
                        styles.previewGender,
                        {
                          color:
                            parentB.gender === 'male' ? theme.colors.male : theme.colors.female,
                        },
                      ]}
                    >
                      {GENDER_SYMBOLS[parentB.gender]}
                    </Text>
                  </>
                ) : (
                  <View style={styles.emptySlot}>
                    <Text style={styles.emptySlotText}>?</Text>
                  </View>
                )}
              </View>
            </View>
            {hint ? (
              <Text style={[styles.hint, pairCheck && !pairCheck.ok && styles.hintWarning]}>
                {hint}
              </Text>
            ) : null}
            <PrimaryButton
              label="交配する"
              onPress={handleBreed}
              disabled={!(parentA && parentB) || !pairCheck?.ok}
              style={styles.breedButton}
            />
          </View>
        )}

        <Text style={styles.sectionTitle}>モンスターを選択</Text>
        {monsterList.length === 0 ? (
          <Text style={styles.empty}>モンスターがいません</Text>
        ) : (
          monsterList.map((monster) => {
            const isSelected = selected.includes(monster.id);
            const otherParent = !isSelected && selected.length === 1 ? parentA : null;
            const check = otherParent
              ? canBreedPair(otherParent, monster, now)
              : canBreed(monster, now);
            return (
              <MonsterCard
                key={monster.id}
                monster={monster}
                selected={isSelected}
                disabled={!check.ok && !isSelected}
                disabledReason={check.reason}
                onPress={() => toggle(monster.id)}
              />
            );
          })
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
  title: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  empty: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  previewCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewSlot: {
    alignItems: 'center',
    marginHorizontal: 12,
  },
  previewGender: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  emptySlot: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlotText: {
    color: theme.colors.textMuted,
    fontSize: 20,
  },
  plus: {
    color: theme.colors.textMuted,
    fontSize: 18,
    fontWeight: '700',
  },
  hint: {
    color: theme.colors.accent,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
  hintWarning: {
    color: theme.colors.danger,
  },
  breedButton: {
    marginTop: 14,
  },
});
