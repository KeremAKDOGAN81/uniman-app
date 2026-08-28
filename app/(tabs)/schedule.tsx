import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { CourseChipRow } from '@/components/CourseChipRow';
import { SwipeTabShell } from '@/components/SwipeTabShell';
import { TimePickerField } from '@/components/TimePickerField';
import {
  EduActivityCard,
  EduFormCard,
  EduPageHeader,
  EduTimelineClassCard,
  EduWeekDateStrip,
} from '@/components/edu';
import {
  Chip,
  EmptyState,
  Field,
  GhostButton,
  Muted,
  PrimaryButton,
  Screen,
  useColors,
} from '@/components/ui';
import { confirmDelete } from '@/lib/confirm';
import { collectCourseNames, hasAttendanceForName, hasGradeForName } from '@/lib/courseCatalog';
import { minutesFromClock, padTime, todayWeekday } from '@/lib/dates';
import { hapticSuccess } from '@/lib/haptics';
import { shareSchedule } from '@/lib/shareSchedule';
import {
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

function WeekOverview({
  schedule,
  day,
  onSelect,
}: {
  schedule: ScheduleItem[];
  day: Weekday;
  onSelect: (day: Weekday) => void;
}) {
  const days = WEEKDAYS.map((item, index) => ({
    key: item,
    label: item.slice(0, 3),
    dayNum: 15 + index,
  }));
  const counts = Object.fromEntries(
    WEEKDAYS.map((item) => [item, schedule.filter((row) => row.weekday === item).length])
  ) as Record<string, number>;
  return <EduWeekDateStrip days={days} selected={day} onSelect={(k) => onSelect(k as Weekday)} counts={counts} />;
}

export default function ScheduleScreen() {
  const c = useColors();
  const router = useRouter();
  const schedule = useAppStore((state) => state.schedule);
  const courses = useAppStore((state) => state.courses);
  const attendance = useAppStore((state) => state.attendance);
  const examTargets = useAppStore((state) => state.examTargets);
  const notes = useAppStore((state) => state.notes);
  const reminders = useAppStore((state) => state.reminders);
  const addScheduleItem = useAppStore((state) => state.addScheduleItem);
  const updateScheduleItem = useAppStore((state) => state.updateScheduleItem);
  const removeScheduleItem = useAppStore((state) => state.removeScheduleItem);
  const setClassReminder = useAppStore((state) => state.setClassReminder);
  const ensureAttendanceForCourse = useAppStore((state) => state.ensureAttendanceForCourse);
  const ensureGradeForCourse = useAppStore((state) => state.ensureGradeForCourse);

  const [day, setDay] = useState<Weekday>(todayWeekday() ?? 'Pazartesi');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [room, setRoom] = useState('');
  const [remindHours, setRemindHours] = useState<RemindHours>(0);

  const courseSuggestions = useMemo(
    () => collectCourseNames({ courses, schedule, attendance, examTargets, notes, reminders }),
    [courses, schedule, attendance, examTargets, notes, reminders]
  );

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
    setStartTime('09:00');
    setEndTime('10:00');
  };

  const offerCourseLinks = (courseName: string) => {
    const missingGrade = !hasGradeForName(courseName, courses);
    const missingAttendance = !hasAttendanceForName(courseName, attendance);
    if (!missingGrade && !missingAttendance) return;

    const actions: { text: string; onPress?: () => void; style?: 'cancel' | 'default' }[] = [
      { text: 'Tamam', style: 'cancel' },
    ];
    if (missingGrade) {
      actions.unshift({
        text: 'AGNO’ya ekle',
        onPress: () => {
          void ensureGradeForCourse(courseName).then(() => hapticSuccess());
        },
      });
    }
    if (missingAttendance) {
      actions.unshift({
        text: 'Devamsızlığa ekle',
        onPress: () => {
          void ensureAttendanceForCourse(courseName).then(() => hapticSuccess());
        },
      });
    }

    Alert.alert(`${courseName}`, 'Bu dersi diğer modüllere de bağlamak ister misin?', actions);
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
      Alert.alert('Saat hatası', 'Başlangıç ve bitiş saatini seç.');
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
    };
    if (editingId !== null) {
      const result = await updateScheduleItem(editingId, payload);
      warnIfNoNotify(remindHours, result.notified);
    } else {
      const result = await addScheduleItem(payload);
      warnIfNoNotify(remindHours, result.notified);
      offerCourseLinks(name);
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
  };

  const onChangeReminder = async (id: number, hours: RemindHours) => {
    const result = await setClassReminder(id, hours);
    warnIfNoNotify(hours, result.notified);
  };

  return (
    <SwipeTabShell tab="schedule">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Screen>
          <ScrollView contentContainerStyle={{ paddingBottom: 36, gap: 14 }} showsVerticalScrollIndicator={false}>
            <EduPageHeader title="Program" subtitle="Haftalık ders saatlerin ve hatırlatmalar." badge="Program" />

            {schedule.length > 0 ? (
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <GhostButton label="Programı paylaş" onPress={() => shareSchedule(schedule)} />
              </View>
            ) : null}

            <EduActivityCard
              label="Hatırlatılan ders"
              percent={
                dayItems.length
                  ? Math.min(100, Math.round((dayItems.filter((i) => i.remindHours > 0).length / dayItems.length) * 100) || 40)
                  : 0
              }
            />

            <WeekOverview schedule={schedule} day={day} onSelect={setDay} />

            {dayItems.length === 0 ? (
              <EmptyState
                emoji="📅"
                title={`${day} günü ders yok`}
                body="Ders adı, saat ve sınıf ekle. Ana sayfa bugünkü programı buradan okur."
                actionLabel="Ders ekle"
                onAction={() => setTitle('Nesne Tabanlı Programlama')}
              />
            ) : (
              dayItems.map((item) => {
                const start = minutesFromClock(item.startTime);
                const end = minutesFromClock(item.endTime);
                const mins = start !== null && end !== null && end > start ? end - start : 0;
                const duration = mins >= 60 ? `${Math.floor(mins / 60)}s ${mins % 60}dk` : `${mins} dk`;
                return (
                  <View key={item.id} style={{ gap: 8 }}>
                    <EduTimelineClassCard
                      timeRange={`${item.startTime} - ${item.endTime}`}
                      title={item.title}
                      subtitle={item.room || 'Sınıf belirtilmedi'}
                      duration={duration}
                      tag={item.remindHours ? `${item.remindHours}s kala` : 'Ders'}
                      color={item.color || c.accent}
                    />
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 4, gap: 4 }}>
                      <GhostButton label="Düzenle" onPress={() => onEdit(item)} />
                      <GhostButton
                        label="Sil"
                        danger
                        onPress={() =>
                          confirmDelete('Ders silinsin mi?', item.title, () => removeScheduleItem(item.id))
                        }
                      />
                      <GhostButton
                        label="Not"
                        onPress={() => router.push({ pathname: '/(tabs)/notes', params: { ders: item.title } })}
                      />
                      {!hasGradeForName(item.title, courses) ? (
                        <GhostButton
                          label="AGNO"
                          onPress={() => void ensureGradeForCourse(item.title).then(() => hapticSuccess())}
                        />
                      ) : null}
                      {!hasAttendanceForName(item.title, attendance) ? (
                        <GhostButton
                          label="Devam"
                          onPress={() => void ensureAttendanceForCourse(item.title).then(() => hapticSuccess())}
                        />
                      ) : null}
                    </View>
                    <RemindRow value={item.remindHours} onChange={(hours) => onChangeReminder(item.id, hours)} />
                  </View>
                );
              })
            )}

            <EduFormCard title={editingId !== null ? 'Dersi güncelle' : `${day} için ders ekle`}>
              <Field
                label="Ders adı"
                value={title}
                onChangeText={setTitle}
                placeholder="Örn. Nesne Tabanlı Programlama"
              />
              {courseSuggestions.length > 0 ? (
                <CourseChipRow names={courseSuggestions} selected={title} onSelect={setTitle} />
              ) : null}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TimePickerField label="Başlangıç" value={startTime} onChange={setStartTime} />
                <TimePickerField label="Bitiş" value={endTime} onChange={setEndTime} />
              </View>
              <Field label="Sınıf / lab" value={room} onChangeText={setRoom} placeholder="B-204" />
              <RemindRow value={remindHours} onChange={setRemindHours} />
              <PrimaryButton
                label={editingId !== null ? 'Kaydet' : 'Programa ekle'}
                onPress={onSave}
              />
              {editingId !== null ? <GhostButton label="Vazgeç" onPress={resetForm} /> : null}
            </EduFormCard>
          </ScrollView>
        </Screen>
      </KeyboardAvoidingView>
    </SwipeTabShell>
  );
}
