import { formatCountdown, formatDateTime, isUpcoming } from '@/lib/dates';
import { computeGpa4, formatGpa } from '@/lib/gpa';
import type { AttendanceItem, Course, Reminder } from '@/lib/types';
import { weeklySummaryLine } from '@/lib/copy';
import { WEEKDAYS } from '@/lib/types';

export type WeeklySummary = {
  classCount: number;
  examCount: number;
  openReminders: number;
  attendanceWarnings: number;
  gpaLabel: string | null;
  line: string;
};

export type NextExamInsight = {
  id: number;
  title: string;
  dueAt: string;
  countdown: string;
  dateLabel: string;
};

function isWithinDays(iso: string, days: number, now = new Date()): boolean {
  const due = new Date(iso).getTime();
  const limit = now.getTime() + days * 24 * 60 * 60 * 1000;
  return due >= now.getTime() && due <= limit;
}

export function computeWeeklySummary(input: {
  scheduleCount: number;
  reminders: Reminder[];
  attendance: AttendanceItem[];
  courses: Course[];
  now?: Date;
}): WeeklySummary {
  const now = input.now ?? new Date();
  const openReminders = input.reminders.filter((item) => !item.done && isUpcoming(item.dueAt));
  const examCount = openReminders.filter(
    (item) => item.kind === 'sinav' && isWithinDays(item.dueAt, 7, now)
  ).length;
  const attendanceWarnings = input.attendance.filter((item) => item.used / item.limit >= 0.75).length;
  const gpa4 = computeGpa4(input.courses);
  const gpaLabel = input.courses.length > 0 ? formatGpa(gpa4) : null;

  const line = weeklySummaryLine({
    scheduleCount: input.scheduleCount,
    examCount,
    gpaLabel,
    attendanceWarnings,
  });

  return {
    classCount: input.scheduleCount,
    examCount,
    openReminders: openReminders.length,
    attendanceWarnings,
    gpaLabel,
    line,
  };
}

export function findNextExam(reminders: Reminder[], now = new Date()): NextExamInsight | null {
  const next = reminders
    .filter((item) => !item.done && item.kind === 'sinav' && isUpcoming(item.dueAt))
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0];

  if (!next) return null;

  return {
    id: next.id,
    title: next.title,
    dueAt: next.dueAt,
    countdown: formatCountdown(next.dueAt, now),
    dateLabel: formatDateTime(next.dueAt),
  };
}

export function weekDayLabels(): string {
  return WEEKDAYS.join(' – ');
}
