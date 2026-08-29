import type { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useColors } from '@/components/ui';
import { eduCardShadow } from '@/lib/courseColor';
import { hapticSelect } from '@/lib/haptics';

export const eduGradients = {
  hero: ['#A594FF', '#F0A8FF'] as const,
  primary: ['#6C5CE7', '#9F8FFF'] as const,
  sky: ['#38BDF8', '#6366F1'] as const,
  sunset: ['#FF9F1C', '#F97316'] as const,
  mint: ['#22C55E', '#14B8A6'] as const,
  slate: ['#475569', '#1E293B'] as const,
};

export function greetingForHour(hour: number): string {
  if (hour < 12) return 'Günaydın';
  if (hour < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

/** Native modül gerektirmeyen gradient kart. */
export function FauxGradient({
  colors,
  style,
  children,
}: {
  colors: readonly [string, string];
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  return (
    <View style={[{ overflow: 'hidden', backgroundColor: colors[0] }, style]}>
      <View
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: '28%',
          backgroundColor: colors[1],
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: -30,
          right: -20,
          width: 120,
          height: 120,
          borderRadius: 999,
          backgroundColor: 'rgba(255,255,255,0.12)',
        }}
      />
      <View style={{ position: 'relative' }}>{children}</View>
    </View>
  );
}

export function EduPageHeader({
  title,
  subtitle,
  badge,
  accentColor,
  emoji,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  accentColor?: string;
  emoji?: string;
}) {
  const c = useColors();
  const accent = accentColor ?? c.accent;
  return (
    <Animated.View entering={FadeInDown.duration(280)} style={{ gap: 8, marginBottom: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {emoji ? (
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: `${accent}22`,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: `${accent}33`,
            }}>
            <Text style={{ fontSize: 26 }}>{emoji}</Text>
          </View>
        ) : null}
        <View style={{ flex: 1, gap: 6 }}>
          {badge ? (
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: `${accent}20`,
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}>
              <Text style={{ color: accent, fontWeight: '800', fontSize: 11, letterSpacing: 0.4 }}>
                {badge.toUpperCase()}
              </Text>
            </View>
          ) : null}
          <Text style={{ color: c.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.8 }}>{title}</Text>
          {subtitle ? (
            <Text style={{ color: c.muted, fontSize: 14, lineHeight: 20 }}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}

export function EduSectionTitle({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={{ color: c.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 }}>{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={{ color: c.accent, fontWeight: '700', fontSize: 13 }}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function EduSearchBar({
  placeholder,
  onPress,
  value,
  onChangeText,
}: {
  placeholder: string;
  onPress?: () => void;
  value?: string;
  onChangeText?: (text: string) => void;
}) {
  const c = useColors();
  const editable = Boolean(onChangeText);
  return (
    <Pressable
      onPress={onPress}
      disabled={editable}
      style={({ pressed }) => ({ opacity: pressed && onPress ? 0.92 : 1 })}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: c.card,
          borderRadius: 20,
          padding: 14,
          borderWidth: 1,
          borderColor: c.line,
          ...eduCardShadow,
        }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: `${c.accent}14`,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text style={{ fontSize: 16 }}>🔍</Text>
        </View>
        <TextInput
          editable={editable}
          pointerEvents={editable ? 'auto' : 'none'}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={c.muted}
          style={{ flex: 1, color: c.text, fontSize: 15, padding: 0 }}
        />
      </View>
    </Pressable>
  );
}

export function EduSegmentPills({
  options,
  value,
  onChange,
}: {
  options: { key: string; label: string; color?: string }[];
  value: string;
  onChange: (key: string) => void;
}) {
  const c = useColors();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: c.card,
        borderRadius: 16,
        padding: 4,
        borderWidth: 1,
        borderColor: c.line,
        gap: 4,
      }}>
      {options.map((option) => {
        const selected = value === option.key;
        const fill = option.color ?? c.accent;
        return (
          <Pressable
            key={option.key}
            onPress={() => {
              hapticSelect();
              onChange(option.key);
            }}
            style={{
              flex: 1,
              borderRadius: 12,
              paddingVertical: 10,
              alignItems: 'center',
              backgroundColor: selected ? fill : 'transparent',
            }}>
            <Text
              style={{
                color: selected ? '#FFFFFF' : c.muted,
                fontWeight: '800',
                fontSize: 13,
              }}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function EduStatTile({
  label,
  value,
  hint,
  gradient,
  onPress,
}: {
  label: string;
  value: string;
  hint?: string;
  gradient: readonly [string, string];
  onPress?: () => void;
}) {
  const valueSize = value.length > 9 ? 18 : 28;
  const body = (
    <FauxGradient colors={gradient} style={{ borderRadius: 22, padding: 18, minHeight: 108 }}>
      <Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '700', fontSize: 12 }}>{label}</Text>
      <Text
        style={{
          color: '#fff',
          fontSize: valueSize,
          fontWeight: '900',
          marginTop: 6,
          letterSpacing: -0.5,
          lineHeight: valueSize + 4,
        }}>
        {value}
      </Text>
      {hint ? (
        <Text style={{ color: 'rgba(255,255,255,0.78)', fontSize: 12, marginTop: 4 }}>{hint}</Text>
      ) : null}
    </FauxGradient>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={() => { hapticSelect(); onPress(); }} style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}>
      {body}
    </Pressable>
  );
}

export function EduIconBubble({ emoji, color, size = 48 }: { emoji: string; color: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        backgroundColor: `${color}20`,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text style={{ fontSize: size * 0.46 }}>{emoji}</Text>
    </View>
  );
}

export function EduListRow({
  emoji,
  title,
  subtitle,
  accent,
  onPress,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  accent: string;
  onPress: () => void;
}) {
  const c = useColors();
  return (
    <Pressable onPress={() => { hapticSelect(); onPress(); }} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: c.card,
          borderRadius: 20,
          padding: 14,
          borderWidth: 1,
          borderColor: c.line,
          ...eduCardShadow,
        }}>
        <EduIconBubble emoji={emoji} color={accent} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontWeight: '800', fontSize: 15 }} numberOfLines={1}>
            {title}
          </Text>
          <Text style={{ color: c.muted, fontSize: 13, marginTop: 3 }} numberOfLines={2}>
            {subtitle}
          </Text>
        </View>
        <Text style={{ color: c.muted, fontSize: 18, fontWeight: '600' }}>›</Text>
      </View>
    </Pressable>
  );
}

export function EduHeroBanner({
  badge,
  title,
  subtitle,
  footer,
  colors,
  progress,
  onPress,
}: {
  badge: string;
  title: string;
  subtitle: string;
  footer?: string;
  colors: readonly [string, string];
  progress?: number;
  onPress?: () => void;
}) {
  const content = (
    <>
      <FauxGradient colors={colors} style={{ borderRadius: 26, padding: 22, minHeight: 156 }}>
        <View
          style={{
            alignSelf: 'flex-start',
            backgroundColor: 'rgba(255,255,255,0.24)',
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 5,
            marginBottom: 12,
          }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 11, letterSpacing: 0.5 }}>{badge}</Text>
        </View>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 }}>{title}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.9)', marginTop: 8, fontSize: 14, lineHeight: 20 }}>{subtitle}</Text>
        {footer ? (
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15, marginTop: 14 }}>{footer}</Text>
        ) : null}
      </FauxGradient>
      {progress !== undefined ? (
        <View
          style={{
            height: 5,
            backgroundColor: 'rgba(255,255,255,0.25)',
            borderRadius: 99,
            marginTop: -10,
            marginHorizontal: 18,
            overflow: 'hidden',
          }}>
          <View style={{ width: `${progress * 100}%`, height: 5, backgroundColor: '#fff', borderRadius: 99 }} />
        </View>
      ) : null}
    </>
  );
  if (!onPress) return content;
  return <Pressable onPress={onPress}>{content}</Pressable>;
}

