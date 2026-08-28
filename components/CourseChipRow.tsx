import { ScrollView } from 'react-native';

import { Chip } from '@/components/ui';

export function CourseChipRow({
  names,
  selected,
  onSelect,
}: {
  names: string[];
  selected?: string;
  onSelect: (name: string) => void;
}) {
  if (names.length === 0) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {names.map((name) => (
        <Chip key={name} label={name} selected={selected === name} onPress={() => onSelect(name)} />
      ))}
    </ScrollView>
  );
}
