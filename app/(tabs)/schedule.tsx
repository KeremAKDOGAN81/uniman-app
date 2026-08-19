import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import {
  Card,
  Chip,
  EmptyState,
  Field,
  GhostButton,
  Muted,
  PrimaryButton,
  Screen,
  Title,
  useColors,
} from '@/components/ui';
import { padTime, todayWeekday } from '@/lib/dates';
import { WEEKDAYS, type RemindHours, type Weekday } from '@/lib/types';
import { useAppStore } from '@/store/useAppStore';

const REMIND_OPTIONS: { hours: RemindHours; label: string }[] = [
  { hours: 0, label: 'Yok' },
  { hours: 1, label: '1s kala' },
  { hours: 2, label: '2s kala' },
  { hours: 3, label: '3s kala' },
];

function ReminderChips({
  value,
  onChange,
}: {
  value: RemindHours;
  onChange: (hours: RemindHours) => void;
}) {
  const c = useColors();
  return (
    <View style={{ gap: 6 }}>
      <Muted>Dersten önce hatırlat</Muted>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {REMIND_OPTIONS.map((option) => (
          <Chip
            key={option.hours}
            label={option.label}
            selected={value === option.hours}
            color={c.blue}
            onPress={() => onChange(option.hours)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

export default function ScheduleScreen() {
  const c = useColors();
  const router = useRouter();
  const schedule = useAppStore((state) => state.schedule);
  const addScheduleItem = useAppStore((state) => state.addScheduleItem);
  const removeScheduleItem = useAppStore((state) => state.removeScheduleItem);
  const setClassReminder = useAppStore((state) => state.setClassReminder);
  const [day, setDay] = useState<Weekday>(todayWeekday() ?? 'Pazartesi');
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [room, setRoom] = useState('');
  const [remindHours, setRemindHours] = useState<RemindHours>(0);
  const dayItems = useMemo(() => schedule.filter((item) => item.weekday === day), [schedule, day]);

  const warnIfNoNotify = (hours: RemindHours, notified: boolean) => {
    if (hours > 0 && !notified) {
      Alert.alert('Kaydedildi, bildirim yok', 'Bildirim iznini Ayarlar’dan UniMan için aç.');
    }
  };

  const onAdd = async () => {
    const name = title.trim();
    if (!name || !startTime.trim() || !endTime.trim()) {
      Alert.alert('Eksik bilgi', 'Ders adı ve saatleri doldur.');
      return;
    }
    const result = await addScheduleItem({
      weekday: day,
      title: name,
      startTime: padTime(startTime),
      endTime: padTime(endTime),
      room: room.trim(),
      remindHours,
    });
    warnIfNoNotify(remindHours, result.notified);
    setTitle('');
    setRoom('');
    setRemindHours(0);
  };

  const onChangeReminder = async (id: number, hours: RemindHours) => {
    const result = await setClassReminder(id, hours);
    warnIfNoNotify(hours, result.notified);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Screen>
          <ScrollView contentContainerStyle={{ paddingBottom: 36, gap: 12 }} showsVerticalScrollIndicator={false}>
            <Title>Haftalık program</Title>
            <Muted>Ders eklerken 1 / 2 / 3 saat kala bildirim kur. Her hafta aynı gün tekrarlanır.</Muted>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {WEEKDAYS.map((item) => (
                <Chip key={item} label={item.slice(0, 3)} selected={day === item} onPress={() => setDay(item)} />
              ))}
            </ScrollView>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '800' }}>{day}</Text>

            {dayItems.length === 0 ? (
              <EmptyState title={`${day} günü ders yok`} body="Aşağıdan ders adı, 09:00–10:50 gibi saat ve sınıf yaz. Ana sayfa bugünü buradan okur." />
            ) : (
              dayItems.map((item) => (
                <Card key={item.id} style={{ gap: 8, borderLeftWidth: 4, borderLeftColor: c.orange }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: c.orange, fontWeight: '800' }}>
                      {item.startTime} – {item.endTime}
                    </Text>
                    <GhostButton label="Sil" danger onPress={() => removeScheduleItem(item.id)} />
                  </View>
                  <Text style={{ color: c.text, fontSize: 17, fontWeight: '800' }}>{item.title}</Text>
                  <Muted>{item.room || 'Sınıf girilmedi'}</Muted>
                  <ReminderChips value={item.remindHours} onChange={(hours) => onChangeReminder(item.id, hours)} />
                  <GhostButton
                    label="Bu derse not"
                    onPress={() => router.push({ pathname: '/notes', params: { ders: item.title } })}
                  />
                </Card>
              ))
            )}

            <Card style={{ gap: 12, marginTop: 8 }}>
              <Text style={{ color: c.text, fontSize: 16, fontWeight: '800' }}>{day} için ders ekle</Text>
              <Field label="Ders adı" value={title} onChangeText={setTitle} placeholder="Örn. Nesne Tabanlı Programlama" />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Field label="Başlangıç" value={startTime} onChangeText={setStartTime} placeholder="09:00" />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Bitiş" value={endTime} onChangeText={setEndTime} placeholder="10:50" />
                </View>
              </View>
              <Field label="Sınıf / lab" value={room} onChangeText={setRoom} placeholder="B-204" />
              <ReminderChips value={remindHours} onChange={setRemindHours} />
              <PrimaryButton label="Programa ekle" onPress={onAdd} />
            </Card>
          </ScrollView>
        </Screen>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
