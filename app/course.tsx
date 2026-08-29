import { useMemo } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  EduColorCard,
  EduListRow,
  EduSectionTitle,
  EduTimelineClassCard,
  FauxGradient,
} from '@/components/edu';
import { Card, EmptyState, GhostButton, Muted, PrimaryButton, Screen, Title, useColors } from '@/components/ui';
import { buildCourseCatalog, findCatalogEntry } from '@/lib/courseCatalog';
import { formatDateTime, formatDurationMinutes, minutesFromClock } from '@/lib/dates';
import { renderMarkdownPreview } from '@/lib/markdownPreview';
import { normalizeCourseName } from '@/lib/courseColor';
import { hapticSuccess } from '@/lib/haptics';
import { useToast } from '@/lib/toast';
import { hrefForSwipeTab } from '@/constants/swipeTabs';
import { useAppStore } from '@/store/useAppStore';

export default function CourseHubScreen() {
  const c = useColors();
  const router = useRouter();
  const toast = useToast((s) => s.show);
  const params = useLocalSearchParams<{ name?: string | string[] }>();
  const courseName = Array.isArray(params.name) ? params.name[0] : params.name;

  const courses = useAppStore((s) => s.courses);
  const schedule = useAppStore((s) => s.schedule);
  const attendance = useAppStore((s) => s.attendance);
  const examTargets = useAppStore((s) => s.examTargets);
  const notes = useAppStore((s) => s.notes);
  const reminders = useAppStore((s) => s.reminders);
  const bumpAttendance = useAppStore((s) => s.bumpAttendance);
  const ensureAttendanceForCourse = useAppStore((s) => s.ensureAttendanceForCourse);

  const catalog = useMemo(
    () => buildCourseCatalog({ courses, schedule, attendance, examTargets, notes, reminders }),
    [courses, schedule, attendance, examTargets, notes, reminders]
  );

  const entry = useMemo(
    () => (courseName ? findCatalogEntry(courseName, catalog) : undefined),
    [courseName, catalog]
  );

  const normalized = courseName ? normalizeCourseName(courseName) : '';
  const slots = schedule.filter((item) => normalizeCourseName(item.title) === normalized);
  const grade = courses.find((item) => normalizeCourseName(item.name) === normalized);
  const attendanceRow = attendance.find((item) => normalizeCourseName(item.name) === normalized);
  const finalTarget = examTargets.find((item) => normalizeCourseName(item.name) === normalized);
  const courseNotes = notes
    .filter((note) => normalizeCourseName(note.courseName || note.title) === normalized)
    .sort((a, b) => Number(b.pinned) - Number(a.pinned));
  const courseReminders = reminders.filter(
    (item) =>
      normalizeCourseName(item.courseName || item.title) === normalized ||
      normalizeCourseName(item.title) === normalized
  );

  const onBumpAttendance = async () => {
    let row = attendanceRow;
    if (!row) {
      await ensureAttendanceForCourse(entry!.name);
      row = useAppStore.getState().attendance.find((item) => normalizeCourseName(item.name) === normalized);
    }
    if (!row) return;
    if (row.used >= row.limit) {
      Alert.alert('Limit doldu', `${entry!.name} için devamsızlık hakkın bitti (${row.limit}).`);
      return;
    }
    await bumpAttendance(row.id, 1);
    hapticSuccess();
    toast('Devamsızlık kaydedildi');
  };

  if (!courseName || !entry) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        <Screen>
          <EmptyState
            emoji="📚"
            title="Ders bulunamadı"
            body="Ana sayfadaki ders kartlarından birini seç."
            actionLabel="Ana sayfa"
            onAction={() => router.replace(hrefForSwipeTab('index') as never)}
          />
        </Screen>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <Screen style={{ paddingTop: 4 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 36, gap: 14 }} showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Geri">
              <Text style={{ color: c.blue, fontWeight: '700' }}>‹ Geri</Text>
            </Pressable>
          </View>

          <Animated.View entering={FadeInDown.duration(300).springify()}>
            <FauxGradient colors={[entry.color, '#5B4AE8']} style={{ borderRadius: 28, padding: 20, gap: 8 }}>
              <Text style={{ fontSize: 40 }}>{entry.emoji}</Text>
              <Text style={{ color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 }}>{entry.name}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.88)', fontSize: 13, lineHeight: 20 }}>
                {[
                  entry.scheduleCount > 0 ? `${entry.scheduleCount} program slotu` : null,
                  entry.hasGrade ? `Not: ${entry.gradeLetter}` : null,
                  entry.hasAttendance ? `Devamsızlık: ${entry.attendanceUsed}/${entry.attendanceLimit}` : null,
                  entry.hasExamTarget ? 'Final hedefi var' : null,
                  entry.noteCount > 0 ? `${entry.noteCount} not` : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || 'Bu ders için henüz detay yok'}
              </Text>
            </FauxGradient>
          </Animated.View>

          <View style={{ gap: 8 }}>
            <EduSectionTitle title="Hızlı işlemler" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <PrimaryButton
                label="+ Not"
                onPress={() =>
                  router.push({ pathname: '/(tabs)/notes', params: { ders: entry.name } } as never)
                }
              />
              <GhostButton label="+ Devamsızlık" onPress={() => void onBumpAttendance()} />
              <GhostButton
                label="Final hesap"
                onPress={() => router.push(hrefForSwipeTab('calculator') as never)}
              />
              <GhostButton
                label="+ Hatırlatma"
                onPress={() =>
                  router.push({ pathname: '/(tabs)/track', params: { ders: entry.name } } as never)
                }
              />
              <GhostButton
                label="Odak modu"
                onPress={() =>
                  router.push({ pathname: '/focus', params: { course: entry.name } } as never)
                }
              />
            </View>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <GhostButton label="Program" onPress={() => router.push(hrefForSwipeTab('schedule') as never)} />
            <GhostButton
              label="Notlar"
              onPress={() =>
                router.push({ pathname: '/(tabs)/notes', params: { ders: entry.name } } as never)
              }
            />
            <GhostButton label="Hesap" onPress={() => router.push(hrefForSwipeTab('calculator') as never)} />
            <GhostButton label="Takip" onPress={() => router.push(hrefForSwipeTab('track') as never)} />
          </View>

          {slots.length > 0 ? (
            <View style={{ gap: 10 }}>
              <EduSectionTitle title="Program saatleri" />
              {slots.map((item) => {
                const start = minutesFromClock(item.startTime);
                const end = minutesFromClock(item.endTime);
                const mins = start !== null && end !== null && end > start ? end - start : 0;
                return (
                  <EduTimelineClassCard
                    key={item.id}
                    timeRange={`${item.weekday.slice(0, 3)} · ${item.startTime} - ${item.endTime}`}
                    title={item.title}
                    subtitle={item.room || 'Sınıf belirtilmedi'}
                    duration={formatDurationMinutes(mins)}
                    tag={item.remindHours ? `${item.remindHours} saat kala` : 'Ders'}
                    color={item.color || entry.color}
                  />
                );
              })}
            </View>
          ) : null}

          {(grade || attendanceRow || finalTarget) && (
            <View style={{ gap: 10 }}>
              <EduSectionTitle title="Akademik durum" />
              {grade ? (
                <Card>
                  <Text style={{ color: c.text, fontWeight: '800' }}>AGNO kaydı</Text>
                  <Muted>
                    {grade.letter} · {grade.ects} AKTS
                    {grade.semester ? ` · ${grade.semester}` : ''}
                  </Muted>
                </Card>
              ) : null}
              {attendanceRow ? (
                <Card>
                  <Text style={{ color: c.text, fontWeight: '800' }}>Devamsızlık</Text>
                  <Muted>
                    {attendanceRow.used} / {attendanceRow.limit} kullanıldı
                  </Muted>
                </Card>
              ) : null}
              {finalTarget ? (
                <Card>
                  <Text style={{ color: c.text, fontWeight: '800' }}>Final hedefi</Text>
                  <Muted>
                    {finalTarget.requiredFinal <= 0
                      ? 'Geçiyorsun'
                      : `Finalden ${finalTarget.requiredFinal} puan gerekli`}{' '}
                    · Yıl içi {finalTarget.yearPoints}
                  </Muted>
                </Card>
              ) : null}
            </View>
          )}

          {courseReminders.length > 0 ? (
            <View style={{ gap: 8 }}>
              <EduSectionTitle title="Hatırlatmalar" />
              {courseReminders.map((item) => (
                <EduListRow
                  key={item.id}
                  emoji={item.kind === 'sinav' ? '🎯' : '📋'}
                  title={item.title}
                  subtitle={formatDateTime(item.dueAt)}
                  accent={item.kind === 'sinav' ? c.warning : c.blue}
                  onPress={() => router.push(hrefForSwipeTab('track') as never)}
                />
              ))}
            </View>
          ) : null}

          <EduSectionTitle title="Notlar" />
          {courseNotes.length === 0 ? (
            <EmptyState
              emoji="📝"
              title="Bu derse not yok"
              body="Notlar sekmesinden ders etiketiyle kayıt ekleyebilirsin."
              actionLabel="Not ekle"
              onAction={() =>
                router.push({ pathname: '/(tabs)/notes', params: { ders: entry.name } } as never)
              }
            />
          ) : (
            courseNotes.map((note) => (
              <EduColorCard
                key={note.id}
                accent={entry.color}
                emoji={note.pinned ? '📌' : '📝'}
                badge={note.pinned ? 'Sabitlendi' : undefined}
                title={note.title}
                subtitle={formatDateTime(note.createdAt)}>
                {note.imageUri ? (
                  <Image
                    source={{ uri: note.imageUri }}
                    style={{ width: '100%', height: 160, borderRadius: 16, backgroundColor: c.line }}
                    resizeMode="cover"
                    accessibilityLabel={`${note.title} fotoğrafı`}
                  />
                ) : null}
                <View style={{ gap: 4 }}>{renderMarkdownPreview(note.body, { color: c.text }, { color: c.muted, lineHeight: 20 })}</View>
              </EduColorCard>
            ))
          )}
        </ScrollView>
      </Screen>
    </SafeAreaView>
  );
}
