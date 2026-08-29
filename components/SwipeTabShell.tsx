import { useCallback, useLayoutEffect, useRef, type ReactNode } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useIsFocused } from 'expo-router';

import { EduBackdrop } from '@/components/EduBackdrop';
import { useColors } from '@/components/ui';
import { getAdjacentTabs, hrefForSwipeTab, SWIPE_TABS, type SwipeTabKey } from '@/constants/swipeTabs';
import { hapticSelect } from '@/lib/haptics';
import { motionSpring, motionTiming } from '@/lib/motion';
import {
  consumeTabTransitionDirection,
  setTabTransitionDirection,
  type TabTransitionDirection,
} from '@/lib/tabTransition';

export function SwipeTabShell({ tab, children }: { tab: SwipeTabKey; children: ReactNode }) {
  const c = useColors();
  const router = useRouter();
  const isFocused = useIsFocused();
  const { width } = useWindowDimensions();
  const { current, prev, next } = getAdjacentTabs(tab);

  const translateX = useSharedValue(0);
  const isAnimating = useSharedValue(false);
  const headerProgress = useSharedValue(1);
  const wasFocused = useRef(false);

  useLayoutEffect(() => {
    if (!isFocused) {
      if (wasFocused.current) {
        translateX.value = 0;
        isAnimating.value = false;
      }
      wasFocused.current = false;
      return;
    }

    const entering = !wasFocused.current;
    wasFocused.current = true;
    if (!entering) return;

    isAnimating.value = false;
    const direction = consumeTabTransitionDirection();
    if (direction === 'forward') {
      translateX.value = width * 0.22;
      translateX.value = withSpring(0, motionSpring.tab);
    } else if (direction === 'back') {
      translateX.value = -width * 0.22;
      translateX.value = withSpring(0, motionSpring.tab);
    } else {
      translateX.value = 0;
    }

    headerProgress.value = 0;
    headerProgress.value = withTiming(1, { duration: motionTiming.tabEnter });
  }, [isFocused, width, translateX, headerProgress, isAnimating]);

  const navigateTo = useCallback(
    (key: SwipeTabKey, direction: TabTransitionDirection) => {
      if (key === tab) return;
      hapticSelect();
      setTabTransitionDirection(direction);
      router.navigate(hrefForSwipeTab(key) as never);
    },
    [router, tab]
  );

  const goToWithAnimation = useCallback(
    (key: SwipeTabKey, direction: TabTransitionDirection) => {
      if (key === tab || isAnimating.value) return;
      isAnimating.value = true;
      const targetX = direction === 'forward' ? -width : width;
      translateX.value = withTiming(
        targetX,
        { duration: motionTiming.tabExit, easing: Easing.out(Easing.cubic) },
        (finished) => {
          isAnimating.value = false;
          if (finished) {
            runOnJS(navigateTo)(key, direction);
          } else {
            translateX.value = withSpring(0, motionSpring.tab);
          }
        }
      );
    },
    [tab, width, navigateTo, isAnimating, translateX]
  );

  const pan = Gesture.Pan()
    .activeOffsetX([-14, 14])
    .failOffsetY([-10, 10])
    .onStart(() => {
      if (isAnimating.value) return;
    })
    .onUpdate((event) => {
      if (isAnimating.value) return;
      const maxDrag = width * 0.38;
      translateX.value = Math.max(-maxDrag, Math.min(maxDrag, event.translationX));
    })
    .onEnd((event) => {
      if (isAnimating.value) return;
      const shouldNext = event.translationX < -44 || event.velocityX < -380;
      const shouldPrev = event.translationX > 44 || event.velocityX > 380;
      if (shouldNext) {
        runOnJS(goToWithAnimation)(next.key, 'forward');
      } else if (shouldPrev) {
        runOnJS(goToWithAnimation)(prev.key, 'back');
      } else {
        translateX.value = withSpring(0, motionSpring.tab);
      }
    });

  const contentStyle = useAnimatedStyle(() => {
    const progress = Math.abs(translateX.value) / Math.max(width * 0.38, 1);
    return {
      transform: [
        { translateX: translateX.value },
        { scale: interpolate(progress, [0, 1], [1, 0.988], Extrapolation.CLAMP) },
      ],
      opacity: interpolate(progress, [0, 1], [1, 0.9], Extrapolation.CLAMP),
    };
  });

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerProgress.value,
    transform: [{ translateY: interpolate(headerProgress.value, [0, 1], [8, 0]) }],
  }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <EduBackdrop />
      <GestureDetector gesture={pan}>
        <View style={{ zIndex: 2 }}>
          <Animated.View
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingTop: 2,
                paddingBottom: 6,
              },
              headerStyle,
            ]}>
            <Pressable
              onPress={() => goToWithAnimation(prev.key, 'back')}
              hitSlop={8}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 28 }}>
              <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700' }}>‹</Text>
              <Text style={{ color: c.muted, fontSize: 11, fontWeight: '600' }} numberOfLines={1}>
                {prev.title}
              </Text>
            </Pressable>
            <View style={{ flex: 1.1, alignItems: 'center', minWidth: 0 }}>
              <Text
                style={{
                  textAlign: 'center',
                  color: c.text,
                  fontSize: 13,
                  fontWeight: '800',
                  letterSpacing: -0.2,
                }}
                numberOfLines={1}>
                {current.title}
              </Text>
              <Text
                style={{ textAlign: 'center', color: c.muted, fontSize: 10, fontWeight: '600', marginTop: 1 }}
                numberOfLines={1}>
                {current.subtitle}
              </Text>
            </View>
            <Pressable
              onPress={() => goToWithAnimation(next.key, 'forward')}
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
          </Animated.View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: 4 }}>
            {SWIPE_TABS.map((item, index) => {
              const active = item.key === tab;
              const currentIndex = SWIPE_TABS.findIndex((row) => row.key === tab);
              return (
                <Pressable
                  key={item.key}
                  accessibilityRole="button"
                  accessibilityLabel={item.title}
                  onPress={() => {
                    if (item.key === tab) return;
                    goToWithAnimation(item.key, index > currentIndex ? 'forward' : 'back');
                  }}
                  hitSlop={6}
                  style={{
                    width: active ? 18 : 6,
                    height: 6,
                    borderRadius: 99,
                    backgroundColor: active ? c.accent : c.line,
                  }}
                />
              );
            })}
          </View>
        </View>
      </GestureDetector>
      <Animated.View style={[{ flex: 1, zIndex: 1 }, contentStyle]}>{children}</Animated.View>
    </SafeAreaView>
  );
}
