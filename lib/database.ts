import * as SQLite from 'expo-sqlite';

import { isLetterGrade, pointsFromLetter } from '@/lib/gpa';
import type {
  AttendanceItem,
  Course,
  ExamExtra,
  ExamTarget,
  LetterGrade,
  Note,
  Reminder,
  ReminderKind,
  ScheduleItem,
  ThemeName,
  UserProfile,
  Weekday,
} from '@/lib/types';
import { COURSE_COLORS } from '@/lib/types';

let db: SQLite.SQLiteDatabase | null = null;

type CourseRow = {
  id: number;
  name: string;
  ects: number;
  letter: string;
  points: number;
  score100: number | null;
  semester?: string | null;
};

type ScheduleRow = {
  id: number;
  weekday: string;
  title: string;
  start_time: string;
  end_time: string;
  room: string;
  remind_hours?: number | null;
  notification_id?: string | null;
  color?: string | null;
};

type ReminderRow = {
  id: number;
  title: string;
  kind: string;
  due_at: string;
  notification_id: string | null;
  done: number;
};

function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('uniman.db');
  }
  return db;
}

export async function initDb(): Promise<void> {
  const database = getDb();
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      name TEXT NOT NULL,
      ects REAL NOT NULL,
      letter TEXT NOT NULL,
      points REAL NOT NULL,
      score100 REAL
    );
    CREATE TABLE IF NOT EXISTS schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      weekday TEXT NOT NULL,
      title TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      room TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      title TEXT NOT NULL,
      kind TEXT NOT NULL,
      due_at TEXT NOT NULL,
      notification_id TEXT,
      done INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS exam_targets (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      name TEXT NOT NULL,
      year_points REAL NOT NULL,
      required_final REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      name TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      max_limit INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
  `);
  await migrateScheduleColumns(database);
  await migrateNotesColumns(database);
  await migrateExtendedColumns(database);
}

async function migrateExtendedColumns(database: SQLite.SQLiteDatabase): Promise<void> {
  const courseCols = await database.getAllAsync<{ name: string }>('PRAGMA table_info(courses)');
  if (!courseCols.some((c) => c.name === 'semester')) {
    await database.execAsync("ALTER TABLE courses ADD COLUMN semester TEXT NOT NULL DEFAULT ''");
  }

  const examCols = await database.getAllAsync<{ name: string }>('PRAGMA table_info(exam_targets)');
  const examNames = new Set(examCols.map((c) => c.name));
  if (!examNames.has('passing')) {
    await database.execAsync('ALTER TABLE exam_targets ADD COLUMN passing REAL NOT NULL DEFAULT 60');
  }
  if (!examNames.has('midterm_score')) {
    await database.execAsync('ALTER TABLE exam_targets ADD COLUMN midterm_score REAL NOT NULL DEFAULT 0');
  }
  if (!examNames.has('midterm_weight')) {
    await database.execAsync('ALTER TABLE exam_targets ADD COLUMN midterm_weight REAL NOT NULL DEFAULT 40');
  }
  if (!examNames.has('extras_json')) {
    await database.execAsync("ALTER TABLE exam_targets ADD COLUMN extras_json TEXT NOT NULL DEFAULT '[]'");
  }

  const reminderCols = await database.getAllAsync<{ name: string }>('PRAGMA table_info(reminders)');
  if (!reminderCols.some((c) => c.name === 'course_name')) {
    await database.execAsync("ALTER TABLE reminders ADD COLUMN course_name TEXT NOT NULL DEFAULT ''");
  }

  const noteCols = await database.getAllAsync<{ name: string }>('PRAGMA table_info(notes)');
  if (!noteCols.some((c) => c.name === 'pinned')) {
    await database.execAsync('ALTER TABLE notes ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0');
  }
  if (!noteCols.some((c) => c.name === 'image_uri')) {
    await database.execAsync("ALTER TABLE notes ADD COLUMN image_uri TEXT NOT NULL DEFAULT ''");
  }
}

async function migrateNotesColumns(database: SQLite.SQLiteDatabase): Promise<void> {
  const info = await database.getAllAsync<{ name: string }>('PRAGMA table_info(notes)');
  const names = new Set(info.map((col) => col.name));
  if (!names.has('course_name')) {
    await database.execAsync("ALTER TABLE notes ADD COLUMN course_name TEXT NOT NULL DEFAULT ''");
  }
}

async function migrateScheduleColumns(database: SQLite.SQLiteDatabase): Promise<void> {
  const info = await database.getAllAsync<{ name: string }>('PRAGMA table_info(schedule)');
  const names = new Set(info.map((col) => col.name));
  if (!names.has('remind_hours')) {
    await database.execAsync(
      'ALTER TABLE schedule ADD COLUMN remind_hours INTEGER NOT NULL DEFAULT 0'
    );
  }
  if (!names.has('notification_id')) {
    await database.execAsync('ALTER TABLE schedule ADD COLUMN notification_id TEXT');
  }
  if (!names.has('color')) {
    await database.execAsync("ALTER TABLE schedule ADD COLUMN color TEXT NOT NULL DEFAULT '#4F46E5'");
  }
}

function parseExtras(raw: string | null | undefined): ExamExtra[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({
        score: Number((item as ExamExtra).score),
        weight: Number((item as ExamExtra).weight),
      }))
      .filter((item) => Number.isFinite(item.score) && Number.isFinite(item.weight));
  } catch {
    return [];
  }
}

function mapCourse(row: CourseRow): Course {
  const letter: LetterGrade = isLetterGrade(row.letter) ? row.letter : 'FF';
  return {
    id: row.id,
    name: row.name,
    ects: row.ects,
    letter,
    points: row.points,
    score100: row.score100,
    semester: row.semester ?? '',
  };
}

export async function getCourses(): Promise<Course[]> {
  const rows = await getDb().getAllAsync<CourseRow>(
    'SELECT * FROM courses ORDER BY id DESC'
  );
  return rows.map(mapCourse);
}

export async function getMorningSummaryEnabled(): Promise<boolean> {
  const value = await getSetting('morning_summary');
  return value !== '0';
}

export async function setMorningSummaryEnabled(enabled: boolean): Promise<void> {
  await setSetting('morning_summary', enabled ? '1' : '0');
}

export async function getActiveSemester(): Promise<string> {
  const value = await getSetting('active_semester');
  return value?.trim() || '2025-2026 Güz';
}

export async function setActiveSemester(value: string): Promise<void> {
  await setSetting('active_semester', value.trim() || '2025-2026 Güz');
}

export async function insertCourse(input: {
  name: string;
  ects: number;
  letter: LetterGrade;
  score100: number | null;
  semester?: string;
}): Promise<Course> {
  const points = pointsFromLetter(input.letter);
  const semester = input.semester ?? (await getActiveSemester());
  const result = await getDb().runAsync(
    'INSERT INTO courses (name, ects, letter, points, score100, semester) VALUES (?, ?, ?, ?, ?, ?)',
    input.name,
    input.ects,
    input.letter,
    points,
    input.score100,
    semester
  );
  return {
    id: Number(result.lastInsertRowId),
    name: input.name,
    ects: input.ects,
    letter: input.letter,
    points,
    score100: input.score100,
    semester,
  };
}

export async function deleteCourse(id: number): Promise<void> {
  await getDb().runAsync('DELETE FROM courses WHERE id = ?', id);
}

export async function getSchedule(): Promise<ScheduleItem[]> {
  const rows = await getDb().getAllAsync<ScheduleRow>(
    'SELECT * FROM schedule ORDER BY start_time ASC'
  );
  return rows.map((row) => ({
    id: row.id,
    weekday: row.weekday as Weekday,
    title: row.title,
    startTime: row.start_time,
    endTime: row.end_time,
    room: row.room,
    remindHours: ([0, 1, 2, 3].includes(row.remind_hours ?? 0)
      ? (row.remind_hours ?? 0)
      : 0) as ScheduleItem['remindHours'],
    notificationId: row.notification_id ?? null,
    color: row.color || COURSE_COLORS[0],
  }));
}

export async function insertScheduleItem(input: {
  weekday: Weekday;
  title: string;
  startTime: string;
  endTime: string;
  room: string;
  remindHours?: ScheduleItem['remindHours'];
  notificationId?: string | null;
  color?: string;
}): Promise<ScheduleItem> {
  const remindHours = input.remindHours ?? 0;
  const notificationId = input.notificationId ?? null;
  const color = input.color || COURSE_COLORS[0];
  const result = await getDb().runAsync(
    'INSERT INTO schedule (weekday, title, start_time, end_time, room, remind_hours, notification_id, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    input.weekday,
    input.title,
    input.startTime,
    input.endTime,
    input.room,
    remindHours,
    notificationId,
    color
  );
  return {
    id: Number(result.lastInsertRowId),
    weekday: input.weekday,
    title: input.title,
    startTime: input.startTime,
    endTime: input.endTime,
    room: input.room,
    remindHours,
    notificationId,
    color,
  };
}

export async function updateScheduleReminder(
  id: number,
  remindHours: ScheduleItem['remindHours'],
  notificationId: string | null
): Promise<void> {
  await getDb().runAsync(
    'UPDATE schedule SET remind_hours = ?, notification_id = ? WHERE id = ?',
    remindHours,
    notificationId,
    id
  );
}

export async function deleteScheduleItem(id: number): Promise<void> {
  await getDb().runAsync('DELETE FROM schedule WHERE id = ?', id);
}

export async function getReminders(): Promise<Reminder[]> {
  const rows = await getDb().getAllAsync<ReminderRow>(
    'SELECT * FROM reminders ORDER BY due_at ASC'
  );
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    kind: row.kind as ReminderKind,
    dueAt: row.due_at,
    notificationId: row.notification_id,
    done: row.done === 1,
    courseName: (row as { course_name?: string }).course_name ?? '',
  }));
}

export async function insertReminder(input: {
  title: string;
  kind: ReminderKind;
  dueAt: string;
  notificationId: string | null;
  courseName?: string;
}): Promise<Reminder> {
  const courseName = input.courseName?.trim() ?? '';
  const result = await getDb().runAsync(
    'INSERT INTO reminders (title, kind, due_at, notification_id, done, course_name) VALUES (?, ?, ?, ?, 0, ?)',
    input.title,
    input.kind,
    input.dueAt,
    input.notificationId,
    courseName
  );
  return {
    id: Number(result.lastInsertRowId),
    title: input.title,
    kind: input.kind,
    dueAt: input.dueAt,
    notificationId: input.notificationId,
    done: false,
    courseName,
  };
}

export async function updateReminderNotification(
  id: number,
  notificationId: string | null
): Promise<void> {
  await getDb().runAsync('UPDATE reminders SET notification_id = ? WHERE id = ?', notificationId, id);
}

export async function setReminderDone(id: number, done: boolean): Promise<void> {
  await getDb().runAsync('UPDATE reminders SET done = ? WHERE id = ?', done ? 1 : 0, id);
}

export async function deleteReminder(id: number): Promise<void> {
  await getDb().runAsync('DELETE FROM reminders WHERE id = ?', id);
}

export async function getSetting(key: string): Promise<string | null> {
  const row = await getDb().getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    key
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await getDb().runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    key,
    value
  );
}

export async function getThemeSetting(): Promise<ThemeName> {
  const value = await getSetting('theme');
  return value === 'dark' ? 'dark' : 'light';
}

export async function getExamTargets(): Promise<ExamTarget[]> {
  const rows = await getDb().getAllAsync<{
    id: number;
    name: string;
    year_points: number;
    required_final: number;
    passing?: number | null;
    midterm_score?: number | null;
    midterm_weight?: number | null;
    extras_json?: string | null;
  }>('SELECT * FROM exam_targets ORDER BY id DESC');
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    yearPoints: row.year_points,
    requiredFinal: row.required_final,
    passing: row.passing ?? 60,
    midtermScore: row.midterm_score ?? 0,
    midtermWeight: row.midterm_weight ?? 40,
    extras: parseExtras(row.extras_json),
  }));
}

export async function insertExamTarget(input: {
  name: string;
  yearPoints: number;
  requiredFinal: number;
  passing?: number;
  midtermScore?: number;
  midtermWeight?: number;
  extras?: ExamExtra[];
}): Promise<ExamTarget> {
  const passing = input.passing ?? 60;
  const midtermScore = input.midtermScore ?? 0;
  const midtermWeight = input.midtermWeight ?? 40;
  const extras = input.extras ?? [];
  const result = await getDb().runAsync(
    `INSERT INTO exam_targets (name, year_points, required_final, passing, midterm_score, midterm_weight, extras_json)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    input.name,
    input.yearPoints,
    input.requiredFinal,
    passing,
    midtermScore,
    midtermWeight,
    JSON.stringify(extras)
  );
  return {
    id: Number(result.lastInsertRowId),
    name: input.name,
    yearPoints: input.yearPoints,
    requiredFinal: input.requiredFinal,
    passing,
    midtermScore,
    midtermWeight,
    extras,
  };
}

