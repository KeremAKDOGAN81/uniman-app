import { minutesFromClock, todayWeekday } from '@/lib/dates';
import type { ScheduleItem } from '@/lib/types';

export type FreeSlot = {
  startTime: string;
  endTime: string;
  durationMinutes: number;
};

function clockFromMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function findFreeHoursToday(schedule: ScheduleItem[], dayStart = 8 * 60, dayEnd = 22 * 60): FreeSlot[] {
  const today = todayWeekday();
  if (!today) return [];

  const items = schedule
    .filter((item) => item.weekday === today)
    .map((item) => ({
      start: minutesFromClock(item.startTime),
      end: minutesFromClock(item.endTime),
    }))
    .filter((item): item is { start: number; end: number } => item.start !== null && item.end !== null && item.end > item.start)
    .sort((a, b) => a.start - b.start);

  const slots: FreeSlot[] = [];
  let cursor = dayStart;

  for (const item of items) {
    if (item.start > cursor) {
      slots.push({
        startTime: clockFromMinutes(cursor),
        endTime: clockFromMinutes(item.start),
        durationMinutes: item.start - cursor,
      });
    }
    cursor = Math.max(cursor, item.end);
  }

  if (cursor < dayEnd) {
    slots.push({
      startTime: clockFromMinutes(cursor),
      endTime: clockFromMinutes(dayEnd),
      durationMinutes: dayEnd - cursor,
    });
  }

  return slots.filter((slot) => slot.durationMinutes >= 30);
}
