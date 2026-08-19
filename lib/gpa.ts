import { LETTER_GRADES, type Course, type LetterGrade } from '@/lib/types';

const POINTS: Record<LetterGrade, number> = {
  AA: 4.0,
  BA: 3.5,
  BB: 3.0,
  CB: 2.5,
  CC: 2.0,
  DC: 1.5,
  DD: 1.0,
  FD: 0.5,
  FF: 0.0,
};

const MIDPOINT_100: Record<LetterGrade, number> = {
  AA: 95,
  BA: 87,
  BB: 82,
  CB: 77,
  CC: 72,
  DC: 67,
  DD: 62,
  FD: 55,
  FF: 25,
};

export function isLetterGrade(value: string): value is LetterGrade {
  return (LETTER_GRADES as readonly string[]).includes(value);
}

export function pointsFromLetter(letter: LetterGrade): number {
  return POINTS[letter];
}

export function letterFromScore(score: number): LetterGrade {
  const clamped = Math.min(100, Math.max(0, score));
  if (clamped >= 90) return 'AA';
  if (clamped >= 85) return 'BA';
  if (clamped >= 80) return 'BB';
  if (clamped >= 75) return 'CB';
  if (clamped >= 70) return 'CC';
  if (clamped >= 65) return 'DC';
  if (clamped >= 60) return 'DD';
  if (clamped >= 50) return 'FD';
  return 'FF';
}

export function score100ForCourse(course: Pick<Course, 'score100' | 'letter'>): number {
  return course.score100 ?? MIDPOINT_100[course.letter];
}

export function computeGpa4(courses: Pick<Course, 'ects' | 'points'>[]): number {
  const credits = courses.reduce((sum, course) => sum + course.ects, 0);
  if (credits === 0) return 0;
  const total = courses.reduce((sum, course) => sum + course.ects * course.points, 0);
  return total / credits;
}

export function computeGpa100(courses: Pick<Course, 'ects' | 'score100' | 'letter'>[]): number {
  const credits = courses.reduce((sum, course) => sum + course.ects, 0);
  if (credits === 0) return 0;
  const total = courses.reduce(
    (sum, course) => sum + course.ects * score100ForCourse(course),
    0
  );
  return total / credits;
}

export function formatGpa(value: number, digits = 2): string {
  return value.toFixed(digits);
}