export function EduQuickTile({
  label,
  emoji,
  color,
  onPress,
}: {
  label: string;
  emoji: string;
  color: string;
  onPress: () => void;
}) {
  const c = useColors();
  return (
    <Pressable
      onPress={() => { hapticSelect(); onPress(); }}
      style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.9 : 1, minWidth: '46%' })}>
      <View
        style={{
          backgroundColor: c.card,
          borderRadius: 20,
          padding: 16,
          borderWidth: 1,
          borderColor: c.line,
          gap: 10,
        }}>
        <EduIconBubble emoji={emoji} color={color} size={44} />
        <Text style={{ color: c.text, fontWeight: '800', fontSize: 15 }}>{label}</Text>
      </View>
    </Pressable>
  );
}

export function EduGpaHero({
  gpa4,
  gpa100,
  courseCount,
}: {
  gpa4: string;
  gpa100: string;
  courseCount: number;
}) {
  const c = useColors();
  return (
    <FauxGradient colors={eduGradients.primary} style={{ borderRadius: 32, padding: 22, gap: 16, ...eduCardShadow }}>
      <Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '700', fontSize: 13 }}>Dönem ortalaman</Text>
      {courseCount === 0 ? (
        <>
          <Text style={{ color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: -0.5 }}>Hesaplanmadı</Text>
          <Text style={{ color: 'rgba(255,255,255,0.78)', fontSize: 14, lineHeight: 20 }}>
            Ders adı, AKTS ve harf notu ekle — AGNO otomatik güncellenir.
          </Text>
        </>
      ) : (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 20 }}>
            <View>
              <Text style={{ color: '#fff', fontSize: 44, fontWeight: '900', letterSpacing: -1 }}>{gpa4}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 }}>4.00 sistem</Text>
            </View>
            <View style={{ width: 1, height: 52, backgroundColor: 'rgba(255,255,255,0.25)' }} />
            <View>
              <Text style={{ color: '#fff', fontSize: 32, fontWeight: '900' }}>{gpa100}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 }}>100'lük</Text>
            </View>
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>{courseCount} ders kayıtlı</Text>
        </>
      )}
    </FauxGradient>
  );
}

