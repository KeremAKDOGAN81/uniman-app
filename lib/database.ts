import * as SQLite from 'expo-sqlite';

import { isLetterGrade, pointsFromLetter } from '@/lib/gpa';
import type {
  AttendanceItem,
  Course,
  ExamTarget,
  LetterGrade,
  Note,
  Reminder,
  ReminderKind,
  ScheduleItem,
  ThemeName,
  Weekday,
} from '@/lib/types';

let db: SQLite.SQLiteDatabase | null = null;

type CourseRow = {
  id: number;
  name: string;
  ects: number;
  letter: string;
  points: number;
  score100: number | null;
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
  };
}

export async function getCourses(): Promise<Course[]> {
  const rows = await getDb().getAllAsync<CourseRow>(
    'SELECT * FROM courses ORDER BY id DESC'
  );
  return rows.map(mapCourse);
}

export async function insertCourse(input: {
  name: string;
  ects: number;
  letter: LetterGrade;
  score100: number | null;
}): Promise<Course> {
  const points = pointsFromLetter(input.letter);
  const result = await getDb().runAsync(
    'INSERT INTO courses (name, ects, letter, points, score100) VALUES (?, ?, ?, ?, ?)',
    input.name,
    input.ects,
    input.letter,
    points,
    input.score100
  );
  return {
    id: Number(result.lastInsertRowId),
    name: input.name,
    ects: input.ects,
    letter: input.letter,
    points,
    score100: input.score100,
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
}): Promise<ScheduleItem> {
  const remindHours = input.remindHours ?? 0;
  const notificationId = input.notificationId ?? null;
  const result = await getDb().runAsync(
    'INSERT INTO schedule (weekday, title, start_time, end_time, room, remind_hours, notification_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    input.weekday,
    input.title,
    input.startTime,
    input.endTime,
    input.room,
    remindHours,
    notificationId
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
  }));
}

export async function insertReminder(input: {
  title: string;
  kind: ReminderKind;
  dueAt: string;
  notificationId: string | null;
}): Promise<Reminder> {
  const result = await getDb().runAsync(
    'INSERT INTO reminders (title, kind, due_at, notification_id, done) VALUES (?, ?, ?, ?, 0)',
    input.title,
    input.kind,
    input.dueAt,
    input.notificationId
  );
  return {
    id: Number(result.lastInsertRowId),
    title: input.title,
    kind: input.kind,
    dueAt: input.dueAt,
    notificationId: input.notificationId,
    done: false,
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
  }>('SELECT * FROM exam_targets ORDER BY id DESC');
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    yearPoints: row.year_points,
    requiredFinal: row.required_final,
  }));
}

export async function insertExamTarget(input: {
  name: string;
  yearPoints: number;
  requiredFinal: number;
}): Promise<ExamTarget> {
  const result = await getDb().runAsync(
    'INSERT INTO exam_targets (name, year_points, required_final) VALUES (?, ?, ?)',
    input.name,
    input.yearPoints,
    input.requiredFinal
  );
  return {
    id: Number(result.lastInsertRowId),
    ...input,
  };
}

export async function deleteExamTarget(id: number): Promise<void> {
  await getDb().runAsync('DELETE FROM exam_targets WHERE id = ?', id);
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
  }>('SELECT * FROM notes ORDER BY id DESC');
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
  }));
}

export async function insertNote(input: { title: string; body: string }): Promise<Note> {
  const createdAt = new Date().toISOString();
  const result = await getDb().runAsync(
    'INSERT INTO notes (title, body, created_at) VALUES (?, ?, ?)',
    input.title,
    input.body,
    createdAt
  );
  return {
    id: Number(result.lastInsertRowId),
    title: input.title,
    body: input.body,
    createdAt,
  };
}

export async function deleteNote(id: number): Promise<void> {
  await getDb().runAsync('DELETE FROM notes WHERE id = ?', id);
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
