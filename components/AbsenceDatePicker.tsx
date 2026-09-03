import { Pressable, ScrollView, Text, View } from 'react-native';

import { useColors } from '@/components/ui';
import { formatMissedDay, recentDateInputs } from '@/lib/dates';

export function AbsenceDatePicker({
  selected,
  disabledDates,
  onSelect,
}: {
  selected: string;
  disabledDates: string[];
  onSelect: (date: string) => void;
}) {
  const c = useColors();
  const blocked = new Set(disabledDates);

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700' }}>Hangi gün gelmedin?</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {recentDateInputs(70).map((value) => {
          const isSelected = value === selected;
          const taken = blocked.has(value);
          return (
            <Pressable
              key={value}
              disabled={taken}
              onPress={() => onSelect(value)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 14,
                opacity: taken ? 0.4 : 1,
                backgroundColor: isSelected ? c.accent : c.bgElevated,
                borderWidth: 1,
                borderColor: isSelected ? c.accent : c.line,
              }}>
              <Text style={{ color: isSelected ? c.onAccent : c.text, fontWeight: '800', fontSize: 13 }}>
                {formatMissedDay(value)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