export function EduCourseChip({
  title,
  meta,
  accent,
  onPress,
}: {
  title: string;
  meta: string;
  accent: string;
  onPress?: () => void;
}) {
  const c = useColors();
  const inner = (
    <View
      style={{
        width: 148,
        backgroundColor: c.card,
        borderRadius: 22,
        padding: 16,
        borderWidth: 1,
        borderColor: c.line,
        gap: 10,
      }}>
      <View style={{ width: 40, height: 5, borderRadius: 99, backgroundColor: accent }} />
      <Text style={{ color: accent, fontWeight: '800', fontSize: 12 }}>{meta}</Text>
      <Text style={{ color: c.text, fontWeight: '800', fontSize: 15, lineHeight: 20 }} numberOfLines={2}>
        {title}
      </Text>
    </View>
  );
  if (!onPress) return inner;
  return (
    <Pressable onPress={() => { hapticSelect(); onPress(); }} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
      {inner}
    </Pressable>
  );
}

export function EduFormCard({
  title,
  children,
  accent,
  emoji,
}: {
  title: string;
  children: ReactNode;
  accent?: string;
  emoji?: string;
}) {
  const c = useColors();
  const tone = accent ?? c.accent;
  return (
    <View
      style={{
        backgroundColor: c.card,
        borderRadius: 28,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: c.line,
        ...eduCardShadow,
      }}>
      <View style={{ height: 5, backgroundColor: tone }} />
      <View style={{ padding: 18, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {emoji ? <EduIconBubble emoji={emoji} color={tone} size={40} /> : null}
          <Text style={{ color: c.text, fontWeight: '800', fontSize: 17, flex: 1 }}>{title}</Text>
        </View>
        {children}
      </View>
    </View>
  );
}

export function EduColorCard({
  accent,
  emoji,
  badge,
  title,
  subtitle,
  children,
  faded,
}: {
  accent: string;
  emoji?: string;
  badge?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
  faded?: boolean;
}) {
  const c = useColors();
  return (
    <View
      style={{
        backgroundColor: c.card,
        borderRadius: 28,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: c.line,
        opacity: faded ? 0.58 : 1,
        ...eduCardShadow,
      }}>
      <View style={{ flexDirection: 'row', minHeight: 4 }}>
        <View style={{ flex: 1, backgroundColor: accent }} />
        <View style={{ flex: 1, backgroundColor: `${accent}88` }} />
        <View style={{ flex: 1, backgroundColor: `${accent}44` }} />
      </View>
      <View style={{ padding: 16, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          {emoji ? <EduIconBubble emoji={emoji} color={accent} size={46} /> : null}
          <View style={{ flex: 1, gap: 4 }}>
            {badge ? (
              <Text style={{ color: accent, fontWeight: '800', fontSize: 11, letterSpacing: 0.3 }}>{badge}</Text>
            ) : null}
            <Text
              style={{
                color: c.text,
                fontWeight: '800',
                fontSize: 17,
                textDecorationLine: faded ? 'line-through' : 'none',
              }}>
              {title}
            </Text>
            {subtitle ? <Text style={{ color: c.muted, fontSize: 13, lineHeight: 18 }}>{subtitle}</Text> : null}
          </View>
        </View>
        {children}
      </View>
    </View>
  );
}

export function EduProgressCard({
  accent,
  emoji,
  title,
  subtitle,
  ratio,
  progressColor,
  children,
}: {
  accent: string;
  emoji: string;
  title: string;
  subtitle: string;
  ratio: number;
  progressColor: string;
  children?: ReactNode;
}) {
  const c = useColors();
  return (
    <EduColorCard accent={accent} emoji={emoji} title={title} subtitle={subtitle}>
      <View style={{ height: 10, backgroundColor: c.line, borderRadius: 99, overflow: 'hidden' }}>
        <View style={{ width: `${Math.min(100, ratio * 100)}%`, height: 10, backgroundColor: progressColor, borderRadius: 99 }} />
      </View>
      {children}
    </EduColorCard>
  );
}

export function EduField(props: TextInputProps & { label: string }) {
  const c = useColors();
  const { label, ...inputProps } = props;
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: 0.2 }}>{label}</Text>
      <TextInput
        placeholderTextColor={c.muted}
        style={{
          backgroundColor: c.bg,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: c.line,
          color: c.text,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 16,
          minHeight: inputProps.multiline ? 96 : undefined,
          textAlignVertical: inputProps.multiline ? 'top' : 'auto',
        }}
        {...inputProps}
      />
    </View>
  );
}

export function EduHomeTopBar({
  greeting,
  name,
  subtitle,
  onNotify,
  onSettings,
  notifyCount,
}: {
  greeting: string;
  name: string;
  subtitle?: string | null;
  onNotify: () => void;
  onSettings: () => void;
  notifyCount?: number;
}) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 23,
            backgroundColor: `${c.accent}22`,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: `${c.accent}33`,
            flexShrink: 0,
          }}>
          <Text style={{ fontSize: 22 }}>🎓</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: c.muted, fontSize: 13 }} numberOfLines={1}>
            {greeting}
          </Text>
          <Text style={{ color: c.text, fontSize: 18, fontWeight: '800' }} numberOfLines={1}>
            {name}
          </Text>
          {subtitle ? (
            <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 10, flexShrink: 0 }}>
        <Pressable
          onPress={onNotify}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: c.card,
            borderWidth: 1,
            borderColor: c.line,
            alignItems: 'center',
            justifyContent: 'center',
            ...eduCardShadow,
          }}>
          <Text style={{ fontSize: 18 }}>🔔</Text>
          {(notifyCount ?? 0) > 0 ? (
            <View
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: c.orange,
              }}
            />
          ) : null}
        </Pressable>
        <Pressable
          onPress={onSettings}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: c.accent,
            alignItems: 'center',
            justifyContent: 'center',
            ...eduCardShadow,
          }}>
          <Text style={{ fontSize: 18 }}>⚙️</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function EduJoinHero({
  title,
  subtitle,
  buttonLabel,
  statLabel,
  statValue,
  timeLabel,
  onPress,
}: {
  title: string;
  subtitle: string;
  buttonLabel: string;
  statLabel: string;
  statValue: string;
  timeLabel: string;
  onPress?: () => void;
}) {
  const c = useColors();
  return (
    <View style={{ position: 'relative', marginBottom: 20 }}>
      <FauxGradient
        colors={eduGradients.hero}
        style={{ borderRadius: 36, padding: 22, minHeight: 176, overflow: 'hidden' }}>
        <View
          style={{
            position: 'absolute',
            top: -40,
            right: -30,
            width: 140,
            height: 140,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.2)',
          }}
        />
        <View
          style={{
            position: 'absolute',
            bottom: -50,
            left: -20,
            width: 100,
            height: 100,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.12)',
          }}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1, gap: 10 }}>
            <Text style={{ color: '#111827', fontSize: 21, fontWeight: '900', lineHeight: 27, letterSpacing: -0.4 }}>
              {title}
            </Text>
            <Text style={{ color: 'rgba(17,24,39,0.72)', fontSize: 14, fontWeight: '600' }}>{subtitle}</Text>
            <Pressable
              onPress={onPress}
              style={{
                alignSelf: 'flex-start',
                backgroundColor: c.accent,
                borderRadius: 999,
                paddingHorizontal: 22,
                paddingVertical: 12,
                marginTop: 4,
                ...eduCardShadow,
              }}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>{buttonLabel}</Text>
            </Pressable>
          </View>
          <View style={{ alignItems: 'flex-end', justifyContent: 'space-between', minHeight: 120 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: 'rgba(255,255,255,0.55)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.7)',
              }}>
              <Text style={{ color: '#111827', fontWeight: '800', fontSize: 11, textAlign: 'center', lineHeight: 14 }}>
                {statValue}
              </Text>
              <Text style={{ color: 'rgba(17,24,39,0.6)', fontSize: 9, textAlign: 'center', marginTop: 2 }}>
                {statLabel}
              </Text>
            </View>
            <Text style={{ color: '#fff', fontSize: 30, fontWeight: '900', letterSpacing: -0.5 }}>{timeLabel}</Text>
          </View>
        </View>
      </FauxGradient>
      <View
        style={{
          position: 'absolute',
          bottom: -16,
          left: '50%',
          marginLeft: -30,
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: c.bg,
        }}
      />
    </View>
  );
}

