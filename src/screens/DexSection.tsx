import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useGameStore } from '@/store/gameStore';
import { SPECIES } from '@/data/species';
import { theme } from '@/theme';

export function DexSection() {
  const router = useRouter();
  const monsters = useGameStore((s) => s.monsters);

  const discoveredIds = new Set(Object.values(monsters).map((m) => m.speciesId));
  const speciesList = Object.values(SPECIES);
  const discoveredCount = speciesList.filter((species) => discoveredIds.has(species.id)).length;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.progress}>
          {discoveredCount} / {speciesList.length} 種を発見
        </Text>
        <View style={styles.grid}>
          {speciesList.map((species) => {
            const discovered = discoveredIds.has(species.id);
            return (
              <Pressable
                key={species.id}
                style={styles.tile}
                disabled={!discovered}
                onPress={() => router.push(`/dex/${species.id}`)}
              >
                <View
                  style={[
                    styles.circle,
                    discovered
                      ? { backgroundColor: species.color + '33', borderColor: species.color }
                      : styles.circleUndiscovered,
                  ]}
                >
                  <Text style={styles.emoji}>{discovered ? species.emoji : '？'}</Text>
                </View>
                <Text style={[styles.name, !discovered && styles.nameUndiscovered]} numberOfLines={1}>
                  {discovered ? species.name : '？？？'}
                </Text>
              </Pressable>
            );
          })}
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
  progress: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tile: {
    width: '31%',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  circleUndiscovered: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.border,
  },
  emoji: {
    fontSize: 28,
  },
  name: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  nameUndiscovered: {
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
});