export async function deleteExamTarget(id: number): Promise<void> {
  await getDb().runAsync('DELETE FROM exam_targets WHERE id = ?', id);
}

export async function updateExamTarget(
  id: number,
  input: {
    name: string;
    yearPoints: number;
    requiredFinal: number;
    passing?: number;
    midtermScore?: number;
    midtermWeight?: number;
    extras?: ExamExtra[];
  }
): Promise<void> {
  await getDb().runAsync(
    `UPDATE exam_targets SET name = ?, year_points = ?, required_final = ?,
     passing = ?, midterm_score = ?, midterm_weight = ?, extras_json = ? WHERE id = ?`,
    input.name,
    input.yearPoints,
    input.requiredFinal,
    input.passing ?? 60,
    input.midtermScore ?? 0,
    input.midtermWeight ?? 40,
    JSON.stringify(input.extras ?? []),
    id
  );
}

export async function getAttendance(): Promise<AttendanceItem[]> {
  const rows = await getDb().getAllAsync<{
    id: number;
    name: string;
    used: number;
    max_limit: number;
  }>('SELECT * FROM attendance ORDER BY id DESC');
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    used: row.used,
    limit: row.max_limit,
  }));
}

export async function insertAttendance(input: {
  name: string;
  limit: number;
}): Promise<AttendanceItem> {
  const result = await getDb().runAsync(
    'INSERT INTO attendance (name, used, max_limit) VALUES (?, 0, ?)',
    input.name,
    input.limit
  );
  return {
    id: Number(result.lastInsertRowId),
    name: input.name,
    used: 0,
    limit: input.limit,
  };
}

