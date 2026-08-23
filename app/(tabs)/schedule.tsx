import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
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
import { confirmDelete } from '@/lib/confirm';
import { minutesFromClock, padTime, todayWeekday } from '@/lib/dates';
import {
  COURSE_COLORS,
  WEEKDAYS,
  type RemindHours,
  type ScheduleItem,
  type Weekday,
} from '@/lib/types';
import { useAppStore } from '@/store/useAppStore';

const REMIND_OPTIONS: { hours: RemindHours; label: string }[] = [
  { hours: 0, label: 'Yok' },
  { hours: 1, label: '1s kala' },
  { hours: 2, label: '2s kala' },
  { hours: 3, label: '3s kala' },
];

function RemindRow({
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

function ColorRow({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <View style={{ gap: 6 }}>
      <Muted>Ders rengi</Muted>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {COURSE_COLORS.map((swatch) => (
          <Pressable
            key={swatch}
            onPress={() => onChange(swatch)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: swatch,
              borderWidth: value === swatch ? 3 : 1,
              borderColor: value === swatch ? '#FFFFFF' : 'transparent',
            }}
          />
        ))}
      </View>
    </View>
  );
}

function WeekOverview({
  schedule,
  day,
  onSelect,
}: {
  schedule: ScheduleItem[];
  day: Weekday;
  onSelect: (day: Weekday) => void;
}) {
  const c = useColors();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {WEEKDAYS.map((item) => {
        const count = schedule.filter((row) => row.weekday === item).length;
        const selected = day === item;
        return (
          <Pressable
            key={item}
            onPress={() => onSelect(item)}
            style={{
              width: 72,
              borderRadius: 16,
              paddingVertical: 10,
              paddingHorizontal: 8,
              backgroundColor: selected ? c.accent : c.bgElevated,
              borderWidth: 1,
              borderColor: selected ? c.accent : c.line,
              alignItems: 'center',
              gap: 4,
            }}>
            <Text style={{ color: selected ? c.onAccent : c.muted, fontWeight: '800', fontSize: 12 }}>
              {item.slice(0, 3)}
            </Text>
            <Text style={{ color: selected ? c.onAccent : c.text, fontWeight: '800', fontSize: 18 }}>
              {count}
            </Text>
            <View style={{ flexDirection: 'row', gap: 3, minHeight: 6 }}>
              {schedule
                .filter((row) => row.weekday === item)
                .slice(0, 4)
                .map((row) => (
                  <View
                    key={row.id}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: row.color || c.orange,
                    }}
                  />
                ))}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export default function ScheduleScreen() {
  const c = useColors();
  const router = useRouter();
  const schedule = useAppStore((state) => state.schedule);
  const courses = useAppStore((state) => state.courses);
  const addScheduleItem = useAppStore((state) => state.addScheduleItem);
  const updateScheduleItem = useAppStore((state) => state.updateScheduleItem);
  const removeScheduleItem = useAppStore((state) => state.removeScheduleItem);
  const setClassReminder = useAppStore((state) => state.setClassReminder);

  const [day, setDay] = useState<Weekday>(todayWeekday() ?? 'Pazartesi');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [room, setRoom] = useState('');
  const [remindHours, setRemindHours] = useState<RemindHours>(0);
  const [color, setColor] = useState<string>(COURSE_COLORS[0]);

  const courseSuggestions = useMemo(() => {
    const names = new Set<string>();
    for (const course of courses) {
      const name = course.name.trim();
      if (name) names.add(name);
    }
    for (const item of schedule) {
      const name = item.title.trim();
      if (name) names.add(name);
    }
    return [...names].sort((a, b) => a.localeCompare(b, 'tr'));
  }, [courses, schedule]);

  const dayItems = useMemo(
    () => schedule.filter((item) => item.weekday === day),
    [schedule, day]
  );

  const warnIfNoNotify = (hours: RemindHours, notified: boolean) => {
    if (hours > 0 && !notified) {
      Alert.alert('Kaydedildi, bildirim yok', 'Bildirim iznini Ayarlar’dan UniMan için aç.');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setRoom('');
    setRemindHours(0);
    setColor(COURSE_COLORS[schedule.length % COURSE_COLORS.length]);
    setStartTime('09:00');
    setEndTime('10:00');
  };

  const onSave = async () => {
    const name = title.trim();
    if (!name || !startTime.trim() || !endTime.trim()) {
      Alert.alert('Eksik bilgi', 'Ders adı ve saatleri doldur.');
      return;
    }
    const start = padTime(startTime);
    const end = padTime(endTime);
    const startMin = minutesFromClock(start);
    const endMin = minutesFromClock(end);
    if (startMin === null || endMin === null) {
      Alert.alert('Saat hatası', 'Saatleri SS:DD biçiminde yaz.');
      return;
    }
    if (endMin <= startMin) {
      Alert.alert('Saat hatası', 'Bitiş saati başlangıçtan sonra olmalı.');
      return;
    }
    const overlap = schedule.some((item) => {
      if (item.weekday !== day) return false;
      if (editingId !== null && item.id === editingId) return false;
      const otherStart = minutesFromClock(item.startTime);
      const otherEnd = minutesFromClock(item.endTime);
      if (otherStart === null || otherEnd === null) return false;
      return startMin < otherEnd && otherStart < endMin;
    });
    if (overlap) {
      Alert.alert('Çakışma', 'Aynı günde bu saat aralığında başka bir ders var.');
      return;
    }
    const payload = {
      weekday: day,
      title: name,
      startTime: start,
      endTime: end,
      room: room.trim(),
      remindHours,
      color,
    };
    if (editingId !== null) {
      const result = await updateScheduleItem(editingId, payload);
      warnIfNoNotify(remindHours, result.notified);
    } else {
      const result = await addScheduleItem(payload);
      warnIfNoNotify(remindHours, result.notified);
    }
    resetForm();
  };

  const onEdit = (item: ScheduleItem) => {
    setEditingId(item.id);
    setDay(item.weekday);
    setTitle(item.title);
    setStartTime(item.startTime);
    setEndTime(item.endTime);
    setRoom(item.room);
    setRemindHours(item.remindHours);
    setColor(item.color || COURSE_COLORS[0]);
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
            <Muted>Renkli dersler, hafta şeridi ve 1 / 2 / 3 saat kala bildirim.</Muted>

            <WeekOverview schedule={schedule} day={day} onSelect={setDay} />
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '800' }}>{day}</Text>

            {dayItems.length === 0 ? (
              <EmptyState
                emoji="📅"
                title={`${day} günü ders yok`}
                body="Aşağıdan ders adı, saat ve sınıf yaz. Ana sayfa bugünü buradan okur."
                actionLabel="Örnek ders adı koy"
                onAction={() => setTitle('Nesne Tabanlı Programlama')}
              />
            ) : (
              dayItems.map((item) => (
                <Card
                  key={item.id}
                  style={{ gap: 8, borderLeftWidth: 5, borderLeftColor: item.color || c.orange }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: item.color || c.orange, fontWeight: '800' }}>
                      {item.startTime} – {item.endTime}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <GhostButton label="Düzenle" onPress={() => onEdit(item)} />
                      <GhostButton
                        label="Sil"
                        danger
                        onPress={() =>
                          confirmDelete('Ders silinsin mi?', item.title, () =>
                            removeScheduleItem(item.id)
                          )
                        }
                      />
                    </View>
                  </View>
                  <Text style={{ color: c.text, fontSize: 17, fontWeight: '800' }}>{item.title}</Text>
                  <Muted>{item.room || 'Sınıf girilmedi'}</Muted>
                  <RemindRow
                    value={item.remindHours}
                    onChange={(hours) => onChangeReminder(item.id, hours)}
                  />
                  <GhostButton
                    label="Bu derse not"
                    onPress={() => router.push({ pathname: '/notes', params: { ders: item.title } })}
                  />
                </Card>
              ))
            )}

            <Card style={{ gap: 12, marginTop: 8 }}>
              <Text style={{ color: c.text, fontSize: 16, fontWeight: '800' }}>
                {editingId !== null ? 'Dersi güncelle' : `${day} için ders ekle`}
              </Text>
              <Field
                label="Ders adı"
                value={title}
                onChangeText={setTitle}
                placeholder="Örn. Nesne Tabanlı Programlama"
              />
              {courseSuggestions.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {courseSuggestions.map((suggestion) => (
                    <Chip
                      key={suggestion}
                      label={suggestion}
                      selected={title === suggestion}
                      onPress={() => setTitle(suggestion)}
                    />
                  ))}
                </ScrollView>
              ) : null}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Field label="Başlangıç" value={startTime} onChangeText={setStartTime} placeholder="09:00" />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Bitiş" value={endTime} onChangeText={setEndTime} placeholder="10:50" />
                </View>
              </View>
              <Field label="Sınıf / lab" value={room} onChangeText={setRoom} placeholder="B-204" />
              <ColorRow value={color} onChange={setColor} />
              <RemindRow value={remindHours} onChange={setRemindHours} />
              <PrimaryButton
                label={editingId !== null ? 'Kaydet' : 'Programa ekle'}
                onPress={onSave}
              />
              {editingId !== null ? <GhostButton label="Vazgeç" onPress={resetForm} /> : null}
            </Card>
          </ScrollView>
        </Screen>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
