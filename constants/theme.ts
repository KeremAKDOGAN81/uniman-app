export type ThemeName = 'light' | 'dark';

export type ThemeColors = {
  bg: string;
  bgElevated: string;
  card: string;
  line: string;
  text: string;
  muted: string;
  accent: string;
  onAccent: string;
  blue: string;
  warning: string;
  danger: string;
  success: string;
  tabBar: string;
  orange: string;
  pink: string;
  teal: string;
};

export const palettes: Record<ThemeName, ThemeColors> = {
  light: {
    bg: '#E8F4F2',
    bgElevated: '#FFFFFF',
    card: '#FFFFFF',
    line: '#C5E0DB',
    text: '#10241F',
    muted: '#5A736C',
    accent: '#0F766E',
    onAccent: '#FFFFFF',
    blue: '#1D4ED8',
    warning: '#D97706',
    danger: '#DC2626',
    success: '#15803D',
    tabBar: '#FFFFFF',
    orange: '#EA580C',
    pink: '#BE185D',
    teal: '#0D9488',
  },
  dark: {
    bg: '#071210',
    bgElevated: '#0F1A18',
    card: '#12201D',
    line: '#1E302C',
    text: '#ECF7F4',
    muted: '#8AA39B',
    accent: '#2DD4BF',
    onAccent: '#04201C',
    blue: '#93C5FD',
    warning: '#FBBF24',
    danger: '#F87171',
    success: '#4ADE80',
    tabBar: '#071210',
    orange: '#FB923C',
    pink: '#F472B6',
    teal: '#5EEAD4',
  },
};

export const letterColors: Record<string, string> = {
  AA: '#16A34A',
  BA: '#22C55E',
  BB: '#84CC16',
  CB: '#EAB308',
  CC: '#F59E0B',
  DC: '#F97316',
  DD: '#EA580C',
  FD: '#F87171',
  FF: '#DC2626',
};