export function EduOngoingCourseCard({
  emoji,
  iconColor,
  title,
  subtitle,
  tags,
  progressLabel,
  progressColor,
  onPress,
}: {
  emoji: string;
  iconColor: string;
  title: string;
  subtitle: string;
  tags?: string[];
  progressLabel: string;
  progressColor: string;
  onPress?: () => void;
}) {
  const c = useColors();
  const card = (
    <View
      style={{
        width: 220,
        backgroundColor: c.card,
        borderRadius: 32,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: c.line,
        ...eduCardShadow,
      }}>
      <View style={{ padding: 16, gap: 8, minHeight: 132 }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: `${iconColor}20`,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: `${iconColor}30`,
          }}>
          <Text style={{ fontSize: 22 }}>{emoji}</Text>
        </View>
        <Text style={{ color: c.text, fontWeight: '900', fontSize: 16, lineHeight: 21 }} numberOfLines={2}>
          {title}
        </Text>
        <Text style={{ color: c.muted, fontSize: 12 }} numberOfLines={1}>
          {subtitle}
        </Text>
        {tags && tags.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {tags.slice(0, 2).map((tag) => (
              <View key={tag} style={{ backgroundColor: c.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: c.muted, fontSize: 10, fontWeight: '700' }}>#{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', height: 44 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: progressColor,
            paddingHorizontal: 12,
            justifyContent: 'center',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 11 }}>İlerleme</Text>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11 }}>⏱ {progressLabel}</Text>
        </View>
        <View style={{ width: 58, flexDirection: 'row', overflow: 'hidden' }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                backgroundColor: i % 2 === 0 ? c.line : c.bg,
                opacity: 0.65,
              }}
            />
          ))}
        </View>
      </View>
    </View>
  );
  if (!onPress) return card;
  return (
    <Pressable onPress={() => { hapticSelect(); onPress(); }} style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}>
      {card}
    </Pressable>
  );
}

