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
  getIntroDone,
  getOnboardingDone,
  getUserProfile,
  getActiveSemester,
  getMorningSummaryEnabled,
  setActiveSemester as persistActiveSemester,
  setMorningSummaryEnabled as persistMorningSummaryEnabled,
  initDb,
  insertAttendance,
  insertAttendanceFull,
  insertCourse,
  insertExamTarget,
  insertNote,
  insertReminder,
  insertScheduleItem,
  setIntroDone,
  setOnboardingDone,
  setUserProfile,
  setReminderDone,
  setSetting,
  updateAttendance as updateAttendanceRow,
  updateAttendanceUsed,
  updateCourse as updateCourseRow,
  updateExamTarget as updateExamTargetRow,
  updateNote as updateNoteRow,
  updateReminder as updateReminderRow,
  updateReminderNotification,
  updateScheduleItem as updateScheduleItemRow,
  updateScheduleReminder,
  setNotePinned,
  wipeUserTables,
} from '@/lib/database';
import { isProfileComplete } from '@/lib/profile';
import { colorForCourseName } from '@/lib/courseColor';
import { hasAttendanceForName, hasGradeForName } from '@/lib/courseCatalog';
import { letterFromScore } from '@/lib/gpa';
import { buildMorningSummary } from '@/lib/morningSummary';
import {
  cancelMorningSummaryNotification,
  cancelReminderNotification,
  scheduleClassReminderNotification,
  scheduleMorningSummaryNotification,
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
  UserProfile,
  Weekday,
} from '@/lib/types';

type AppState = {
  ready: boolean;
  theme: ThemeName;
  onboardingDone: boolean;
  introDone: boolean;
  profile: UserProfile | null;
  profileComplete: boolean;
  courses: Course[];
  schedule: ScheduleItem[];
  reminders: Reminder[];
  examTargets: ExamTarget[];
  attendance: AttendanceItem[];
  notes: Note[];
  activeSemester: string;
  morningSummaryEnabled: boolean;
  hydrate: () => Promise<void>;
  refreshMorningSummary: () => Promise<void>;
  setMorningSummaryEnabled: (enabled: boolean) => Promise<void>;
  setTheme: (theme: ThemeName) => Promise<void>;
  setActiveSemester: (value: string) => Promise<void>;
  toggleTheme: () => Promise<void>;
  completeIntro: () => Promise<void>;
  saveProfile: (input: UserProfile) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  addCourse: (input: {
    name: string;
    ects: number;
    letter?: LetterGrade;
    score100?: number | null;
  }) => Promise<void>;
  updateCourse: (
    id: number,
    input: {
      name: string;
      ects: number;
      letter?: LetterGrade;
      score100?: number | null;
    }
  ) => Promise<void>;
  removeCourse: (id: number) => Promise<void>;
  addScheduleItem: (input: {
    weekday: Weekday;
    title: string;
    startTime: string;
    endTime: string;
    room: string;
    remindHours?: 0 | 1 | 2 | 3;
    color?: string;
  }) => Promise<{ notified: boolean }>;
  updateScheduleItem: (
    id: number,
    input: {
      weekday: Weekday;
      title: string;
      startTime: string;
      endTime: string;
      room: string;
      remindHours?: 0 | 1 | 2 | 3;
      color?: string;
    }
  ) => Promise<{ notified: boolean }>;
  removeScheduleItem: (id: number) => Promise<void>;
  setClassReminder: (id: number, hours: 0 | 1 | 2 | 3) => Promise<{ notified: boolean }>;
  addReminder: (input: {
    title: string;
    kind: ReminderKind;
    dueAt: Date;
    courseName?: string;
  }) => Promise<{ notified: boolean }>;
  updateReminder: (
    id: number,
    input: { title: string; kind: ReminderKind; dueAt: Date; courseName?: string }
  ) => Promise<{ notified: boolean }>;
  toggleReminder: (id: number) => Promise<void>;
  removeReminder: (id: number) => Promise<void>;
  addExamTarget: (input: {
    name: string;
    yearPoints: number;
    requiredFinal: number;
    passing?: number;
    midtermScore?: number;
    midtermWeight?: number;
    extras?: { score: number; weight: number }[];
  }) => Promise<void>;
  updateExamTarget: (
    id: number,
    input: {
      name: string;
      yearPoints: number;
      requiredFinal: number;
      passing?: number;
      midtermScore?: number;
      midtermWeight?: number;
      extras?: { score: number; weight: number }[];
    }
  ) => Promise<void>;
  removeExamTarget: (id: number) => Promise<void>;
  addAttendance: (input: { name: string; limit: number }) => Promise<void>;
  updateAttendance: (id: number, input: { name: string; limit: number }) => Promise<void>;
  bumpAttendance: (id: number, delta: number) => Promise<void>;
  removeAttendance: (id: number) => Promise<void>;
  addNote: (input: { title: string; body: string; courseName?: string; imageUri?: string }) => Promise<void>;
  updateNote: (
    id: number,
    input: { title: string; body: string; courseName?: string; imageUri?: string }
  ) => Promise<void>;
  removeNote: (id: number) => Promise<void>;
  toggleNotePinned: (id: number) => Promise<void>;
  ensureAttendanceForCourse: (name: string, limit?: number) => Promise<void>;
  ensureGradeForCourse: (name: string, ects?: number) => Promise<void>;
  importBackup: (raw: string) => Promise<void>;
};

