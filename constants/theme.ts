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

/** EduAi — lazy kar / Dribbble 25923399 */
export const palettes: Record<ThemeName, ThemeColors> = {
  light: {
    bg: '#F3F4F8',
    bgElevated: '#FFFFFF',
    card: '#FFFFFF',
    line: '#E8EBF2',
    text: '#111827',
    muted: '#8B93A7',
    accent: '#6C5CE7',
    onAccent: '#FFFFFF',
    blue: '#5B7CFA',
    warning: '#FF9F1C',
    danger: '#EF4444',
    success: '#22C55E',
    tabBar: '#FFFFFF',
    orange: '#FF9F1C',
    pink: '#E879F9',
    teal: '#14B8A6',
  },
  dark: {
    bg: '#12121A',
    bgElevated: '#1C1C28',
    card: '#242433',
    line: '#32324A',
    text: '#F9FAFB',
    muted: '#9CA3AF',
    accent: '#8B7CF6',
    onAccent: '#FFFFFF',
    blue: '#93B4FF',
    warning: '#FBBF24',
    danger: '#F87171',
    success: '#4ADE80',
    tabBar: '#12121A',
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

export const eduHeroGradient = ['#A594FF', '#F0A8FF'] as const;
export const eduHeroGradientDark = ['#7C6AE0', '#C084FC'] as const;