export function EduActivityCard({ label, percent }: { label: string; percent: number }) {
  const c = useColors();
  return (
    <View
      style={{
        backgroundColor: c.card,
        borderRadius: 28,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: c.line,
        ...eduCardShadow,
      }}>
      <Text style={{ color: c.text, fontWeight: '800', fontSize: 16 }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={{ color: c.text, fontWeight: '900', fontSize: 18 }}>{percent}%</Text>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            borderWidth: 4,
            borderColor: `${c.success}55`,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text style={{ fontSize: 18 }}>🏆</Text>
        </View>
      </View>
    </View>
  );
}

export function EduWeekDateStrip({
  days,
  selected,
  onSelect,
  counts,
}: {
  days: { key: string; label: string; dayNum: number }[];
  selected: string;
  onSelect: (key: string) => void;
  counts?: Record<string, number>;
}) {
  const c = useColors();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingVertical: 4 }}>
      {days.map((day) => {
        const active = day.key === selected;
        return (
          <Pressable key={day.key} onPress={() => { hapticSelect(); onSelect(day.key); }} style={{ alignItems: 'center', gap: 6 }}>
            <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600' }}>{day.label}</Text>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: active ? c.orange : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text style={{ color: active ? '#fff' : c.text, fontWeight: '800', fontSize: 15 }}>{day.dayNum}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 3, minHeight: 6 }}>
              {Array.from({ length: Math.min(counts?.[day.key] ?? 0, 3) }).map((_, i) => (
                <View key={i} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: c.muted }} />
              ))}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function EduTimelineClassCard({
  timeRange,
  title,
  subtitle,
  duration,
  tag,
  color,
  onPress,
  onEdit,
  onDelete,
  remindHours,
  remindOptions,
  onRemindChange,
}: {
  timeRange: string;
  title: string;
  subtitle?: string;
  duration: string;
  tag?: string;
  color?: string;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  remindHours?: number;
  remindOptions?: { hours: number; label: string }[];
  onRemindChange?: (hours: number) => void;
}) {
  const c = useColors();
  const fill = color ?? c.accent;
  const card = (
    <FauxGradient colors={[fill, '#5B4AE8']} style={{ borderRadius: 28, padding: 18, gap: 12, ...eduCardShadow }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '900' }}>✓</Text>
        </View>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>{timeRange}</Text>
        </View>
      </View>
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.3 }}>{title}</Text>
      {subtitle ? <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 18 }}>{subtitle}</Text> : null}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>⏱ {duration}</Text>
        </View>
        {tag ? (
          <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>⚡ {tag}</Text>
          </View>
        ) : null}
      </View>
      {remindOptions && onRemindChange ? (
        <View
          style={{
            gap: 8,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.22)',
          }}>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '700' }}>Bu ders için hatırlat</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {remindOptions.map((option) => {
              const selected = (remindHours ?? 0) === option.hours;
              return (
                <Pressable
                  key={option.hours}
                  onPress={() => {
                    hapticSelect();
                    onRemindChange(option.hours);
                  }}
                  style={{
                    backgroundColor: selected ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.18)',
                    borderRadius: 999,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderWidth: 1,
                    borderColor: selected ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.28)',
                  }}>
                  <Text style={{ color: selected ? fill : '#fff', fontWeight: '700', fontSize: 12 }}>{option.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
      {onEdit || onDelete ? (
        <View
          style={{
            flexDirection: 'row',
            gap: 8,
            marginTop: 4,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.22)',
          }}>
          {onEdit ? (
            <Pressable
              onPress={() => {
                hapticSelect();
                onEdit();
              }}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: pressed ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.18)',
                borderRadius: 14,
                paddingVertical: 10,
                alignItems: 'center',
              })}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>Düzenle</Text>
            </Pressable>
          ) : null}
          {onDelete ? (
            <Pressable
              onPress={() => {
                hapticSelect();
                onDelete();
              }}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: pressed ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.18)',
                borderRadius: 14,
                paddingVertical: 10,
                alignItems: 'center',
              })}>
              <Text style={{ color: '#FFE4E4', fontWeight: '800', fontSize: 13 }}>Sil</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </FauxGradient>
  );
  if (!onPress) return card;
  return (
    <Pressable onPress={() => { hapticSelect(); onPress(); }} style={({ pressed }) => ({ opacity: pressed ? 0.94 : 1 })}>
      {card}
    </Pressable>
  );
}

