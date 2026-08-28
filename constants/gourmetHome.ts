/** GourmetGrove-inspired palette for the home feed (always dark premium). */
export const gourmetHome = {
  bg: '#0A0A0C',
  surface: '#16161A',
  surfaceElevated: '#1E1E24',
  search: '#1C1C21',
  text: '#F5F5F7',
  muted: '#8E8E93',
  line: '#2A2A30',
  accent: '#FF6B35',
  accentSoft: '#FF8C5A',
  heroFallback: ['#FF6B35', '#C2410C'] as const,
  statAgno: '#6366F1',
  statOpen: '#F59E0B',
};

export function greetingForHour(hour: number): string {
  if (hour < 12) return 'Günaydın';
  if (hour < 18) return 'İyi günler';
  return 'İyi akşamlar';
}
