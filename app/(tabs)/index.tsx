import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  EduExamCountdownCard,
  EduHomeTopBar,
  EduJoinHero,
  EduListRow,
  EduOngoingCourseCard,
  EduPurpleBar,
  EduSectionTitle,
  EduUnifiedCourseCard,
  EduWeeklySummaryCard,
  greetingForHour,
} from '@/components/edu';
import { SwipeTabShell } from '@/components/SwipeTabShell';
import { useColors } from '@/components/ui';
import { hrefForSwipeTab } from '@/constants/swipeTabs';
import { useClock } from '@/hooks/useClock';
import { buildCourseCatalog } from '@/lib/courseCatalog';
import { eduCardShadow, emojiForCourse, progressToneForColor } from '@/lib/courseColor';
import {
  formatCountdown,
  formatDateTime,
  formatDurationMinutes,
  minutesFromClock,
  minutesUntilEnd,
  minutesUntilStart,
  pickNowAndNext,
  todayWeekday,
} from '@/lib/dates';
import { computeWeeklySummary, findNextExam } from '@/lib/homeInsights';
import { displayName, profileSubtitle } from '@/lib/profile';
import { computeGpa100, computeGpa4, formatGpa } from '@/lib/gpa';
import type { Reminder, ScheduleItem } from '@/lib/types';
import { useAppStore } from '@/store/useAppStore';

function classDuration(item: ScheduleItem): string {
  const start = minutesFromClock(item.startTime);
  const end = minutesFromClock(item.endTime);
  if (start === null || end === null || end <= start) return '—';
  const mins = end - start;
  if (mins >= 60) return `${Math.floor(mins / 60)}s ${mins % 60}dk`;
  return `${mins} dk`;
}

function courseBadges(entry: ReturnType<typeof buildCourseCatalog>[number]): string[] {
  const badges: string[] = [];
  if (entry.scheduleCount > 0) badges.push('Program');
  if (entry.hasGrade) badges.push(entry.gradeLetter ?? 'AGNO');
  if (entry.hasAttendance) badges.push('Devam');
  if (entry.hasExamTarget) badges.push('Final');
  if (entry.noteCount > 0) badges.push(`${entry.noteCount} not`);
  return badges.length > 0 ? badges : ['Ders'];
}