export function EduHashtagChip({ label, dark }: { label: string; dark?: boolean }) {
  const c = useColors();
  return (
    <View
      style={{
        backgroundColor: dark ? c.text : c.card,
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderWidth: dark ? 0 : 1,
        borderColor: c.line,
      }}>
      <Text style={{ color: dark ? '#fff' : c.text, fontWeight: '700', fontSize: 12 }}>#{label}</Text>
    </View>
  );
}

export function EduExamCountdownCard({
  title,
  countdown,
  dateLabel,
  onPress,
}: {
  title: string;
  countdown: string;
  dateLabel: string;
  onPress?: () => void;
}) {
  const c = useColors();
  const card = (
    <FauxGradient colors={eduGradients.sunset} style={{ borderRadius: 32, padding: 20, gap: 6, ...eduCardShadow }}>
      <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '800', letterSpacing: 0.4 }}>
        SIRADAKİ SINAV
      </Text>
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.4 }}>{title}</Text>
      <Text style={{ color: '#fff', fontSize: 30, fontWeight: '900', marginTop: 4 }}>{countdown}</Text>
      <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600' }}>{dateLabel}</Text>
    </FauxGradient>
  );
  if (!onPress) return card;
  return (
    <Pressable onPress={() => { hapticSelect(); onPress(); }} style={({ pressed }) => ({ opacity: pressed ? 0.94 : 1 })}>
      {card}
    </Pressable>
  );
}