async function syncMorningSummary(input: {
  schedule: ScheduleItem[];
  reminders: Reminder[];
  enabled: boolean;
}) {
  if (!input.enabled) {
    await cancelMorningSummaryNotification();
    return;
  }
  const summary = buildMorningSummary(input.schedule, input.reminders);
  await scheduleMorningSummaryNotification({ title: summary.title, body: summary.body });
}

async function loadAll() {
  const [courses, schedule, reminders, examTargets, attendance, notes, theme, onboardingDone, introDone, profile, activeSemester, morningSummaryEnabled] =
    await Promise.all([
      getCourses(),
      getSchedule(),
      getReminders(),
      getExamTargets(),
      getAttendance(),
      getNotes(),
      getThemeSetting(),
      getOnboardingDone(),
      getIntroDone(),
      getUserProfile(),
      getActiveSemester(),
      getMorningSummaryEnabled(),
    ]);
  const profileComplete = isProfileComplete(profile);
  return {
    courses,
    schedule,
    reminders,
    examTargets,
    attendance,
    notes,
    theme,
    onboardingDone: onboardingDone && profileComplete,
    introDone: introDone || onboardingDone,
    profile,
    profileComplete,
    activeSemester,
    morningSummaryEnabled,
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  ready: false,
  theme: 'light',
  onboardingDone: false,
  introDone: false,
  profile: null,
  profileComplete: false,
  courses: [],
  schedule: [],
  reminders: [],
  examTargets: [],
  attendance: [],
  notes: [],
  activeSemester: '2025-2026 Güz',
  morningSummaryEnabled: true,

  hydrate: async () => {
    await initDb();
    const data = await loadAll();
    set({ ...data, ready: true });
    await syncMorningSummary({
      schedule: data.schedule,
      reminders: data.reminders,
      enabled: data.morningSummaryEnabled,
    });
  },

  refreshMorningSummary: async () => {
    const { schedule, reminders, morningSummaryEnabled } = get();
    await syncMorningSummary({ schedule, reminders, enabled: morningSummaryEnabled });
  },

  setMorningSummaryEnabled: async (enabled) => {
    await persistMorningSummaryEnabled(enabled);
    set({ morningSummaryEnabled: enabled });
    await get().refreshMorningSummary();
  },

  setTheme: async (theme) => {
    await setSetting('theme', theme);
    set({ theme });
  },

  setActiveSemester: async (value) => {
    const trimmed = value.trim() || '2025-2026 Güz';
    await persistActiveSemester(trimmed);
    set({ activeSemester: trimmed });
  },

  toggleTheme: async () => {
    const next = get().theme === 'light' ? 'dark' : 'light';
    await get().setTheme(next);
  },

  completeIntro: async () => {
    await setIntroDone(true);
    set({ introDone: true });
  },

  saveProfile: async (input) => {
    const profile: UserProfile = {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      department: input.department.trim(),
      university: input.university.trim(),
      year: input.year.trim(),
    };
    await setUserProfile(profile);
    await setOnboardingDone(true);
    set({ profile, profileComplete: isProfileComplete(profile), onboardingDone: true });
  },

  completeOnboarding: async () => {
    await setOnboardingDone(true);
    set({ onboardingDone: true });
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

  updateCourse: async (id, input) => {
    const letter = input.letter ?? letterFromScore(input.score100 ?? 0);
    await updateCourseRow(id, {
      name: input.name,
      ects: input.ects,
      letter,
      score100: input.score100 ?? null,
    });
    set({ courses: await getCourses() });
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
    const color = colorForCourseName(input.title, get().schedule);
    const item = await insertScheduleItem({
      ...input,
      color,
      remindHours,
      notificationId,
    });
    set({
      schedule: [...get().schedule, item].sort((a, b) => a.startTime.localeCompare(b.startTime)),
    });
    await get().refreshMorningSummary();
    return { notified: remindHours === 0 || Boolean(notificationId) };
  },

  removeScheduleItem: async (id) => {
    const current = get().schedule.find((item) => item.id === id);
    if (current) {
      await cancelReminderNotification(current.notificationId);
    }
    await deleteScheduleItem(id);
    set({ schedule: get().schedule.filter((item) => item.id !== id) });
    await get().refreshMorningSummary();
  },

  updateScheduleItem: async (id, input) => {
    const current = get().schedule.find((item) => item.id === id);
    if (!current) return { notified: false };
    const remindHours = input.remindHours ?? current.remindHours;
    await cancelReminderNotification(current.notificationId);
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
    const color = colorForCourseName(
      input.title,
      get().schedule.filter((item) => item.id !== id)
    );
    await updateScheduleItemRow(id, {
      weekday: input.weekday,
      title: input.title,
      startTime: input.startTime,
      endTime: input.endTime,
      room: input.room,
      color,
      remindHours,
      notificationId,
    });
    set({
      schedule: get()
        .schedule.map((item) =>
          item.id === id
            ? {
                ...item,
                weekday: input.weekday,
                title: input.title,
                startTime: input.startTime,
                endTime: input.endTime,
                room: input.room,
                color,
                remindHours,
                notificationId,
              }
            : item
        )
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    });
    await get().refreshMorningSummary();
    return { notified: remindHours === 0 || Boolean(notificationId) };
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
      courseName: input.courseName,
    });
    set({
      reminders: [...get().reminders, reminder].sort((a, b) => a.dueAt.localeCompare(b.dueAt)),
    });
    await get().refreshMorningSummary();
    return { notified: Boolean(notificationId) };
  },

  toggleReminder: async (id) => {
    const current = get().reminders.find((item) => item.id === id);
    if (!current) return;
    const nextDone = !current.done;
    let notificationId: string | null = current.notificationId;
    if (nextDone) {
      await cancelReminderNotification(current.notificationId);
      notificationId = null;
      await updateReminderNotification(id, null);
    } else {
      const dueAt = new Date(current.dueAt);
      notificationId =
        dueAt.getTime() > Date.now()
          ? await scheduleReminderNotification({
              title: current.title,
              kind: current.kind,
              dueAt,
            })
          : null;
      await updateReminderNotification(id, notificationId);
    }
    await setReminderDone(id, nextDone);
    set({
      reminders: get().reminders.map((item) =>
        item.id === id ? { ...item, done: nextDone, notificationId } : item
      ),
    });
    await get().refreshMorningSummary();
  },

  removeReminder: async (id) => {
    const current = get().reminders.find((item) => item.id === id);
    if (current) {
      await cancelReminderNotification(current.notificationId);
    }
    await deleteReminder(id);
    set({ reminders: get().reminders.filter((item) => item.id !== id) });
    await get().refreshMorningSummary();
  },

  updateReminder: async (id, input) => {
    const current = get().reminders.find((item) => item.id === id);
    if (!current) return { notified: false };
    await cancelReminderNotification(current.notificationId);
    const notificationId =
      !current.done && input.dueAt.getTime() > Date.now()
        ? await scheduleReminderNotification({
            title: input.title,
            kind: input.kind,
            dueAt: input.dueAt,
          })
        : null;
    await updateReminderRow(id, {
      title: input.title,
      kind: input.kind,
      dueAt: input.dueAt.toISOString(),
      notificationId,
      courseName: input.courseName ?? current.courseName,
    });
    set({
      reminders: get()
        .reminders.map((item) =>
          item.id === id
            ? {
                ...item,
                title: input.title,
                kind: input.kind,
                dueAt: input.dueAt.toISOString(),
                notificationId,
                courseName: input.courseName?.trim() ?? item.courseName,
              }
            : item
        )
        .sort((a, b) => a.dueAt.localeCompare(b.dueAt)),
    });
    await get().refreshMorningSummary();
    return { notified: Boolean(notificationId) || current.done };
  },

  addExamTarget: async (input) => {
    const item = await insertExamTarget(input);
    set({ examTargets: [item, ...get().examTargets] });
  },

  updateExamTarget: async (id, input) => {
    await updateExamTargetRow(id, input);
    set({
      examTargets: get().examTargets.map((item) =>
        item.id === id
          ? {
              ...item,
              ...input,
              extras: input.extras ?? item.extras,
            }
          : item
      ),
    });
  },

  removeExamTarget: async (id) => {
    await deleteExamTarget(id);
    set({ examTargets: get().examTargets.filter((item) => item.id !== id) });
  },

  addAttendance: async (input) => {
    const item = await insertAttendance(input);
    set({ attendance: [item, ...get().attendance] });
  },

  updateAttendance: async (id, input) => {
    const current = get().attendance.find((item) => item.id === id);
    if (!current) return;
    const used = Math.min(current.used, input.limit);
    await updateAttendanceRow(id, { name: input.name, limit: input.limit, used });
    set({
      attendance: get().attendance.map((item) =>
        item.id === id ? { ...item, name: input.name, limit: input.limit, used } : item
      ),
    });
  },

  bumpAttendance: async (id, delta) => {
    const current = get().attendance.find((item) => item.id === id);
    if (!current) return;
    const used = Math.min(current.limit, Math.max(0, current.used + delta));
    if (used === current.used) return;
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

  updateNote: async (id, input) => {
    await updateNoteRow(id, input);
    set({
      notes: get().notes.map((note) =>
        note.id === id
          ? {
              ...note,
              title: input.title,
              body: input.body,
              courseName: input.courseName?.trim() ?? note.courseName,
              imageUri: input.imageUri !== undefined ? input.imageUri : note.imageUri,
            }
          : note
      ),
    });
  },

  removeNote: async (id) => {
    await deleteNote(id);
    set({ notes: get().notes.filter((note) => note.id !== id) });
  },

  toggleNotePinned: async (id) => {
    const note = get().notes.find((item) => item.id === id);
    if (!note) return;
    const pinned = !note.pinned;
    await setNotePinned(id, pinned);
    set({
      notes: get()
        .notes.map((item) => (item.id === id ? { ...item, pinned } : item))
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.id - a.id),
    });
  },

  ensureAttendanceForCourse: async (name, limit = 4) => {
    const trimmed = name.trim();
    if (!trimmed || hasAttendanceForName(trimmed, get().attendance)) return;
    await get().addAttendance({ name: trimmed, limit });
  },

  ensureGradeForCourse: async (name, ects = 5) => {
    const trimmed = name.trim();
    if (!trimmed || hasGradeForName(trimmed, get().courses)) return;
    await get().addCourse({ name: trimmed, ects });
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

    if (data.profile && isProfileComplete(data.profile)) {
      await setUserProfile(data.profile);
      await setOnboardingDone(true);
    }

    if (data.activeSemester?.trim()) {
      await persistActiveSemester(data.activeSemester);
    }
    if (typeof data.morningSummaryEnabled === 'boolean') {
      await persistMorningSummaryEnabled(data.morningSummaryEnabled);
    }

    for (const course of data.courses) {
      await insertCourse({
        name: course.name,
        ects: course.ects,
        letter: course.letter,
        score100: course.score100,
        semester: course.semester,
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
        color: colorForCourseName(item.title, data.schedule),
      });
    }
    for (const target of data.examTargets) {
      await insertExamTarget({
        name: target.name,
        yearPoints: target.yearPoints,
        requiredFinal: target.requiredFinal,
        passing: target.passing,
        midtermScore: target.midtermScore,
        midtermWeight: target.midtermWeight,
        extras: target.extras,
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
      await insertNote({
        title: note.title,
        body: note.body,
        courseName: note.courseName ?? '',
        imageUri: note.imageUri,
        pinned: note.pinned,
      });
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
        courseName: reminder.courseName,
      });
      if (reminder.done) {
        await setReminderDone(row.id, true);
      }
    }

    set({ ...(await loadAll()), ready: true });
    await get().refreshMorningSummary();
  },
}));