export default function HomeScreen() {
  const c = useColors();
  const courses = useAppStore((state) => state.courses);
  const schedule = useAppStore((state) => state.schedule);
  const reminders = useAppStore((state) => state.reminders);
  const attendance = useAppStore((state) => state.attendance);
  const examTargets = useAppStore((state) => state.examTargets);
  const notes = useAppStore((state) => state.notes);
  const profile = useAppStore((state) => state.profile);
  const router = useRouter();
  const now = useClock(15000);
  const today = todayWeekday();
  const todaysClasses = today ? schedule.filter((item) => item.weekday === today) : [];
  const { current, next } = pickNowAndNext(todaysClasses, now);
  const openReminders = reminders.filter((item) => !item.done);
  const greeting = useMemo(() => greetingForHour(now.getHours()), [now]);
  const gpa4 = computeGpa4(courses);
  const joinedToday = todaysClasses.length ? Math.min(todaysClasses.length, Math.max(1, todaysClasses.indexOf(current ?? next ?? todaysClasses[0]) + 1)) : 0;

  const weeklySummary = useMemo(
    () =>
      computeWeeklySummary({
        scheduleCount: schedule.length,
        reminders,
        attendance,
        courses,
        now,
      }),
    [schedule.length, reminders, attendance, courses, now]
  );

  const nextExam = useMemo(() => findNextExam(reminders, now), [reminders, now]);

  const catalog = useMemo(
    () => buildCourseCatalog({ courses, schedule, attendance, examTargets, notes, reminders }),
    [courses, schedule, attendance, examTargets, notes, reminders]
  );

  const hero = useMemo(() => {
    if (current) {
      const left = minutesUntilEnd(current, now) ?? 0;
      return {
        title: `${current.title} — ${formatDurationMinutes(left)} kaldı`,
        subtitle: current.room || 'Ders devam ediyor',
        button: 'Derse git',
        time: current.endTime,
        action: () => router.navigate(hrefForSwipeTab('schedule') as never),
      };
    }
    if (next) {
      const until = minutesUntilStart(next, now) ?? 0;
      return {
        title: `${next.title} — ${formatDurationMinutes(until)} sonra`,
        subtitle: next.room || 'Sıradaki ders',
        button: 'Programa git',
        time: next.startTime,
        action: () => router.navigate(hrefForSwipeTab('schedule') as never),
      };
    }
    if (today === null) {
      return {
        title: 'Hafta sonu — program duruyor',
        subtitle: 'Pazartesi gelince burası dolacak',
        button: 'Program kur',
        time: '--:--',
        action: () => router.navigate(hrefForSwipeTab('schedule') as never),
      };
    }
    if (todaysClasses.length === 0) {
      return {
        title: 'Bugün ders yok',
        subtitle: `${today} için program ekle`,
        button: 'Ders ekle',
        time: '--:--',
        action: () => router.navigate(hrefForSwipeTab('schedule') as never),
      };
    }
    return {
      title: 'Bugünkü dersler bitti',
      subtitle: 'Yarın için hazırlan',
      button: 'Program',
      time: now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      action: () => router.navigate(hrefForSwipeTab('schedule') as never),
    };
  }, [current, next, today, todaysClasses.length, now, router]);

  const ongoingCards = useMemo(() => {
    const cards: {
      key: string;
      emoji: string;
      color: string;
      title: string;
      subtitle: string;
      tags: string[];
      progress: string;
      progressColor: string;
      onPress: () => void;
    }[] = [];
    todaysClasses.slice(0, 4).forEach((item) => {
      const courseColor = item.color || c.accent;
      cards.push({
        key: `c-${item.id}`,
        emoji: emojiForCourse(item.title),
        color: courseColor,
        title: item.title,
        subtitle: `${item.startTime} – ${item.endTime}`,
        tags: [item.weekday.slice(0, 3)],
        progress: classDuration(item),
        progressColor: progressToneForColor(courseColor),
        onPress: () => router.navigate(hrefForSwipeTab('schedule') as never),
      });
    });
    examTargets.slice(0, 2).forEach((item) => {
      const courseColor = progressToneForColor(c.accent);
      cards.push({
        key: `e-${item.id}`,
        emoji: '🎯',
        color: c.accent,
        title: item.name,
        subtitle: `Final hedefi: ${item.requiredFinal > 0 ? item.requiredFinal : 'Geçti'}`,
        tags: ['Final'],
        progress: 'Hesap',
        progressColor: courseColor,
        onPress: () => router.navigate(hrefForSwipeTab('calculator') as never),
      });
    });
    if (cards.length === 0) {
      cards.push({
        key: 'empty',
        emoji: '📅',
        color: c.accent,
        title: 'Programını kur',
        subtitle: 'Program sekmesinden ders ekle',
        tags: ['Program'],
        progress: 'Başla',
        progressColor: progressToneForColor(c.accent),
        onPress: () => router.navigate(hrefForSwipeTab('schedule') as never),
      });
    }
    return cards;
  }, [todaysClasses, examTargets, router, c.accent]);

  const feedItems = useMemo(() => {
    const rows: { key: string; emoji: string; title: string; subtitle: string; accent: string; onPress: () => void }[] = [];
    openReminders.slice(0, 3).forEach((item: Reminder) => {
      rows.push({
        key: `r-${item.id}`,
        emoji: item.kind === 'sinav' ? '🎯' : '📋',
        title: item.title,
        subtitle: `${formatDateTime(item.dueAt)} · ${formatCountdown(item.dueAt, now)}`,
        accent: item.kind === 'sinav' ? '#FF9F1C' : '#6C5CE7',
        onPress: () => router.navigate(hrefForSwipeTab('track') as never),
      });
    });
    attendance.filter((a) => a.used / a.limit >= 0.75).forEach((item) => {
      rows.push({
        key: `a-${item.id}`,
        emoji: '⚠️',
        title: item.name,
        subtitle: `Devamsızlık ${item.used}/${item.limit}`,
        accent: '#EF4444',
        onPress: () => router.navigate(hrefForSwipeTab('track') as never),
      });
    });
    return rows;
  }, [openReminders, attendance, now, router]);

  return (
    <SwipeTabShell tab="index">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28, gap: 18 }} showsVerticalScrollIndicator={false}>
        <EduHomeTopBar
          greeting={greeting}
          name={displayName(profile)}
          subtitle={profileSubtitle(profile)}
          notifyCount={openReminders.length}
          onNotify={() => router.navigate(hrefForSwipeTab('track') as never)}
          onSettings={() => router.push('/settings' as never)}
        />

        {nextExam ? (
          <EduExamCountdownCard
            title={nextExam.title}
            countdown={nextExam.countdown}
            dateLabel={nextExam.dateLabel}
            onPress={() => router.navigate(hrefForSwipeTab('track') as never)}
          />
        ) : null}

        <EduJoinHero
          title={hero.title}
          subtitle={hero.subtitle}
          buttonLabel={hero.button}
          statLabel="Bugünkü ders"
          statValue={todaysClasses.length ? `${joinedToday}/${todaysClasses.length}` : '0/0'}
          timeLabel={hero.time}
          onPress={hero.action}
        />

        {schedule.length > 0 || courses.length > 0 || openReminders.length > 0 ? (
          <EduWeeklySummaryCard line={weeklySummary.line} />
        ) : null}

        {catalog.length > 0 ? (
          <View style={{ gap: 10 }}>
            <EduSectionTitle title="Derslerim" action="Program" onAction={() => router.navigate(hrefForSwipeTab('schedule') as never)} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {catalog.slice(0, 8).map((entry) => (
                <EduUnifiedCourseCard
                  key={entry.normalized}
                  emoji={entry.emoji}
                  color={entry.color}
                  name={entry.name}
                  badges={courseBadges(entry)}
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/notes',
                      params: { ders: entry.name },
                    } as never)
                  }
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        <EduSectionTitle
          title="Devam eden dersler"
          action="Tümü"
          onAction={() => router.navigate(hrefForSwipeTab('schedule') as never)}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
          {ongoingCards.map((card) => (
            <EduOngoingCourseCard
              key={card.key}
              emoji={card.emoji}
              iconColor={card.color}
              title={card.title}
              subtitle={card.subtitle}
              tags={card.tags}
              progressLabel={card.progress}
              progressColor={card.progressColor}
              onPress={card.onPress}
            />
          ))}
        </ScrollView>

        {courses.length > 0 ? (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: c.card,
                borderRadius: 28,
                padding: 16,
                borderWidth: 1,
                borderColor: c.line,
                ...eduCardShadow,
              }}>
              <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700' }}>AGNO</Text>
              <Text style={{ color: c.text, fontSize: 28, fontWeight: '900', marginTop: 4 }}>{formatGpa(gpa4)}</Text>
              <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{formatGpa(computeGpa100(courses), 1)} / 100</Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: c.card,
                borderRadius: 28,
                padding: 16,
                borderWidth: 1,
                borderColor: c.line,
                ...eduCardShadow,
              }}>
              <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700' }}>Hatırlatma</Text>
              <Text style={{ color: c.text, fontSize: 28, fontWeight: '900', marginTop: 4 }}>{openReminders.length}</Text>
              <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>açık</Text>
            </View>
          </View>
        ) : null}

        {feedItems.length > 0 ? (
          <View style={{ gap: 10 }}>
            <EduSectionTitle title="Yaklaşan" action="Takip" onAction={() => router.navigate(hrefForSwipeTab('track') as never)} />
            {feedItems.map((row) => (
              <EduListRow
                key={row.key}
                emoji={row.emoji}
                title={row.title}
                subtitle={row.subtitle}
                accent={row.accent}
                onPress={row.onPress}
              />
            ))}
          </View>
        ) : null}

        <EduPurpleBar label="Program zaman çizelgesi" onPress={() => router.navigate(hrefForSwipeTab('schedule') as never)} />
      </ScrollView>
    </SwipeTabShell>
  );
}
