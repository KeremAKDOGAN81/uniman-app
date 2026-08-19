import { create } from 'zustand';

import { parseBackup, type UniManBackup } from '@/lib/backup';
import {
  deleteAttendance,
  deleteCourse,
  deleteExamTarget,
  deleteNote,
  deleteReminder,
  deleteScheduleItem,
  getAttendance,
  getCourses,
  getExamTargets,
  getNotes,
  getReminders,
  getSchedule,
  getThemeSetting,
  initDb,
  insertAttendance,
  insertAttendanceFull,
  insertCourse,
  insertExamTarget,
  insertNote,
  insertReminder,
  insertScheduleItem,
  setReminderDone,
  setSetting,
  updateAttendanceUsed,
  updateScheduleReminder,
  wipeUserTables,
} from '@/lib/database';
import { letterFromScore } from '@/lib/gpa';
import {
  cancelReminderNotification,
  scheduleClassReminderNotification,
  scheduleReminderNotification,
} from '@/lib/notifications';
import { WEEKDAYS } from '@/lib/types';
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

type AppState = {
  ready: boolean;
  theme: ThemeName;
  courses: Course[];
  schedule: ScheduleItem[];
  reminders: Reminder[];
  examTargets: ExamTarget[];
  attendance: AttendanceItem[];
  notes: Note[];
  hydrate: () => Promise<void>;
  setTheme: (theme: ThemeName) => Promise<void>;
  toggleTheme: () => Promise<void>;
  addCourse: (input: {
    name: string;
    ects: number;
    letter?: LetterGrade;
    score100?: number | null;
  }) => Promise<void>;
  removeCourse: (id: number) => Promise<void>;
  addScheduleItem: (input: {
    weekday: Weekday;
    title: string;
    startTime: string;
    endTime: string;
    room: string;
    remindHours?: 0 | 1 | 2 | 3;
  }) => Promise<{ notified: boolean }>;
  removeScheduleItem: (id: number) => Promise<void>;
  setClassReminder: (id: number, hours: 0 | 1 | 2 | 3) => Promise<{ notified: boolean }>;
  addReminder: (input: {
    title: string;
    kind: ReminderKind;
    dueAt: Date;
  }) => Promise<{ notified: boolean }>;
  toggleReminder: (id: number) => Promise<void>;
  removeReminder: (id: number) => Promise<void>;
  addExamTarget: (input: {
    name: string;
    yearPoints: number;
    requiredFinal: number;
  }) => Promise<void>;
  removeExamTarget: (id: number) => Promise<void>;
  addAttendance: (input: { name: string; limit: number }) => Promise<void>;
  bumpAttendance: (id: number, delta: number) => Promise<void>;
  removeAttendance: (id: number) => Promise<void>;
  addNote: (input: { title: string; body: string }) => Promise<void>;
  removeNote: (id: number) => Promise<void>;
  importBackup: (raw: string) => Promise<void>;
};

async function loadAll() {
  const [courses, schedule, reminders, examTargets, attendance, notes, theme] = await Promise.all([
    getCourses(),
    getSchedule(),
    getReminders(),
    getExamTargets(),
    getAttendance(),
    getNotes(),
    getThemeSetting(),
  ]);
  return { courses, schedule, reminders, examTargets, attendance, notes, theme };
}

