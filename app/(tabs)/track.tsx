import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DateTimePicker } from '@/components/DateTimePicker';
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
import { formatCountdown, formatDateTime, isUpcoming, parseLocalDateTime, toDateInput } from '@/lib/dates';
import { hapticSuccess } from '@/lib/haptics';
import type { ReminderKind } from '@/lib/types';
import { useAppStore } from '@/store/useAppStore';
import { useClock } from '@/hooks/useClock';

type ReminderFilter = 'open' | 'past' | 'done' | 'all';

export default function TrackScreen() {
  const c = useColors();
  const [tab, setTab] = useState<'hatirlatma' | 'devamsizlik'>('hatirlatma');
  const [reminderFilter, setReminderFilter] = useState<ReminderFilter>('open');

  const reminders = useAppStore((state) => state.reminders);
  const courses = useAppStore((state) => state.courses);
  const schedule = useAppStore((state) => state.schedule);
  const addReminder = useAppStore((state) => state.addReminder);
  const updateReminder = useAppStore((state) => state.updateReminder);
  const toggleReminder = useAppStore((state) => state.toggleReminder);
  const removeReminder = useAppStore((state) => state.removeReminder);
  const attendance = useAppStore((state) => state.attendance);
  const addAttendance = useAppStore((state) => state.addAttendance);
  const updateAttendance = useAppStore((state) => state.updateAttendance);
  const bumpAttendance = useAppStore((state) => state.bumpAttendance);
  const removeAttendance = useAppStore((state) => state.removeAttendance);
  const now = useClock(15000);

  const courseSuggestions = useMemo(() => {
    const names = new Set<string>();
    for (const course of courses) {
      const name = course.name.trim();
      if (name) names.add(name);
    }
    for (const item of schedule) {
      const title = item.title.trim();
      if (title) names.add(title);
    }
    return [...names].sort((a, b) => a.localeCompare(b, 'tr'));
  }, [courses, schedule]);

  const filteredReminders = useMemo(() => {
    return reminders.filter((item) => {
      if (reminderFilter === 'all') return true;
      if (reminderFilter === 'done') return item.done;
      if (reminderFilter === 'open') return !item.done && isUpcoming(item.dueAt);
      return !item.done && !isUpcoming(item.dueAt);
    });
  }, [reminders, reminderFilter]);

  const [editingReminderId, setEditingReminderId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<ReminderKind>('sinav');
  const [date, setDate] = useState(toDateInput());
  const [time, setTime] = useState('09:00');

  const [editingAttendanceId, setEditingAttendanceId] = useState<number | null>(null);
  const [courseName, setCourseName] = useState('');
  const [limit, setLimit] = useState('4');

  const resetReminderForm = () => {
    setEditingReminderId(null);
    setTitle('');
    setKind('sinav');
    setDate(toDateInput());
    setTime('09:00');
  };

  const resetAttendanceForm = () => {
    setEditingAttendanceId(null);
    setCourseName('');
    setLimit('4');
  };

  const onSaveReminder = async () => {
    const name = title.trim();
    const dueAt = parseLocalDateTime(date, time);
    if (!name) {
      Alert.alert('Eksik bilgi', 'Sınav veya ödev başlığını yaz.');
      return;
    }
    if (!dueAt) {
      Alert.alert('Tarih hatası', 'Tarihi YYYY-AA-GG, saati SS:DD yaz.');
      return;
    }
    if (editingReminderId === null && dueAt.getTime() <= Date.now()) {
      Alert.alert('Geçmiş tarih', 'Hatırlatma gelecekte olmalı.');
      return;
    }
    const result =
      editingReminderId !== null
        ? await updateReminder(editingReminderId, { title: name, kind, dueAt })
        : await addReminder({ title: name, kind, dueAt });
    resetReminderForm();
    hapticSuccess();
    if (!result.notified) {
      Alert.alert('Kaydedildi, bildirim yok', 'Bildirim iznini Ayarlar’dan UniMan için aç.');
    }
  };

  const onSaveAttendance = async () => {
    const name = courseName.trim();
    const max = Number(limit);
    if (!name) {
      Alert.alert('Eksik bilgi', 'Ders adı yaz.');
      return;
    }
    if (!Number.isFinite(max) || max <= 0) {
      Alert.alert('Eksik bilgi', 'Maksimum hak 0’dan büyük olmalı.');
      return;
    }
    if (editingAttendanceId !== null) {
      await updateAttendance(editingAttendanceId, { name, limit: max });
    } else {
      await addAttendance({ name, limit: max });
    }
    resetAttendanceForm();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Screen>
          <ScrollView contentContainerStyle={{ paddingBottom: 36, gap: 12 }} showsVerticalScrollIndicator={false}>
            <Title>Takip</Title>
            <Muted>Sınav/ödev hatırlatması ve devamsızlık. Ders notları için Notlar sekmesi.</Muted>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <Chip label="Hatırlatma" selected={tab === 'hatirlatma'} onPress={() => setTab('hatirlatma')} />
              <Chip
                label="Devamsızlık"
                selected={tab === 'devamsizlik'}
                color={c.orange}
                onPress={() => setTab('devamsizlik')}
              />
            </ScrollView>

            {tab === 'hatirlatma' ? (
              <>
                <Card style={{ gap: 12 }}>
                  <Text style={{ color: c.text, fontWeight: '800', fontSize: 16 }}>
                    {editingReminderId !== null ? 'Hatırlatmayı düzenle' : 'Yeni hatırlatma'}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Chip label="Sınav" selected={kind === 'sinav'} color={c.warning} onPress={() => setKind('sinav')} />
                    <Chip label="Ödev" selected={kind === 'odev'} color={c.blue} onPress={() => setKind('odev')} />
                  </View>
                  <Field
                    label="Başlık"
                    value={title}
                    onChangeText={setTitle}
                    placeholder={kind === 'sinav' ? 'Matematik vize' : 'Proje teslimi'}
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
                  <DateTimePicker
                    date={date}
                    time={time}
                    onChange={(nextDate, nextTime) => {
                      setDate(nextDate);
                      setTime(nextTime);
                    }}
                  />
                  <PrimaryButton
                    label={editingReminderId !== null ? 'Güncelle' : 'Planla'}
                    onPress={onSaveReminder}
                  />
                  {editingReminderId !== null ? (
                    <GhostButton label="Vazgeç" onPress={resetReminderForm} />
                  ) : null}
                </Card>
                {reminders.length === 0 ? (
                  <EmptyState
                    emoji="🔔"
                    title="İlk hatırlatmanı kur"
                    body="Sınav mı ödev mi seç, Bugün/Yarın’a dokun, saati seç. Bildirim iznini bir kez onayla."
                    actionLabel="Örnek başlık koy"
                    onAction={() => setTitle(kind === 'sinav' ? 'Matematik vize' : 'Proje teslimi')}
                  />
                ) : (
                  <>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                      <Chip
                        label="Açık"
                        selected={reminderFilter === 'open'}
                        onPress={() => setReminderFilter('open')}
                      />
                      <Chip
                        label="Geçmiş"
                        selected={reminderFilter === 'past'}
                        color={c.warning}
                        onPress={() => setReminderFilter('past')}
                      />
                      <Chip
                        label="Tamamlanan"
                        selected={reminderFilter === 'done'}
                        color={c.success}
                        onPress={() => setReminderFilter('done')}
                      />
                      <Chip
                        label="Tümü"
                        selected={reminderFilter === 'all'}
                        color={c.blue}
                        onPress={() => setReminderFilter('all')}
                      />
                    </ScrollView>
                    {filteredReminders.length === 0 ? (
                      <EmptyState
                        emoji="🔎"
                        title="Bu filtrede kayıt yok"
                        body="Başka bir filtre dene veya yeni hatırlatma ekle."
                      />
                    ) : (
                      filteredReminders.map((item) => (
                        <Card key={item.id} style={{ gap: 6, opacity: item.done ? 0.55 : 1 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ color: c.accent, fontWeight: '800', fontSize: 12 }}>
                              {item.kind === 'sinav' ? 'SINAV' : 'ÖDEV'}
                            </Text>
                            <Muted>
                              {formatDateTime(item.dueAt)} · {formatCountdown(item.dueAt, now)}
                            </Muted>
                          </View>
                          <Text
                            style={{
                              color: c.text,
                              fontSize: 17,
                              fontWeight: '800',
                              textDecorationLine: item.done ? 'line-through' : 'none',
                            }}>
                            {item.title}
                          </Text>
                          {!item.done && !isUpcoming(item.dueAt) ? <Muted>Zamanı geçti</Muted> : null}
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                            <GhostButton
                              label={item.done ? 'Geri al' : 'Tamamlandı'}
                              onPress={() => {
                                hapticSuccess();
                                toggleReminder(item.id);
                              }}
                            />
                            <GhostButton
                              label="Düzenle"
                              onPress={() => {
                                const due = new Date(item.dueAt);
                                setEditingReminderId(item.id);
                                setTitle(item.title);
                                setKind(item.kind);
                                setDate(toDateInput(due));
                                setTime(
                                  `${String(due.getHours()).padStart(2, '0')}:${String(due.getMinutes()).padStart(2, '0')}`
                                );
                              }}
                            />
                            <GhostButton
                              label="Sil"
                              danger
                              onPress={() =>
                                confirmDelete('Hatırlatma silinsin mi?', item.title, () =>
                                  removeReminder(item.id)
                                )
                              }
                            />
                          </View>
                        </Card>
                      ))
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                <Card style={{ gap: 12 }}>
                  <Text style={{ color: c.text, fontWeight: '800', fontSize: 16 }}>
                    {editingAttendanceId !== null ? 'Dersi düzenle' : 'Ders ekle'}
                  </Text>
                  <Field label="Dersin adı" value={courseName} onChangeText={setCourseName} placeholder="Algoritma" />
                  {courseSuggestions.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                      {courseSuggestions.map((suggestion) => (
                        <Chip
                          key={suggestion}
                          label={suggestion}
                          selected={courseName === suggestion}
                          onPress={() => setCourseName(suggestion)}
                        />
                      ))}
                    </ScrollView>
                  ) : null}
                  <Field
                    label="Maksimum hak"
                    value={limit}
                    onChangeText={setLimit}
                    keyboardType="number-pad"
                    placeholder="4"
                  />
                  <PrimaryButton
                    label={editingAttendanceId !== null ? 'Güncelle' : 'Takibe al'}
                    onPress={onSaveAttendance}
                  />
                  {editingAttendanceId !== null ? (
                    <GhostButton label="Vazgeç" onPress={resetAttendanceForm} />
                  ) : null}
                </Card>
                {attendance.length === 0 ? (
                  <EmptyState
                    emoji="📉"
                    title="Hangi derste hakkın bitiyor?"
                    body="Ders adı + maksimum hak (çoğu bölümde 4). Derse girmedin mi + bas. %75’te ana sayfa uyarır."
                    actionLabel="Örnek ders koy"
                    onAction={() => {
                      setCourseName('Algoritma');
                      setLimit('4');
                    }}
                  />
                ) : (
                  attendance.map((item) => {
                    const ratio = item.limit === 0 ? 0 : Math.min(1, item.used / item.limit);
                    const bar = ratio >= 0.8 ? c.danger : ratio >= 0.5 ? c.warning : c.success;
                    return (
                      <Card key={item.id} style={{ gap: 8 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ color: c.text, fontWeight: '800', fontSize: 16, flex: 1 }}>{item.name}</Text>
                          <Muted>
                            {item.used}/{item.limit}
                          </Muted>
                        </View>
                        <Muted>
                          Kullanılan: {item.used} / {item.limit}
                          {item.used >= item.limit ? ' · sınır doldu' : ''}
                        </Muted>
                        <View style={{ height: 10, backgroundColor: c.line, borderRadius: 99, overflow: 'hidden' }}>
                          <View style={{ width: `${ratio * 100}%`, height: 10, backgroundColor: bar }} />
                        </View>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                          <GhostButton label="+ Devamsızlık" onPress={() => bumpAttendance(item.id, 1)} />
                          <GhostButton label="− Düzelt" onPress={() => bumpAttendance(item.id, -1)} />
                          <GhostButton
                            label="Düzenle"
                            onPress={() => {
                              setEditingAttendanceId(item.id);
                              setCourseName(item.name);
                              setLimit(String(item.limit));
                            }}
                          />
                          <GhostButton
                            label="Sil"
                            danger
                            onPress={() =>
                              confirmDelete('Devamsızlık kaydı silinsin mi?', item.name, () =>
                                removeAttendance(item.id)
                              )
                            }
                          />
                        </View>
                      </Card>
                    );
                  })
                )}
              </>
            )}
          </ScrollView>
        </Screen>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
