import { Pressable, Image, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { BackupCard } from '@/components/BackupCard';
import { Card, EmptyState, Muted, Screen, ThemeToggle, Title, useColors } from '@/components/ui';
import { useClock } from '@/hooks/useClock';
import {
  formatCountdown,
  formatDateTime,
  formatDurationMinutes,
  formatLongDate,
  minutesUntilEnd,
  minutesUntilStart,
  pickNowAndNext,
  todayWeekday,
} from '@/lib/dates';
import { computeGpa100, computeGpa4, formatGpa } from '@/lib/gpa';
import { hapticSelect } from '@/lib/haptics';
import { useAppStore } from '@/store/useAppStore';

export default function HomeScreen() {
  const c = useColors();
  const courses = useAppStore((state) => state.courses);
  const schedule = useAppStore((state) => state.schedule);
  const reminders = useAppStore((state) => state.reminders);
  const attendance = useAppStore((state) => state.attendance);
  const examTargets = useAppStore((state) => state.examTargets);
  const notes = useAppStore((state) => state.notes);
  const router = useRouter();
  const now = useClock(15000);
  const today = todayWeekday();
  const todaysClasses = today ? schedule.filter((item) => item.weekday === today) : [];
  const { current, next } = pickNowAndNext(todaysClasses, now);
  const upcoming = reminders.filter((item) => !item.done).slice(0, 3);
  const riskAttendance = attendance.filter((item) => item.used / item.limit >= 0.75);
  const gpa4 = computeGpa4(courses);
  const gpa100 = computeGpa100(courses);
  const hardFinals = examTargets.filter((item) => item.requiredFinal > 75).length;
  const openReminders = reminders.filter((item) => !item.done).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <Screen>
        <ScrollView contentContainerStyle={{ paddingBottom: 32, gap: 12 }} showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Image
                source={require('../../assets/images/icon.png')}
                style={{ width: 32, height: 32, borderRadius: 8 }}
              />
              <Muted>UniMan</Muted>
            </View>
            <ThemeToggle />
          </View>
          <Title>Bugün ne var?</Title>
          <Text style={{ color: c.muted, fontSize: 16, textTransform: 'capitalize' }}>{formatLongDate()}</Text>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Card style={{ flex: 1, backgroundColor: c.accent }}>
              <Text style={{ color: c.onAccent, opacity: 0.85 }}>GPA</Text>
              <Text style={{ color: c.onAccent, fontSize: 30, fontWeight: '800', marginTop: 4 }}>
                {courses.length ? formatGpa(gpa4) : '—'}
              </Text>
              <Text style={{ color: c.onAccent, opacity: 0.8 }}>4.00</Text>
            </Card>
            <Card style={{ flex: 1, backgroundColor: c.teal }}>
              <Text style={{ color: '#fff', opacity: 0.9 }}>100'lük</Text>
              <Text style={{ color: '#fff', fontSize: 30, fontWeight: '800', marginTop: 4 }}>
                {courses.length ? formatGpa(gpa100, 1) : '—'}
              </Text>
              <Text style={{ color: '#fff', opacity: 0.85 }}>{courses.length} AGNO dersi</Text>
            </Card>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Card style={{ flex: 1 }}>
              <Muted>Bekleyen</Muted>
              <Text style={{ color: c.text, fontSize: 22, fontWeight: '800' }}>{openReminders}</Text>
            </Card>
            <Card style={{ flex: 1 }}>
              <Muted>Riskli final</Muted>
              <Text style={{ color: c.orange, fontSize: 22, fontWeight: '800' }}>{hardFinals}</Text>
            </Card>
            <Pressable
              onPress={() => {
                hapticSelect();
                router.push('/notes');
              }}
              style={{ flex: 1 }}>
              <Card>
                <Muted>Not yaz</Muted>
                <Text style={{ color: c.pink, fontSize: 22, fontWeight: '800' }}>{notes.length}</Text>
              </Card>
            </Pressable>
          </View>

          {hardFinals > 0 || riskAttendance.length > 0 ? (
            <Card style={{ borderColor: c.orange, backgroundColor: c.bgElevated }}>
              <Text style={{ color: c.orange, fontWeight: '800' }}>Dikkat</Text>
              {hardFinals > 0 ? (
                <Text style={{ color: c.text, marginTop: 6 }}>
                  {hardFinals} derste final hedefi yüksek. Hesap sekmesinden bak.
                </Text>
              ) : null}
              {riskAttendance.map((item) => (
                <Text key={item.id} style={{ color: c.text, marginTop: 4 }}>
                  {item.name}: {item.used}/{item.limit} devamsızlık
                </Text>
              ))}
            </Card>
          ) : null}

          <Text style={{ color: c.text, fontSize: 18, fontWeight: '800', marginTop: 8 }}>Bugünün dersleri</Text>
          {today === null ? (
            <EmptyState
              title="Hafta sonu, program duruyor"
              body="Pazartesi gelince burası dolar. Şimdiden Program sekmesinden haftayı kurabilirsin."
            />
          ) : todaysClasses.length === 0 ? (
            <EmptyState
              title={`${today} henüz boş`}
              body="Program → günü seç → ders adı, başlangıç/bitiş, sınıf. Sonra buraya düşer."
            />
          ) : (
            <>
              {current ? (
                <Card style={{ borderColor: c.accent, borderWidth: 2, gap: 4 }}>
                  <Text style={{ color: c.accent, fontWeight: '800', fontSize: 12 }}>ŞİMDİ</Text>
                  <Text style={{ color: c.text, fontSize: 18, fontWeight: '800' }}>{current.title}</Text>
                  <Muted>
                    {current.startTime}–{current.endTime}
                    {current.room ? ` · ${current.room}` : ''}
                    {minutesUntilEnd(current, now) !== null
                      ? ` · ${formatDurationMinutes(minutesUntilEnd(current, now) ?? 0)} kaldı`
                      : ''}
                  </Muted>
                </Card>
              ) : null}
              {next ? (
                <Card style={{ borderColor: c.orange, borderWidth: 1.5, gap: 4 }}>
                  <Text style={{ color: c.orange, fontWeight: '800', fontSize: 12 }}>SIRADAKİ</Text>
                  <Text style={{ color: c.text, fontSize: 18, fontWeight: '800' }}>{next.title}</Text>
                  <Muted>
                    {next.startTime}–{next.endTime}
                    {next.room ? ` · ${next.room}` : ''}
                    {minutesUntilStart(next, now) !== null
                      ? ` · ${formatDurationMinutes(minutesUntilStart(next, now) ?? 0)} sonra`
                      : ''}
                  </Muted>
                </Card>
              ) : null}
              {!current && !next ? <Muted>Bugünün dersleri bitti.</Muted> : null}
              {todaysClasses.map((item) => (
                <Card
                  key={item.id}
                  style={{
                    gap: 4,
                    opacity: item.id === current?.id || item.id === next?.id ? 1 : 0.85,
                    borderColor: item.id === current?.id ? c.accent : item.id === next?.id ? c.orange : c.line,
                  }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 58 }}>
                      <Text style={{ color: c.orange, fontWeight: '800' }}>{item.startTime}</Text>
                      <Text style={{ color: c.muted, marginTop: 2 }}>{item.endTime}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.text, fontSize: 16, fontWeight: '800' }}>{item.title}</Text>
                      <Muted>
                        {item.room || 'Sınıf girilmedi'}
                        {item.remindHours > 0 ? ` · ${item.remindHours}s kala bildirim` : ''}
                      </Muted>
                    </View>
                  </View>
                </Card>
              ))}
            </>
          )}

          <Text style={{ color: c.text, fontSize: 18, fontWeight: '800', marginTop: 8 }}>Yaklaşan</Text>
          {upcoming.length === 0 ? (
            <EmptyState
              title="Takvimde sınav yok"
              body="Takip → Hatırlatma: başlık seç, Bugün/Yarın ve saat dokunuşu yeterli. Tarih yazmana gerek yok."
            />
          ) : (
            upcoming.map((item) => (
              <Card key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: item.kind === 'sinav' ? c.warning : c.blue,
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontSize: 16, fontWeight: '800' }}>{item.title}</Text>
                  <Muted>
                    {item.kind === 'sinav' ? 'Sınav' : 'Ödev'} · {formatDateTime(item.dueAt)} ·{' '}
                    {formatCountdown(item.dueAt, now)}
                  </Muted>
                </View>
              </Card>
            ))
          )}

          <BackupCard />
        </ScrollView>
      </Screen>
    </SafeAreaView>
  );
}
