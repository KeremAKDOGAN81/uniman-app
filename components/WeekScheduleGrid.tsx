import { Pressable, ScrollView, Text, View } from 'react-native';

import { useColors } from '@/components/ui';
import { eduCardShadow } from '@/lib/courseColor';
import type { ScheduleItem, Weekday } from '@/lib/types';
import { WEEKDAYS } from '@/lib/types';

export function WeekScheduleGrid({
  schedule,
  onSelectDay,
}: {
  schedule: ScheduleItem[];
  onSelectDay?: (day: Weekday) => void;
}) {
  const c = useColors();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
      {WEEKDAYS.map((day) => {
        const items = schedule
          .filter((item) => item.weekday === day)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));
        return (
          <Pressable
            key={day}
            onPress={() => onSelectDay?.(day)}
            style={{
              width: 148,
              backgroundColor: c.card,
              borderRadius: 22,
              padding: 12,
              borderWidth: 1,
              borderColor: c.line,
              gap: 8,
              ...eduCardShadow,
            }}>
            <Text style={{ color: c.text, fontWeight: '800', fontSize: 14 }}>{day}</Text>
            <Text style={{ color: c.muted, fontSize: 11 }}>{items.length} ders</Text>
            {items.length === 0 ? (
              <Text style={{ color: c.muted, fontSize: 12 }}>Boş</Text>
            ) : (
              items.slice(0, 4).map((item) => (
                <View
                  key={item.id}
                  style={{
                    backgroundColor: `${item.color || c.accent}18`,
                    borderRadius: 12,
                    paddingHorizontal: 8,
                    paddingVertical: 6,
                    borderLeftWidth: 3,
                    borderLeftColor: item.color || c.accent,
                  }}>
                  <Text style={{ color: c.text, fontWeight: '700', fontSize: 11 }} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={{ color: c.muted, fontSize: 10 }}>
                    {item.startTime} – {item.endTime}
                  </Text>
                </View>
              ))
            )}
            {items.length > 4 ? (
              <Text style={{ color: c.muted, fontSize: 10 }}>+{items.length - 4} daha</Text>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
