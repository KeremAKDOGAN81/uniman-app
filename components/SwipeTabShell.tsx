import { useCallback, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { EduBackdrop } from '@/components/EduBackdrop';
import { useColors } from '@/components/ui';
import { getAdjacentTabs, hrefForSwipeTab, type SwipeTabKey } from '@/constants/swipeTabs';
import { hapticSelect } from '@/lib/haptics';

export function SwipeTabShell({ tab, children }: { tab: SwipeTabKey; children: ReactNode }) {
  const c = useColors();
  const router = useRouter();
  const { current, prev, next } = getAdjacentTabs(tab);

  const goTo = useCallback(
    (key: SwipeTabKey) => {
      if (key === tab) return;
      hapticSelect();
      router.navigate(hrefForSwipeTab(key) as never);
    },
    [router, tab]
  );

  const pan = Gesture.Pan()
    .activeOffsetX([-18, 18])
    .failOffsetY([-14, 14])
    .onEnd((event) => {
      'worklet';
      if (event.translationX < -50 || event.velocityX < -450) {
        runOnJS(goTo)(next.key);
      } else if (event.translationX > 50 || event.velocityX > 450) {
        runOnJS(goTo)(prev.key);
      }
    });

  return (
    <GestureDetector gesture={pan}>
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
        <EduBackdrop />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingTop: 2,
            paddingBottom: 6,
            zIndex: 2,
          }}>
          <Pressable
            onPress={() => goTo(prev.key)}
            hitSlop={8}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 28 }}>
            <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700' }}>‹</Text>
            <Text style={{ color: c.muted, fontSize: 11, fontWeight: '600' }} numberOfLines={1}>
              {prev.title}
            </Text>
          </Pressable>
          <Text
            style={{
              flex: 1.1,
              textAlign: 'center',
              color: c.text,
              fontSize: 13,
              fontWeight: '800',
              letterSpacing: -0.2,
            }}
            numberOfLines={1}>
            {current.title}
          </Text>
          <Pressable
            onPress={() => goTo(next.key)}
            hitSlop={8}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 2,
              minHeight: 28,
            }}>
            <Text style={{ color: c.muted, fontSize: 11, fontWeight: '600' }} numberOfLines={1}>
              {next.title}
            </Text>
            <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700' }}>›</Text>
          </Pressable>
        </View>
        <View style={{ flex: 1, zIndex: 1 }}>{children}</View>
      </SafeAreaView>
    </GestureDetector>
  );
}