export function EduWeeklySummaryCard({ line }: { line: string }) {
  const c = useColors();
  return (
    <View
      style={{
        backgroundColor: c.card,
        borderRadius: 28,
        padding: 18,
        borderWidth: 1,
        borderColor: c.line,
        gap: 6,
        ...eduCardShadow,
      }}>
      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '800', letterSpacing: 0.3 }}>BU HAFTA</Text>
      <Text style={{ color: c.text, fontSize: 16, fontWeight: '700', lineHeight: 22 }}>{line}</Text>
    </View>
  );
}

export function EduUnifiedCourseCard({
  emoji,
  color,
  name,
  badges,
  onPress,
}: {
  emoji: string;
  color: string;
  name: string;
  badges: string[];
  onPress?: () => void;
}) {
  const c = useColors();
  const card = (
    <View
      style={{
        width: 168,
        backgroundColor: c.card,
        borderRadius: 24,
        padding: 14,
        borderWidth: 1,
        borderColor: c.line,
        gap: 8,
        ...eduCardShadow,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: `${color}22`,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text style={{ fontSize: 18 }}>{emoji}</Text>
        </View>
        <Text numberOfLines={2} style={{ color: c.text, fontWeight: '800', fontSize: 14, flex: 1 }}>
          {name}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {badges.map((badge) => (
          <View
            key={badge}
            style={{
              backgroundColor: `${color}18`,
              borderRadius: 999,
              paddingHorizontal: 8,
              paddingVertical: 4,
            }}>
            <Text style={{ color, fontSize: 10, fontWeight: '800' }}>{badge}</Text>
          </View>
        ))}
      </View>
    </View>
  );
  if (!onPress) return card;
  return (
    <Pressable onPress={() => { hapticSelect(); onPress(); }} style={({ pressed }) => ({ opacity: pressed ? 0.94 : 1 })}>
      {card}
    </Pressable>
  );
}

export function EduPurpleBar({ label, onPress }: { label: string; onPress?: () => void }) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: c.accent,
        borderRadius: 999,
        paddingVertical: 16,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...eduCardShadow,
      }}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{label}</Text>
      <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>›</Text>
    </Pressable>
  );
}
