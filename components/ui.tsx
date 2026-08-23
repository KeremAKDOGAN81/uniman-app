import type { ReactNode } from 'react';
import { useEffect } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import Animated, {
  FadeInDown,
  interpolateColor,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { palettes, type ThemeColors } from '@/constants/theme';
import { hapticSelect } from '@/lib/haptics';
import { useAppStore } from '@/store/useAppStore';

export function useColors(): ThemeColors {
  const theme = useAppStore((state) => state.theme);
  return palettes[theme];
}

export function Screen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const theme = useAppStore((state) => state.theme);
  const progress = useSharedValue(theme === 'dark' ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(theme === 'dark' ? 1 : 0, { duration: 280 });
  }, [progress, theme]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [palettes.light.bg, palettes.dark.bg]),
  }));

  return (
    <Animated.View style={[{ flex: 1, paddingHorizontal: 20, paddingTop: 8 }, animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return (
    <Animated.View
      entering={FadeInDown.duration(240)}
      layout={LinearTransition.duration(200)}
      style={[
        {
          backgroundColor: c.card,
          borderRadius: 18,
          padding: 16,
          borderWidth: 1,
          borderColor: c.line,
        },
        style,
      ]}>
      {children}
    </Animated.View>
  );
}

export function Title({ children }: { children: ReactNode }) {
  const c = useColors();
  return (
    <Text style={{ color: c.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.6 }}>
      {children}
    </Text>
  );
}

export function Muted({ children }: { children: ReactNode }) {
  const c = useColors();
  return <Text style={{ color: c.muted, fontSize: 13 }}>{children}</Text>;
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const c = useColors();
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={() => {
        if (disabled) return;
        hapticSelect();
        onPress();
      }}
      disabled={disabled}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 18, stiffness: 420 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 380 });
      }}>
      <Animated.View
        style={[
          {
            backgroundColor: c.accent,
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: 'center',
            opacity: disabled ? 0.45 : 1,
          },
          anim,
        ]}>
        <Text style={{ color: c.onAccent, fontSize: 16, fontWeight: '700' }}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export function GhostButton({
  label,
  onPress,
  danger,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const c = useColors();
  return (
    <Pressable
      onPress={() => {
        hapticSelect();
        onPress();
      }}
      style={({ pressed }) => ({ paddingVertical: 8, opacity: pressed ? 0.7 : 1 })}>
      <Text style={{ color: danger ? c.danger : c.blue, fontSize: 14, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  color,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  color?: string;
}) {
  const c = useColors();
  const fill = color ?? c.accent;
  return (
    <Pressable
      onPress={() => {
        hapticSelect();
        onPress();
      }}
      style={({ pressed }) => ({
        borderWidth: 1,
        borderColor: selected ? fill : c.line,
        backgroundColor: selected ? fill : c.bgElevated,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
        opacity: pressed ? 0.85 : 1,
      })}>
      <Text style={{ color: selected ? '#FFFFFF' : c.muted, fontWeight: '700', fontSize: 13 }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const c = useColors();
  return (
    <View style={{ gap: 6 }}>
      <Text
        style={{
          color: c.muted,
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 0.3,
          textTransform: 'uppercase',
        }}>
        {label}
      </Text>
      <TextInput
        placeholderTextColor={c.muted}
        style={{
          backgroundColor: c.bgElevated,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: c.line,
          color: c.text,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 16,
        }}
        {...props}
      />
    </View>
  );
}

export function EmptyState({
  title,
  body,
  emoji = '📭',
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  emoji?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const c = useColors();
  return (
    <Card style={{ alignItems: 'center', gap: 8 }}>
      <Text style={{ fontSize: 36 }}>{emoji}</Text>
      <Text style={{ color: c.text, fontSize: 16, fontWeight: '800', textAlign: 'center' }}>{title}</Text>
      <Text style={{ color: c.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' }}>{body}</Text>
      {actionLabel && onAction ? (
        <View style={{ marginTop: 6, alignSelf: 'stretch' }}>
          <PrimaryButton label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </Card>
  );
}

export function ThemeToggle() {
  const c = useColors();
  const theme = useAppStore((state) => state.theme);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  return (
    <Pressable
      onPress={() => {
        hapticSelect();
        toggleTheme();
      }}
      style={({ pressed }) => ({
        alignSelf: 'flex-start',
        backgroundColor: c.bgElevated,
        borderWidth: 1,
        borderColor: c.line,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
        opacity: pressed ? 0.8 : 1,
      })}>
      <Text style={{ color: c.text, fontWeight: '700', fontSize: 13 }}>
        {theme === 'light' ? 'Koyu tema' : 'Açık tema'}
      </Text>
    </Pressable>
  );
}
