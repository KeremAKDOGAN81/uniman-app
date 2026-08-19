import type {
  AttendanceItem,
  Course,
  ExamTarget,
  Note,
  Reminder,
  ScheduleItem,
  ThemeName,
} from '@/lib/types';

export const BACKUP_VERSION = 1;

export type UniManBackup = {
  version: number;
  exportedAt: string;
  theme: ThemeName;
  courses: Course[];
  schedule: ScheduleItem[];
  reminders: Reminder[];
  examTargets: ExamTarget[];
  attendance: AttendanceItem[];
  notes: Note[];
};

export function stringifyBackup(data: Omit<UniManBackup, 'version' | 'exportedAt'>): string {
  const payload: UniManBackup = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    ...data,
  };
  return JSON.stringify(payload, null, 2);
}

export function parseBackup(raw: string): UniManBackup {
  const parsed = JSON.parse(raw) as UniManBackup;
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Geçersiz yedek');
  }
  if (!Array.isArray(parsed.courses) || !Array.isArray(parsed.schedule)) {
    throw new Error('Yedekte ders veya program yok');
  }
  return {
    version: BACKUP_VERSION,
    exportedAt: parsed.exportedAt ?? new Date().toISOString(),
    theme: parsed.theme === 'dark' ? 'dark' : 'light',
    courses: parsed.courses,
    schedule: parsed.schedule,
    reminders: parsed.reminders ?? [],
    examTargets: parsed.examTargets ?? [],
    attendance: parsed.attendance ?? [],
    notes: parsed.notes ?? [],
  };
}
