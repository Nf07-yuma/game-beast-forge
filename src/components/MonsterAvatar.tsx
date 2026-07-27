import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Species } from '@/types';
import { theme } from '@/theme';

interface Props {
  species: Species;
  size?: number;
}

export function MonsterAvatar({ species, size = 72 }: Props) {
  return (
    <View
      style={[
        styles.circle,
        theme.glow(species.color, 0.5, size * 0.28),
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: species.color + '33',
          borderColor: species.color,
        },
      ]}
    >
      <Text style={{ fontSize: size * 0.5 }}>{species.emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
});
