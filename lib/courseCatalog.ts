import { colorForCourseName, emojiForCourse, normalizeCourseName } from '@/lib/courseColor';
import { isUpcoming } from '@/lib/dates';
import type {
  AttendanceItem,
  Course,
  ExamTarget,
  Note,
  Reminder,
  ScheduleItem,
} from '@/lib/types';

export type CourseCatalogEntry = {
  name: string;
  normalized: string;
  color: string;
  emoji: string;
  scheduleCount: number;
  hasGrade: boolean;
  gradeLetter?: string;
  hasAttendance: boolean;
  attendanceUsed?: number;
  attendanceLimit?: number;
  hasExamTarget: boolean;
  noteCount: number;
  upcomingExams: number;
};

type CatalogInput = {
  courses: Course[];
  schedule: ScheduleItem[];
  attendance: AttendanceItem[];
  examTargets: ExamTarget[];
  notes: Note[];
  reminders: Reminder[];
};

function pickDisplayName(existing: string | undefined, candidate: string): string {
  const next = candidate.trim();
  if (!next) return existing ?? '';
  if (!existing) return next;
  return next.length > existing.length ? next : existing;
}

export function buildCourseCatalog(input: CatalogInput): CourseCatalogEntry[] {
  const map = new Map<string, CourseCatalogEntry>();

  const ensure = (rawName: string): CourseCatalogEntry | null => {
    const trimmed = rawName.trim();
    if (!trimmed) return null;
    const normalized = normalizeCourseName(trimmed);
    if (!normalized) return null;
    let entry = map.get(normalized);
    if (!entry) {
      entry = {
        name: trimmed,
        normalized,
        color: colorForCourseName(trimmed, input.schedule),
        emoji: emojiForCourse(trimmed),
        scheduleCount: 0,
        hasGrade: false,
        hasAttendance: false,
        hasExamTarget: false,
        noteCount: 0,
        upcomingExams: 0,
      };
      map.set(normalized, entry);
    } else {
      entry.name = pickDisplayName(entry.name, trimmed);
    }
    return entry;
  };

  for (const course of input.courses) {
    const entry = ensure(course.name);
    if (!entry) continue;
    entry.hasGrade = true;
    entry.gradeLetter = course.letter;
    entry.color = colorForCourseName(entry.name, input.schedule);
  }

  for (const item of input.schedule) {
    const entry = ensure(item.title);
    if (!entry) continue;
    entry.scheduleCount += 1;
    entry.color = item.color || colorForCourseName(entry.name, input.schedule);
  }

  for (const item of input.attendance) {
    const entry = ensure(item.name);
    if (!entry) continue;
    entry.hasAttendance = true;
    entry.attendanceUsed = item.used;
    entry.attendanceLimit = item.limit;
  }

  for (const target of input.examTargets) {
    const entry = ensure(target.name);
    if (!entry) continue;
    entry.hasExamTarget = true;
  }

  for (const note of input.notes) {
    const label = note.courseName.trim() || note.title.trim();
    const entry = ensure(label);
    if (!entry) continue;
    entry.noteCount += 1;
  }

  for (const reminder of input.reminders) {
    if (reminder.done || reminder.kind !== 'sinav' || !isUpcoming(reminder.dueAt)) continue;
    const label = reminder.courseName?.trim() || reminder.title;
    const entry = ensure(label);
    if (!entry) continue;
    entry.upcomingExams += 1;
  }

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
}

export function collectCourseNames(input: CatalogInput): string[] {
  return buildCourseCatalog(input).map((entry) => entry.name);
}

export function hasAttendanceForName(name: string, attendance: AttendanceItem[]): boolean {
  const key = normalizeCourseName(name);
  return attendance.some((item) => normalizeCourseName(item.name) === key);
}

export function hasGradeForName(name: string, courses: Course[]): boolean {
  const key = normalizeCourseName(name);
  return courses.some((item) => normalizeCourseName(item.name) === key);
}

export function findCatalogEntry(
  name: string,
  catalog: CourseCatalogEntry[]
): CourseCatalogEntry | undefined {
  const key = normalizeCourseName(name);
  return catalog.find((entry) => entry.normalized === key);
}
