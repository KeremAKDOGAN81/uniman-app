import { formatDurationMinutes, minutesFromClock, pickNowAndNext, todayWeekday } from '@/lib/dates';
import { findNextExam } from '@/lib/homeInsights';
import type { Reminder, ScheduleItem } from '@/lib/types';

export type MorningSummary = {
  title: string;
  body: string;
  classCount: number;
  firstClassTime: string | null;
};

export function buildMorningSummary(
  schedule: ScheduleItem[],
  reminders: Reminder[],
  now = new Date()
): MorningSummary {
  const today = todayWeekday();
  if (!today) {
    return {
      title: 'Hafta sonu',
      body: 'Bugün ders yok. Dinlen veya haftaya hazırlan.',
      classCount: 0,
      firstClassTime: null,
    };
  }

  const todays = schedule
    .filter((item) => item.weekday === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  if (todays.length === 0) {
    return {
      title: 'Bugün ders yok',
      body: 'Programa ders ekleyerek sabah özetini zenginleştirebilirsin.',
      classCount: 0,
      firstClassTime: null,
    };
  }

  const { current, next } = pickNowAndNext(todays, now);
  const focus = current ?? next ?? todays[0];
  const exam = findNextExam(reminders, now);

  const parts: string[] = [`Bugün ${todays.length} dersin var.`];
  if (current) {
    const left = minutesFromClock(current.endTime);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const start = minutesFromClock(current.startTime);
    if (start !== null && left !== null && left > start) {
      parts.push(`Şu an: ${current.title} (${formatDurationMinutes(left - nowMin)} kaldı).`);
    } else {
      parts.push(`Şu an: ${current.title}.`);
    }
  } else if (next) {
    parts.push(`İlk ders: ${next.title} saat ${next.startTime}.`);
  }

  if (exam) {
    parts.push(`Sıradaki sınav: ${exam.title} (${exam.countdown}).`);
  }

  return {
    title: `Günaydın — ${todays.length} ders`,
    body: parts.join(' '),
    classCount: todays.length,
    firstClassTime: todays[0]?.startTime ?? null,
  };
}
