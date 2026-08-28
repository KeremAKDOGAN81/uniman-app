import { View } from 'react-native';

import { useColors } from '@/components/ui';

/** EduAi arka plan lekeleri */
export function EduBackdrop() {
  const c = useColors();
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <View
        style={{
          position: 'absolute',
          top: -60,
          right: -40,
          width: 200,
          height: 200,
          borderRadius: 999,
          backgroundColor: `${c.accent}12`,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 180,
          left: -70,
          width: 160,
          height: 160,
          borderRadius: 999,
          backgroundColor: `${c.pink}10`,
        }}
      />
    </View>
  );
}
