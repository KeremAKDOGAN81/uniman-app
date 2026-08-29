import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Card, GhostButton, Muted, Screen, Title, useColors } from '@/components/ui';
import { buildWeeklyReport } from '@/lib/weeklyReport';
import { useAppStore } from '@/store/useAppStore';

export default function WeeklyReportScreen() {
  const c = useColors();
  const router = useRouter();
  const schedule = useAppStore((s) => s.schedule);
  const reminders = useAppStore((s) => s.reminders);
  const attendance = useAppStore((s) => s.attendance);
  const courses = useAppStore((s) => s.courses);
  const notes = useAppStore((s) => s.notes);
  const activeSemester = useAppStore((s) => s.activeSemester);

  const report = useMemo(
    () => buildWeeklyReport({ schedule, reminders, attendance, courses, notes, activeSemester }),
    [schedule, reminders, attendance, courses, notes, activeSemester]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <Screen>
        <ScrollView contentContainerStyle={{ paddingBottom: 36, gap: 14 }} showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title>Haftalık rapor</Title>
            <Pressable onPress={() => router.back()} hitSlop={10}>
              <Text style={{ color: c.blue, fontWeight: '700' }}>Kapat</Text>
            </Pressable>
          </View>
          <Muted>{report.generatedAt}</Muted>

          <Animated.View entering={FadeInDown.duration(280).springify()}>
            <Card style={{ gap: 8 }}>
              <Text style={{ color: c.text, fontWeight: '900', fontSize: 18, lineHeight: 26 }}>{report.headline}</Text>
            </Card>
          </Animated.View>

          {report.sections.map((section, index) => (
            <Animated.View key={section.title} entering={FadeInDown.delay(index * 60).duration(280).springify()}>
              <Card style={{ gap: 8 }}>
                <Text style={{ color: c.text, fontWeight: '800', fontSize: 16 }}>{section.title}</Text>
                {section.lines.map((line, lineIndex) => (
                  <Text key={`${section.title}-${lineIndex}`} style={{ color: c.muted, lineHeight: 21 }}>
                    {line}
                  </Text>
                ))}
              </Card>
            </Animated.View>
          ))}

          <GhostButton label="Odak moduna geç" onPress={() => router.push('/focus' as never)} />
        </ScrollView>
      </Screen>
    </SafeAreaView>
  );
}
