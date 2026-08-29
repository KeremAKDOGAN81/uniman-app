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
  semester: string;
};

export type ExamExtra = { score: number; weight: number };

export type ExamTarget = {
  id: number;
  name: string;
  yearPoints: number;
  requiredFinal: number;
  passing: number;
  midtermScore: number;
  midtermWeight: number;
  extras: ExamExtra[];
};

export type RemindHours = 0 | 1 | 2 | 3;

export const COURSE_COLORS = [
  '#6C5CE7',
  '#3B82F6',
  '#22C55E',
  '#FF9F1C',
  '#EF4444',
  '#EC4899',
  '#14B8A6',
  '#F97316',
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
  courseName: string;
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
  courseName: string;
  createdAt: string;
  pinned: boolean;
  imageUri: string;
};

export type UserProfile = {
  firstName: string;
  lastName: string;
  department: string;
  university: string;
  year: string;
};
