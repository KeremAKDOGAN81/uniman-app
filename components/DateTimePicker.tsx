import { Pressable, ScrollView, Text, View } from 'react-native';

import { Field, useColors } from '@/components/ui';
import { padTime, toDateInput } from '@/lib/dates';

function buildTimes(): string[] {
  const slots: string[] = [];
  for (let hour = 8; hour <= 21; hour++) {
    const h = String(hour).padStart(2, '0');
    slots.push(`${h}:00`);
    slots.push(`${h}:30`);
  }
  return slots;
}

const TIMES = buildTimes();

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
  const days = Array.from({ length: 42 }, (_, offset) => addDays(new Date(), offset));
  const padded = padTime(time);
  const knownSlot = TIMES.includes(padded);

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
          const selected = padded === slot;
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
      <Field
        label="Özel saat (SS:DD)"
        value={knownSlot ? '' : time}
        onChangeText={(value) => onChange(date, value)}
        placeholder={padded || '14:30'}
        keyboardType="numbers-and-punctuation"
      />
    </View>
  );
}
