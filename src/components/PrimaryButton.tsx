import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '@/theme';

interface Props {
  label: string;
  subtitle?: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: ViewStyle;
}

export function PrimaryButton({
  label,
  subtitle,
  onPress,
  disabled,
  variant = 'primary',
  style,
}: Props) {
  const backgroundColor = disabled
    ? theme.colors.surfaceAlt
    : variant === 'primary'
      ? theme.colors.primary
      : variant === 'danger'
        ? theme.colors.danger
        : theme.colors.surfaceAlt;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor, opacity: pressed && !disabled ? 0.8 : 1 },
        style,
      ]}
    >
      <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, disabled && styles.labelDisabled]}>{subtitle}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    color: theme.colors.text,
    fontSize: 11,
    opacity: 0.8,
    marginTop: 2,
  },
  labelDisabled: {
    color: theme.colors.textMuted,
  },
});
