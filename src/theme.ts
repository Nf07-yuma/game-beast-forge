export const theme = {
  colors: {
    background: '#101322',
    surface: '#1B2036',
    surfaceAlt: '#242B47',
    border: '#323A5C',
    text: '#F4F6FB',
    textMuted: '#9AA3C7',
    primary: '#7C6CF0',
    primaryMuted: '#4B4390',
    accent: '#F5C93B',
    success: '#5FBF63',
    danger: '#E0554F',
    heart: '#F0668C',
  },
  radius: {
    sm: 8,
    md: 14,
    lg: 22,
  },
  spacing: (n: number) => n * 4,
};

export const ELEMENT_LABELS: Record<string, string> = {
  fire: '炎',
  water: '水',
  grass: '草',
  electric: '電',
  rock: '岩',
  mystic: '神秘',
};
