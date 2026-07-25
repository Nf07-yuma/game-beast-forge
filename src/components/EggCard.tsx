import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Egg } from '@/types';
import { COOLDOWNS } from '@/game/logic';
import { formatDuration, useNow } from '@/hooks/useNow';
import { ProgressBar } from './ProgressBar';
import { theme } from '@/theme';

interface Props {
  egg: Egg;
  onPress: () => void;
}

export function EggCard({ egg, onPress }: Props) {
  const now = useNow();
  const total = egg.hatchAt - egg.createdAt || COOLDOWNS.EGG_HATCH_MS;
  const elapsed = now - egg.createdAt;
  const ratio = elapsed / total;
  const remaining = egg.hatchAt - now;
  const ready = remaining <= 0;

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <Text style={styles.emoji}>🥚</Text>
      <View style={styles.info}>
        <Text style={styles.title}>{ready ? 'タマゴが孵化できます！' : 'タマゴを温めている…'}</Text>
        <ProgressBar ratio={ratio} color={ready ? theme.colors.success : theme.colors.accent} />
        <Text style={styles.subtitle}>{ready ? 'タップして孵化' : `あと ${formatDuration(remaining)}`}</Text>
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
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emoji: {
    fontSize: 40,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    color: theme.colors.text,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 6,
  },
});
