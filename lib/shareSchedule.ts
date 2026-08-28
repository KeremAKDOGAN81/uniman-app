import { Share } from 'react-native';

import type { ScheduleItem, Weekday } from '@/lib/types';
import { WEEKDAYS } from '@/lib/types';

export function formatScheduleText(schedule: ScheduleItem[]): string {
  const grouped = Object.fromEntries(WEEKDAYS.map((day) => [day, [] as ScheduleItem[]])) as Record<
    Weekday,
    ScheduleItem[]
  >;

  for (const item of schedule) {
    if (grouped[item.weekday]) {
      grouped[item.weekday].push(item);
    }
  }

  const lines: string[] = ['📅 UniMan — Haftalık Program', ''];

  for (const day of WEEKDAYS) {
    const items = grouped[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    lines.push(`▸ ${day}`);
    if (items.length === 0) {
      lines.push('  —');
    } else {
      for (const item of items) {
        const room = item.room.trim() ? ` · ${item.room.trim()}` : '';
        lines.push(`  ${item.startTime}–${item.endTime}  ${item.title}${room}`);
      }
    }
    lines.push('');
  }

  lines.push('UniMan ile oluşturuldu');
  return lines.join('\n').trim();
}

export async function shareSchedule(schedule: ScheduleItem[]): Promise<void> {
  const message = formatScheduleText(schedule);
  await Share.share({
    message,
    title: 'Haftalık program',
  });
}
