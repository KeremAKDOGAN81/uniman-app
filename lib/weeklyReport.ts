import { computeWeeklySummary } from '@/lib/homeInsights';
import { computeGpa4, formatGpa } from '@/lib/gpa';
import { filterCoursesBySemester } from '@/lib/semester';
import { formatLongDate, isUpcoming } from '@/lib/dates';
import { findFreeHoursToday } from '@/lib/freeHours';
import type { AttendanceItem, Course, Note, Reminder, ScheduleItem } from '@/lib/types';
import { WEEKDAYS } from '@/lib/types';

export type WeeklyReport = {
  generatedAt: string;
  headline: string;
  sections: { title: string; lines: string[] }[];
};

export function buildWeeklyReport(input: {
  schedule: ScheduleItem[];
  reminders: Reminder[];
  attendance: AttendanceItem[];
  courses: Course[];
  notes: Note[];
  activeSemester: string;
  now?: Date;
}): WeeklyReport {
  const now = input.now ?? new Date();
  const semesterCourses = filterCoursesBySemester(input.courses, input.activeSemester);
  const summary = computeWeeklySummary({
    scheduleCount: input.schedule.length,
    reminders: input.reminders,
    attendance: input.attendance,
    courses: semesterCourses,
    now,
  });

  const openExams = input.reminders.filter(
    (item) => !item.done && item.kind === 'sinav' && isUpcoming(item.dueAt)
  );
  const openTasks = input.reminders.filter(
    (item) => !item.done && item.kind === 'odev' && isUpcoming(item.dueAt)
  );
  const attendanceHot = input.attendance.filter((item) => item.used / item.limit >= 0.75);
  const freeToday = findFreeHoursToday(input.schedule);
  const gpa = semesterCourses.length ? formatGpa(computeGpa4(semesterCourses)) : null;

  const byDay = WEEKDAYS.map((day) => ({
    day,
    count: input.schedule.filter((item) => item.weekday === day).length,
  }));

  return {
    generatedAt: formatLongDate(now),
    headline: summary.line,
    sections: [
      {
        title: 'Program',
        lines: [
          `Toplam ${input.schedule.length} ders slotu`,
          ...byDay.map((row) => `${row.day}: ${row.count} ders`),
          freeToday.length
            ? `Bugün ${freeToday.length} boş zaman dilimi (${freeToday
                .slice(0, 2)
                .map((s) => `${s.startTime}–${s.endTime}`)
                .join(', ')})`
            : 'Bugün boş saat hesabı yok',
        ],
      },
      {
        title: 'Hatırlatmalar',
        lines: [
          `${summary.openReminders} açık hatırlatma`,
          `${openExams.length} yaklaşan sınav`,
          `${openTasks.length} yaklaşan ödev`,
          ...openExams.slice(0, 3).map((item) => `• ${item.title}`),
        ],
      },
      {
        title: 'Akademik',
        lines: [
          gpa ? `AGNO: ${gpa}` : 'AGNO hesaplanmadı',
          `Aktif dönem: ${input.activeSemester}`,
          `${input.notes.length} not kaydı`,
          attendanceHot.length
            ? `${attendanceHot.length} derste devamsızlık uyarısı`
            : 'Devamsızlık uyarısı yok',
        ],
      },
    ],
  };
}
