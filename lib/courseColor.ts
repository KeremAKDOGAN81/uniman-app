import { COURSE_COLORS } from '@/lib/types';

export { COURSE_COLORS };

/** EduAi paleti — her ders adına tutarlı renk. */
export function normalizeCourseName(name: string): string {
  return name.trim().toLocaleLowerCase('tr');
}

export function colorForCourseName(
  name: string,
  schedule: { title: string; color?: string }[] = []
): string {
  const key = normalizeCourseName(name);
  if (!key) return COURSE_COLORS[0];
  const existing = schedule.find((item) => normalizeCourseName(item.title) === key);
  if (existing?.color) return existing.color;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return COURSE_COLORS[hash % COURSE_COLORS.length];
}

const EMOJI_POOL = ['📚', '🧮', '🎬', '⚗️', '💻', '📐', '🌍', '🎨', '🔬', '📝', '🎵', '🏛️'];

export function emojiForCourse(name: string): string {
  const key = normalizeCourseName(name);
  if (!key) return '📚';
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 17 + key.charCodeAt(i)) >>> 0;
  }
  return EMOJI_POOL[hash % EMOJI_POOL.length];
}

/** Kart alt şeridi — ders rengine uyumlu ikinci ton. */
export function progressToneForColor(color: string): string {
  const tones: Record<string, string> = {
    '#6C5CE7': '#22C55E',
    '#3B82F6': '#14B8A6',
    '#EF4444': '#FF9F1C',
    '#22C55E': '#6C5CE7',
    '#FF9F1C': '#EF4444',
    '#EC4899': '#6C5CE7',
    '#14B8A6': '#3B82F6',
    '#F97316': '#22C55E',
  };
  return tones[color] ?? '#6C5CE7';
}

export const eduCardShadow = {
  shadowColor: '#6C5CE7',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.08,
  shadowRadius: 16,
  elevation: 4,
} as const;
