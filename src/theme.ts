import { TextStyle, ViewStyle } from 'react-native';

export const theme = {
  colors: {
    background: '#05060F',
    // Translucent so the animated background shows through cards/sections.
    surface: 'rgba(18, 20, 44, 0.82)',
    surfaceAlt: 'rgba(27, 30, 66, 0.82)',
    border: '#2B2E5C',
    text: '#EAF0FF',
    textMuted: '#7A85C0',
    primary: '#8A5CFF',
    primaryMuted: '#4B3399',
    accent: '#F5C93B',
    neonCyan: '#2EF2FF',
    neonPink: '#FF2E9A',
    success: '#39FF88',
    danger: '#FF3860',
    heart: '#FF3DA6',
    male: '#3DA9FF',
    female: '#FF4FA3',
  },
  radius: {
    sm: 8,
    md: 14,
    lg: 22,
  },
  spacing: (n: number) => n * 4,
  /** Soft colored glow for highlighting an interactive or "special" element. */
  glow(color: string, opacity = 0.55, radius = 10): ViewStyle {
    return {
      shadowColor: color,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: opacity,
      shadowRadius: radius,
      elevation: 6,
    };
  },
  /** Keeps muted text legible when it sits over the animated background. */
  textShadow(): TextStyle {
    return {
      textShadowColor: 'rgba(0, 0, 0, 0.65)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    };
  },
};

export const ELEMENT_LABELS: Record<string, string> = {
  fire: '炎',
  water: '水',
  grass: '草',
  electric: '電',
  rock: '岩',
  mystic: '神秘',
};

export const GENDER_SYMBOLS: Record<string, string> = {
  male: '♂',
  female: '♀',
};

export const GENDER_LABELS: Record<string, string> = {
  male: 'オス',
  female: 'メス',
};