export async function updateAttendanceUsed(id: number, used: number): Promise<void> {
  await getDb().runAsync('UPDATE attendance SET used = ? WHERE id = ?', used, id);
}

export async function deleteAttendance(id: number): Promise<void> {
  await getDb().runAsync('DELETE FROM attendance WHERE id = ?', id);
}

export async function insertAttendanceFull(input: {
  name: string;
  used: number;
  limit: number;
}): Promise<AttendanceItem> {
  const result = await getDb().runAsync(
    'INSERT INTO attendance (name, used, max_limit) VALUES (?, ?, ?)',
    input.name,
    input.used,
    input.limit
  );
  return {
    id: Number(result.lastInsertRowId),
    name: input.name,
    used: input.used,
    limit: input.limit,
  };
}

export async function getNotes(): Promise<Note[]> {
  const rows = await getDb().getAllAsync<{
    id: number;
    title: string;
    body: string;
    created_at: string;
    course_name?: string | null;
  }>('SELECT * FROM notes ORDER BY pinned DESC, id DESC');
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    courseName: row.course_name ?? '',
    createdAt: row.created_at,
    pinned: Boolean((row as { pinned?: number }).pinned),
    imageUri: (row as { image_uri?: string }).image_uri ?? '',
  }));
}

export async function setNotePinned(id: number, pinned: boolean): Promise<void> {
  await getDb().runAsync('UPDATE notes SET pinned = ? WHERE id = ?', pinned ? 1 : 0, id);
}

