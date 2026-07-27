import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGameStore } from '@/store/gameStore';
import { getSpecies } from '@/data/species';
import { COOLDOWNS } from '@/game/logic';
import { cancelHatchReminder } from '@/notifications';
import { useNow, formatDuration } from '@/hooks/useNow';
import { ProgressBar } from '@/components/ProgressBar';
import { PrimaryButton } from '@/components/PrimaryButton';
import { theme } from '@/theme';

export default function EggDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const now = useNow();
  const egg = useGameStore((s) => s.eggs[id]);
  const monsters = useGameStore((s) => s.monsters);
  const hatchEgg = useGameStore((s) => s.hatchEgg);

  if (!egg) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>タマゴが見つかりませんでした</Text>
      </View>
    );
  }

  const total = egg.hatchAt - egg.createdAt || COOLDOWNS.EGG_HATCH_MS;
  const elapsed = now - egg.createdAt;
  const ratio = elapsed / total;
  const remaining = egg.hatchAt - now;
  const ready = remaining <= 0;
  const parentA = egg.parentIds ? monsters[egg.parentIds[0]] : undefined;
  const parentB = egg.parentIds ? monsters[egg.parentIds[1]] : undefined;

  function handleHatch() {
    const result = hatchEgg(egg.id);
    if (!result.ok) {
      Alert.alert('まだ孵化しません', result.message);
      return;
    }
    cancelHatchReminder(egg.id).catch(() => {});
    Alert.alert('おめでとう！', result.message, [
      {
        text: 'OK',
        onPress: () => {
          if (result.monsterId) {
            router.replace(`/monster/${result.monsterId}`);
          } else {
            router.back();
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🥚</Text>
      <Text style={styles.title}>{ready ? 'タマゴが孵化できます！' : 'タマゴを温めている…'}</Text>
      <ProgressBar ratio={ratio} height={12} color={ready ? theme.colors.success : theme.colors.accent} />
      <Text style={styles.subtitle}>
        {ready ? '準備OK' : `孵化まであと ${formatDuration(remaining)}`}
      </Text>

      {(parentA || parentB) && (
        <Text style={styles.parents}>
          両親: {parentA?.nickname ?? '???'} × {parentB?.nickname ?? '???'}
        </Text>
      )}

      <PrimaryButton
        label="孵化させる"
        onPress={handleHatch}
        disabled={!ready}
        style={styles.hatchButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
  },
  notFound: {
    color: theme.colors.textMuted,
  },
  emoji: {
    fontSize: 84,
    marginBottom: 20,
  },
  title: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 12,
  },
  parents: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 24,
  },
  hatchButton: {
    marginTop: 40,
    width: '100%',
  },
});
