import { WEEKDAYS, type ScheduleItem, type Weekday } from '@/lib/types';

const ALL_DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

export function getWeekDayStrip(now = new Date()): {
  key: Weekday;
  label: string;
  dayNum: number;
  isToday: boolean;
}[] {
  const dayIndex = now.getDay();
  const monday = new Date(now);
  const diffToMonday = dayIndex === 0 ? -6 : 1 - dayIndex;
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() + diffToMonday);

  return WEEKDAYS.map((key, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return {
      key,
      label: key.slice(0, 3),
      dayNum: date.getDate(),
      isToday: date.toDateString() === now.toDateString(),
    };
  });
}

export function todayWeekday(): Weekday | null {
  const name = ALL_DAYS[new Date().getDay()];
  return WEEKDAYS.includes(name as Weekday) ? (name as Weekday) : null;
}

export function formatLongDate(date = new Date()): string {
  return date.toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function padTime(value: string): string {
  const normalized = value.trim().replace(/[.,]/g, ':');
  const [h = '00', m = '00'] = normalized.split(':');
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
}

export function parseLocalDateTime(date: string, time: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match || !timeMatch) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) {
    return null;
  }

  const result = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (Number.isNaN(result.getTime())) return null;
  return result;
}

export function toDateInput(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatMissedDay(value: string): string {
  const date = parseDateInput(value);
  if (!date) return value;
  const today = toDateInput();
  const yest = new Date();
  yest.setDate(yest.getDate() - 1);
  if (value === today) return 'Bugün';
  if (value === toDateInput(yest)) return 'Dün';
  return date.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function recentDateInputs(daysBack = 70): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let offset = 0; offset <= daysBack; offset++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
    dates.push(toDateInput(day));
  }
  return dates;
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isUpcoming(iso: string): boolean {
  return new Date(iso).getTime() >= Date.now() - 60 * 1000;
}

export function minutesFromClock(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function formatDurationMinutes(total: number): string {
  if (total <= 0) return 'şimdi';
  const days = Math.floor(total / (60 * 24));
  const hours = Math.floor((total % (60 * 24)) / 60);
  const minutes = total % 60;
  if (days > 0) return hours > 0 ? `${days} gün ${hours} saat` : `${days} gün`;
  if (hours > 0) return minutes > 0 ? `${hours} saat ${minutes} dakika` : `${hours} saat`;
  return `${minutes} dakika`;
}

export function formatCountdown(iso: string, now = new Date()): string {
  const diffMs = new Date(iso).getTime() - now.getTime();
  if (diffMs <= 0) return 'Zamanı geçti';
  return formatDurationMinutes(Math.floor(diffMs / 60000));
}

export function pickNowAndNext(
  items: ScheduleItem[],
  now = new Date()
): { current: ScheduleItem | null; next: ScheduleItem | null } {
  const nowMin = minutesOfDay(now);
  const sorted = [...items].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const current =
    sorted.find((item) => {
      const start = minutesFromClock(item.startTime);
      const end = minutesFromClock(item.endTime);
      if (start === null) return false;
      const finish = end === null || end <= start ? start + 50 : end;
      return nowMin >= start && nowMin < finish;
    }) ?? null;
  const next =
    sorted.find((item) => {
      const start = minutesFromClock(item.startTime);
      return start !== null && start > nowMin && item.id !== current?.id;
    }) ?? null;
  return { current, next };
}

export function minutesUntilStart(item: ScheduleItem, now = new Date()): number | null {
  const start = minutesFromClock(item.startTime);
  if (start === null) return null;
  return start - minutesOfDay(now);
}

export function minutesUntilEnd(item: ScheduleItem, now = new Date()): number | null {
  const start = minutesFromClock(item.startTime);
  const end = minutesFromClock(item.endTime);
  if (start === null) return null;
  const finish = end === null || end <= start ? start + 50 : end;
  return finish - minutesOfDay(now);
}
