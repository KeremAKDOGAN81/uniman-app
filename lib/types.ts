export type ThemeName = 'light' | 'dark';

export const LETTER_GRADES = ['AA', 'BA', 'BB', 'CB', 'CC', 'DC', 'DD', 'FD', 'FF'] as const;
export type LetterGrade = (typeof LETTER_GRADES)[number];

export const WEEKDAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export type Course = {
  id: number;
  name: string;
  ects: number;
  letter: LetterGrade;
  points: number;
  score100: number | null;
};

export type RemindHours = 0 | 1 | 2 | 3;

export const COURSE_COLORS = [
  '#0F766E',
  '#EA580C',
  '#BE185D',
  '#1D4ED8',
  '#15803D',
  '#CA8A04',
  '#7C3AED',
  '#0891B2',
] as const;

export type CourseColor = (typeof COURSE_COLORS)[number];

export type ScheduleItem = {
  id: number;
  weekday: Weekday;
  title: string;
  startTime: string;
  endTime: string;
  room: string;
  remindHours: RemindHours;
  notificationId: string | null;
  color: string;
};

export type ReminderKind = 'sinav' | 'odev';

export type Reminder = {
  id: number;
  title: string;
  kind: ReminderKind;
  dueAt: string;
  notificationId: string | null;
  done: boolean;
};

export type ExamTarget = {
  id: number;
  name: string;
  yearPoints: number;
  requiredFinal: number;
};

export type AttendanceItem = {
  id: number;
  name: string;
  used: number;
  limit: number;
};

export type Note = {
  id: number;
  title: string;
  body: string;
  createdAt: string;
};
