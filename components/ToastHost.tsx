import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/components/ui';
import { eduCardShadow } from '@/lib/courseColor';
import { useToast } from '@/lib/toast';

const tones = {
  success: { bg: '#22C55E', icon: '✓' },
  info: { bg: '#3B82F6', icon: 'ℹ' },
  error: { bg: '#EF4444', icon: '!' },
} as const;

export function ToastHost() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const message = useToast((s) => s.message);
  const kind = useToast((s) => s.kind);
  const hide = useToast((s) => s.hide);

  if (!message) return null;

  const tone = tones[kind];

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, zIndex: 9999 }}>
      <Animated.View entering={FadeInUp.duration(260).springify()} exiting={FadeOutUp.duration(200)}>
        <Pressable
          onPress={hide}
          accessibilityRole="alert"
          accessibilityLabel={message}
          style={{
            backgroundColor: c.card,
            borderRadius: 18,
            paddingVertical: 14,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            borderWidth: 1,
            borderColor: c.line,
            ...eduCardShadow,
          }}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: tone.bg,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>{tone.icon}</Text>
          </View>
          <Text style={{ color: c.text, fontWeight: '700', fontSize: 14, flex: 1 }}>{message}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