export const useAppStore = create<AppState>((set, get) => ({
  ready: false,
  theme: 'light',
  courses: [],
  schedule: [],
  reminders: [],
  examTargets: [],
  attendance: [],
  notes: [],

  hydrate: async () => {
    await initDb();
    set({ ...(await loadAll()), ready: true });
  },

  setTheme: async (theme) => {
    await setSetting('theme', theme);
    set({ theme });
  },

  toggleTheme: async () => {
    const next = get().theme === 'light' ? 'dark' : 'light';
    await get().setTheme(next);
  },

  addCourse: async (input) => {
    const letter = input.letter ?? letterFromScore(input.score100 ?? 0);
    const course = await insertCourse({
      name: input.name,
      ects: input.ects,
      letter,
      score100: input.score100 ?? null,
    });
    set({ courses: [course, ...get().courses] });
  },

  removeCourse: async (id) => {
    await deleteCourse(id);
    set({ courses: get().courses.filter((course) => course.id !== id) });
  },

  addScheduleItem: async (input) => {
    const remindHours = input.remindHours ?? 0;
    let notificationId: string | null = null;
    if (remindHours === 1 || remindHours === 2 || remindHours === 3) {
      notificationId = await scheduleClassReminderNotification({
        title: input.title,
        weekday: input.weekday,
        startTime: input.startTime,
        hoursBefore: remindHours,
        room: input.room,
      });
    }
    const item = await insertScheduleItem({
      ...input,
      remindHours,
      notificationId,
    });
    set({
      schedule: [...get().schedule, item].sort((a, b) => a.startTime.localeCompare(b.startTime)),
    });
    return { notified: remindHours === 0 || Boolean(notificationId) };
  },

  removeScheduleItem: async (id) => {
    const current = get().schedule.find((item) => item.id === id);
    if (current) {
      await cancelReminderNotification(current.notificationId);
    }
    await deleteScheduleItem(id);
    set({ schedule: get().schedule.filter((item) => item.id !== id) });
  },

  setClassReminder: async (id, hours) => {
    const current = get().schedule.find((item) => item.id === id);
    if (!current) return { notified: false };
    await cancelReminderNotification(current.notificationId);
    let notificationId: string | null = null;
    if (hours === 1 || hours === 2 || hours === 3) {
      notificationId = await scheduleClassReminderNotification({
        title: current.title,
        weekday: current.weekday,
        startTime: current.startTime,
        hoursBefore: hours,
        room: current.room,
      });
    }
    await updateScheduleReminder(id, hours, notificationId);
    set({
      schedule: get().schedule.map((item) =>
        item.id === id ? { ...item, remindHours: hours, notificationId } : item
      ),
    });
    return { notified: hours === 0 || Boolean(notificationId) };
  },

  addReminder: async (input) => {
    const notificationId = await scheduleReminderNotification({
      title: input.title,
      kind: input.kind,
      dueAt: input.dueAt,
    });
    const reminder = await insertReminder({
      title: input.title,
      kind: input.kind,
      dueAt: input.dueAt.toISOString(),
      notificationId,
    });
    set({
      reminders: [...get().reminders, reminder].sort((a, b) => a.dueAt.localeCompare(b.dueAt)),
    });
    return { notified: Boolean(notificationId) };
  },

  toggleReminder: async (id) => {
    const current = get().reminders.find((item) => item.id === id);
    if (!current) return;
    const nextDone = !current.done;
    if (nextDone) {
      await cancelReminderNotification(current.notificationId);
    }
    await setReminderDone(id, nextDone);
    set({
      reminders: get().reminders.map((item) =>
        item.id === id ? { ...item, done: nextDone } : item
      ),
    });
  },

  removeReminder: async (id) => {
    const current = get().reminders.find((item) => item.id === id);
    if (current) {
      await cancelReminderNotification(current.notificationId);
    }
    await deleteReminder(id);
    set({ reminders: get().reminders.filter((item) => item.id !== id) });
  },

  addExamTarget: async (input) => {
    const item = await insertExamTarget(input);
    set({ examTargets: [item, ...get().examTargets] });
  },

  removeExamTarget: async (id) => {
    await deleteExamTarget(id);
    set({ examTargets: get().examTargets.filter((item) => item.id !== id) });
  },

  addAttendance: async (input) => {
    const item = await insertAttendance(input);
    set({ attendance: [item, ...get().attendance] });
  },

  bumpAttendance: async (id, delta) => {
    const current = get().attendance.find((item) => item.id === id);
    if (!current) return;
    const used = Math.max(0, current.used + delta);
    await updateAttendanceUsed(id, used);
    set({
      attendance: get().attendance.map((item) => (item.id === id ? { ...item, used } : item)),
    });
  },

  removeAttendance: async (id) => {
    await deleteAttendance(id);
    set({ attendance: get().attendance.filter((item) => item.id !== id) });
  },

  addNote: async (input) => {
    const note = await insertNote(input);
    set({ notes: [note, ...get().notes] });
  },

  removeNote: async (id) => {
    await deleteNote(id);
    set({ notes: get().notes.filter((note) => note.id !== id) });
  },

  importBackup: async (raw) => {
    const data: UniManBackup = parseBackup(raw);
    for (const reminder of get().reminders) {
      await cancelReminderNotification(reminder.notificationId);
    }
    for (const item of get().schedule) {
      await cancelReminderNotification(item.notificationId);
    }
    await wipeUserTables();
    await setSetting('theme', data.theme);

    for (const course of data.courses) {
      await insertCourse({
        name: course.name,
        ects: course.ects,
        letter: course.letter,
        score100: course.score100,
      });
    }
    for (const item of data.schedule) {
      if (!WEEKDAYS.includes(item.weekday)) continue;
      const hours = item.remindHours === 1 || item.remindHours === 2 || item.remindHours === 3
        ? item.remindHours
        : 0;
      let notificationId: string | null = null;
      if (hours === 1 || hours === 2 || hours === 3) {
        notificationId = await scheduleClassReminderNotification({
          title: item.title,
          weekday: item.weekday,
          startTime: item.startTime,
          hoursBefore: hours,
          room: item.room ?? '',
        });
      }
      await insertScheduleItem({
        weekday: item.weekday,
        title: item.title,
        startTime: item.startTime,
        endTime: item.endTime,
        room: item.room ?? '',
        remindHours: hours,
        notificationId,
      });
    }
    for (const target of data.examTargets) {
      await insertExamTarget({
        name: target.name,
        yearPoints: target.yearPoints,
        requiredFinal: target.requiredFinal,
      });
    }
    for (const item of data.attendance) {
      await insertAttendanceFull({
        name: item.name,
        used: item.used,
        limit: item.limit,
      });
    }
    for (const note of data.notes) {
      await insertNote({ title: note.title, body: note.body });
    }
    for (const reminder of data.reminders) {
      const dueAt = new Date(reminder.dueAt);
      if (Number.isNaN(dueAt.getTime())) continue;
      const notificationId =
        !reminder.done && dueAt.getTime() > Date.now()
          ? await scheduleReminderNotification({
              title: reminder.title,
              kind: reminder.kind,
              dueAt,
            })
          : null;
      const row = await insertReminder({
        title: reminder.title,
        kind: reminder.kind,
        dueAt: dueAt.toISOString(),
        notificationId,
      });
      if (reminder.done) {
        await setReminderDone(row.id, true);
      }
    }

    set({ ...(await loadAll()), ready: true });
  },
}));