export async function insertNote(input: {
  title: string;
  body: string;
  courseName?: string;
  pinned?: boolean;
  imageUri?: string;
}): Promise<Note> {
  const createdAt = new Date().toISOString();
  const courseName = input.courseName?.trim() ?? '';
  const pinned = input.pinned ? 1 : 0;
  const imageUri = input.imageUri?.trim() ?? '';
  const result = await getDb().runAsync(
    'INSERT INTO notes (title, body, course_name, created_at, pinned, image_uri) VALUES (?, ?, ?, ?, ?, ?)',
    input.title,
    input.body,
    courseName,
    createdAt,
    pinned,
    imageUri
  );
  return {
    id: Number(result.lastInsertRowId),
    title: input.title,
    body: input.body,
    courseName,
    createdAt,
    pinned: Boolean(pinned),
    imageUri,
  };
}

export async function deleteNote(id: number): Promise<void> {
  await getDb().runAsync('DELETE FROM notes WHERE id = ?', id);
}

export async function updateNote(
  id: number,
  input: { title: string; body: string; courseName?: string; imageUri?: string }
): Promise<void> {
  await getDb().runAsync(
    'UPDATE notes SET title = ?, body = ?, course_name = ?, image_uri = ? WHERE id = ?',
    input.title,
    input.body,
    input.courseName?.trim() ?? '',
    input.imageUri?.trim() ?? '',
    id
  );
}

