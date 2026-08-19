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
    bg: '#EAF2FF',
    bgElevated: '#FFFFFF',
    card: '#FFFFFF',
    line: '#C9DBF7',
    text: '#142033',
    muted: '#5C6F8A',
    accent: '#4F46E5',
    onAccent: '#FFFFFF',
    blue: '#2563EB',
    warning: '#F59E0B',
    danger: '#EF4444',
    success: '#16A34A',
    tabBar: '#FFFFFF',
    orange: '#F97316',
    pink: '#DB2777',
    teal: '#0D9488',
  },
  dark: {
    bg: '#0A0C10',
    bgElevated: '#12161D',
    card: '#161A22',
    line: '#262C37',
    text: '#F3F5F7',
    muted: '#8B95A5',
    accent: '#818CF8',
    onAccent: '#0F1220',
    blue: '#8BB4FF',
    warning: '#F5C15D',
    danger: '#F07171',
    success: '#4ADE80',
    tabBar: '#0A0C10',
    orange: '#FB923C',
    pink: '#F472B6',
    teal: '#2DD4BF',
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
