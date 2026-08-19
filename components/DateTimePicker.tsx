import { Pressable, ScrollView, Text, View } from 'react-native';

import { useColors } from '@/components/ui';
import { padTime, toDateInput } from '@/lib/dates';

const TIMES = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '21:00'];

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(base: Date, days: number): Date {
  const next = startOfDay(base);
  next.setDate(next.getDate() + days);
  return next;
}

function dayLabel(date: Date): string {
  const today = startOfDay(new Date());
  const diff = Math.round((startOfDay(date).getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Bugün';
  if (diff === 1) return 'Yarın';
  return date.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function DateTimePicker({
  date,
  time,
  onChange,
}: {
  date: string;
  time: string;
  onChange: (date: string, time: string) => void;
}) {
  const c = useColors();
  const days = [0, 1, 2, 3, 4, 5, 6].map((offset) => addDays(new Date(), offset));

  return (
    <View style={{ gap: 10 }}>
      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' }}>
        Ne zaman?
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {days.map((day) => {
          const value = toDateInput(day);
          const selected = value === date;
          return (
            <Pressable
              key={value}
              onPress={() => onChange(value, time)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 14,
                backgroundColor: selected ? c.accent : c.bgElevated,
                borderWidth: 1,
                borderColor: selected ? c.accent : c.line,
              }}>
              <Text style={{ color: selected ? c.onAccent : c.text, fontWeight: '800', fontSize: 13 }}>
                {dayLabel(day)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {TIMES.map((slot) => {
          const selected = padTime(time) === slot;
          return (
            <Pressable
              key={slot}
              onPress={() => onChange(date, slot)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: selected ? c.orange : c.bgElevated,
                borderWidth: 1,
                borderColor: selected ? c.orange : c.line,
              }}>
              <Text style={{ color: selected ? '#fff' : c.text, fontWeight: '700' }}>{slot}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