export async function updateCourse(
  id: number,
  input: { name: string; ects: number; letter: LetterGrade; score100: number | null }
): Promise<void> {
  const points = pointsFromLetter(input.letter);
  await getDb().runAsync(
    'UPDATE courses SET name = ?, ects = ?, letter = ?, points = ?, score100 = ? WHERE id = ?',
    input.name,
    input.ects,
    input.letter,
    points,
    input.score100,
    id
  );
}

export async function updateScheduleItem(
  id: number,
  input: {
    weekday: Weekday;
    title: string;
    startTime: string;
    endTime: string;
    room: string;
    color: string;
    remindHours: ScheduleItem['remindHours'];
    notificationId: string | null;
  }
): Promise<void> {
  await getDb().runAsync(
    `UPDATE schedule SET weekday = ?, title = ?, start_time = ?, end_time = ?, room = ?,
     color = ?, remind_hours = ?, notification_id = ? WHERE id = ?`,
    input.weekday,
    input.title,
    input.startTime,
    input.endTime,
    input.room,
    input.color,
    input.remindHours,
    input.notificationId,
    id
  );
}

export async function updateAttendance(
  id: number,
  input: { name: string; limit: number; used: number }
): Promise<void> {
  await getDb().runAsync(
    'UPDATE attendance SET name = ?, max_limit = ?, used = ? WHERE id = ?',
    input.name,
    input.limit,
    input.used,
    id
  );
}

export async function updateReminder(
  id: number,
  input: {
    title: string;
    kind: ReminderKind;
    dueAt: string;
    notificationId: string | null;
    courseName?: string;
  }
): Promise<void> {
  await getDb().runAsync(
    'UPDATE reminders SET title = ?, kind = ?, due_at = ?, notification_id = ?, course_name = ? WHERE id = ?',
    input.title,
    input.kind,
    input.dueAt,
    input.notificationId,
    input.courseName?.trim() ?? '',
    id
  );
}

export async function getOnboardingDone(): Promise<boolean> {
  const value = await getSetting('onboarding_done');
  return value === '1';
}

export async function setOnboardingDone(done: boolean): Promise<void> {
  await setSetting('onboarding_done', done ? '1' : '0');
}

export async function getIntroDone(): Promise<boolean> {
  const value = await getSetting('intro_done');
  return value === '1';
}

export async function setIntroDone(done: boolean): Promise<void> {
  await setSetting('intro_done', done ? '1' : '0');
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const raw = await getSetting('profile');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      firstName: typeof parsed.firstName === 'string' ? parsed.firstName : '',
      lastName: typeof parsed.lastName === 'string' ? parsed.lastName : '',
      department: typeof parsed.department === 'string' ? parsed.department : '',
      university: typeof parsed.university === 'string' ? parsed.university : '',
      year: typeof parsed.year === 'string' ? parsed.year : '',
    };
  } catch {
    return null;
  }
}

export async function setUserProfile(profile: UserProfile): Promise<void> {
  await setSetting('profile', JSON.stringify(profile));
}

export async function wipeUserTables(): Promise<void> {
  await getDb().execAsync(`
    DELETE FROM courses;
    DELETE FROM schedule;
    DELETE FROM reminders;
    DELETE FROM exam_targets;
    DELETE FROM attendance;
    DELETE FROM notes;
  `);
}
