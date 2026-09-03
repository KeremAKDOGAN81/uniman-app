import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { AbsenceDatePicker } from '@/components/AbsenceDatePicker';
import { DateTimePicker } from '@/components/DateTimePicker';
import { CourseChipRow } from '@/components/CourseChipRow';
import { SwipeTabShell } from '@/components/SwipeTabShell';
import {
  EduColorCard,
  EduFormCard,
  EduHeroBanner,
  EduPageHeader,
  EduProgressCard,
  EduSectionTitle,
  EduSegmentPills,
  EduStatTile,
  eduGradients,
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
import { collectCourseNames } from '@/lib/courseCatalog';
import { attendanceSubtitle, statAttendanceWarnings, statOpenReminders } from '@/lib/copy';
import { colorForCourseName, emojiForCourse } from '@/lib/courseColor';
import { formatCountdown, formatDateTime, formatMissedDay, isUpcoming, parseLocalDateTime, toDateInput } from '@/lib/dates';
import { findNextExam } from '@/lib/homeInsights';
import { hapticSuccess } from '@/lib/haptics';
import type { ReminderKind } from '@/lib/types';
import { useAppStore } from '@/store/useAppStore';
import { useClock } from '@/hooks/useClock';

type ReminderFilter = 'open' | 'past' | 'done' | 'all';

export default function TrackScreen() {
  const c = useColors();
  const params = useLocalSearchParams<{ ders?: string | string[] }>();
  const courseParam = Array.isArray(params.ders) ? params.ders[0] : params.ders;
  const [tab, setTab] = useState<'hatirlatma' | 'devamsizlik'>('hatirlatma');
  const [reminderFilter, setReminderFilter] = useState<ReminderFilter>('open');

  const reminders = useAppStore((state) => state.reminders);
  const courses = useAppStore((state) => state.courses);
  const schedule = useAppStore((state) => state.schedule);
  const attendance = useAppStore((state) => state.attendance);
  const examTargets = useAppStore((state) => state.examTargets);
  const notes = useAppStore((state) => state.notes);
  const addReminder = useAppStore((state) => state.addReminder);
  const updateReminder = useAppStore((state) => state.updateReminder);
  const toggleReminder = useAppStore((state) => state.toggleReminder);
  const removeReminder = useAppStore((state) => state.removeReminder);
  const addAttendance = useAppStore((state) => state.addAttendance);
  const updateAttendance = useAppStore((state) => state.updateAttendance);
  const bumpAttendance = useAppStore((state) => state.bumpAttendance);
  const recordAttendanceAbsence = useAppStore((state) => state.recordAttendanceAbsence);
  const removeAttendanceDate = useAppStore((state) => state.removeAttendanceDate);
  const removeAttendance = useAppStore((state) => state.removeAttendance);
  const now = useClock(15000);

  const courseSuggestions = useMemo(
    () => collectCourseNames({ courses, schedule, attendance, examTargets, notes, reminders }),
    [courses, schedule, attendance, examTargets, notes, reminders]
  );

  const openReminders = useMemo(
    () => reminders.filter((item) => !item.done && isUpcoming(item.dueAt)),
    [reminders]
  );
  const attendanceWarnings = useMemo(
    () => attendance.filter((item) => item.used / item.limit >= 0.75).length,
    [attendance]
  );

  const nextExam = useMemo(() => findNextExam(reminders, now), [reminders, now]);
  const reminderStat = useMemo(() => statOpenReminders(openReminders.length), [openReminders.length]);
  const attendanceStat = useMemo(
    () => statAttendanceWarnings(attendanceWarnings),
    [attendanceWarnings]
  );

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
  const [linkedCourse, setLinkedCourse] = useState('');
  const [kind, setKind] = useState<ReminderKind>('sinav');
  const [date, setDate] = useState(toDateInput());
  const [time, setTime] = useState('09:00');

  const [editingAttendanceId, setEditingAttendanceId] = useState<number | null>(null);
  const [pickingAttendanceId, setPickingAttendanceId] = useState<number | null>(null);
  const [absenceDate, setAbsenceDate] = useState(toDateInput());
  const [courseName, setCourseName] = useState('');

  useEffect(() => {
    if (courseParam?.trim()) {
      setTab('hatirlatma');
      setLinkedCourse(courseParam.trim());
      setTitle(`${courseParam.trim()} hatırlatması`);
    }
  }, [courseParam]);

  const [limit, setLimit] = useState('4');

  const kindAccent = kind === 'sinav' ? c.warning : c.blue;
  const kindEmoji = kind === 'sinav' ? '🎯' : '📋';

  const resetReminderForm = () => {
    setEditingReminderId(null);
    setTitle('');
    setLinkedCourse('');
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
        ? await updateReminder(editingReminderId, {
            title: name,
            kind,
            dueAt,
            courseName: linkedCourse.trim() || name,
          })
        : await addReminder({
            title: name,
            kind,
            dueAt,
            courseName: linkedCourse.trim() || name,
          });
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

  const saveAbsenceDate = async (id: number, date: string) => {
    const result = await recordAttendanceAbsence(id, date);
    if (result === 'full') {
      Alert.alert('Limit doldu', 'Bu ders için devamsızlık hakkın bitti.');
      return;
    }
    if (result === 'duplicate') {
      Alert.alert('Zaten kayıtlı', 'Bu gün için zaten devamsızlık var.');
      return;
    }
    if (result === 'ok') {
      hapticSuccess();
      setPickingAttendanceId(null);
    }
  };

  const onAddAbsence = (id: number, name: string) => {
    Alert.alert('Devamsızlık ekle', `${name} için gelmediğin günü kaydedebilirsin.`, [
      { text: 'Bugün', onPress: () => void saveAbsenceDate(id, toDateInput()) },
      {
        text: 'Gün seç',
        onPress: () => {
          setPickingAttendanceId(id);
          setAbsenceDate(toDateInput());
        },
      },
      { text: 'Tarihsiz +1', onPress: () => void bumpAttendance(id, 1) },
      { text: 'Vazgeç', style: 'cancel' },
    ]);
  };

  return (
    <SwipeTabShell tab="track">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Screen>
          <ScrollView contentContainerStyle={{ paddingBottom: 36, gap: 14 }} showsVerticalScrollIndicator={false}>
            <EduPageHeader
              badge="Takip"
              subtitle="Sınav, ödev hatırlatmaları ve devamsızlık."
              accentColor={c.warning}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <EduStatTile
                label={reminderStat.label}
                value={reminderStat.value}
                hint={reminderStat.hint}
                gradient={eduGradients.sunset}
              />
              <EduStatTile
                label={attendanceStat.label}
                value={attendanceStat.value}
                hint={attendanceStat.hint}
                gradient={attendanceWarnings > 0 ? (['#EF4444', '#F97316'] as const) : eduGradients.mint}
              />
            </View>

            {tab === 'hatirlatma' && nextExam ? (
              <EduHeroBanner
                badge="SIRADAKİ SINAV"
                title={nextExam.title}
                subtitle={`${nextExam.countdown} · ${nextExam.dateLabel}`}
                colors={eduGradients.sunset}
              />
            ) : null}

            <EduSegmentPills
              options={[
                { key: 'hatirlatma', label: 'Hatırlatma', color: c.warning },
                { key: 'devamsizlik', label: 'Devamsızlık', color: c.danger },
              ]}
              value={tab}
              onChange={(key) => setTab(key as 'hatirlatma' | 'devamsizlik')}
            />

            {tab === 'hatirlatma' ? (
              <>
                <EduFormCard
                  title={editingReminderId !== null ? 'Hatırlatmayı düzenle' : 'Yeni hatırlatma'}
                  accent={kindAccent}
                  emoji={kindEmoji}>
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
                  <Field
                    label="Bağlı ders (isteğe bağlı)"
                    value={linkedCourse}
                    onChangeText={setLinkedCourse}
                    placeholder="Ders adı — ders merkezinde görünür"
                  />
                  {courseSuggestions.length > 0 ? (
                    <CourseChipRow
                      names={courseSuggestions}
                      selected={linkedCourse || title}
                      onSelect={(name) => {
                        setLinkedCourse(name);
                        if (!title.trim()) setTitle(name);
                      }}
                    />
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
                </EduFormCard>

                {reminders.length === 0 ? (
                  <EmptyState
                    emoji="🔔"
                    title="Hatırlatma yok"
                    body="Sınav veya ödev tarihi ekle; zamanı gelince bildirim alırsın."
                    actionLabel="Hatırlatma oluştur"
                    onAction={() => setTitle(kind === 'sinav' ? 'Matematik vize' : 'Proje teslimi')}
                  />
                ) : (
                  <>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                      <Chip label="Açık" selected={reminderFilter === 'open'} color={c.warning} onPress={() => setReminderFilter('open')} />
                      <Chip label="Geçmiş" selected={reminderFilter === 'past'} color={c.pink} onPress={() => setReminderFilter('past')} />
                      <Chip label="Tamamlanan" selected={reminderFilter === 'done'} color={c.success} onPress={() => setReminderFilter('done')} />
                      <Chip label="Tümü" selected={reminderFilter === 'all'} color={c.blue} onPress={() => setReminderFilter('all')} />
                    </ScrollView>

                    {filteredReminders.length === 0 ? (
                      <EmptyState emoji="🔎" title="Bu filtrede kayıt yok" body="Başka bir filtre dene veya yeni hatırlatma ekle." />
                    ) : (
                      filteredReminders.map((item) => {
                        const accent = item.kind === 'sinav' ? c.warning : c.blue;
                        const emoji = item.kind === 'sinav' ? '🎯' : '📋';
                        return (
                          <EduColorCard
                            key={item.id}
                            accent={accent}
                            emoji={emoji}
                            badge={item.kind === 'sinav' ? 'SINAV' : 'ÖDEV'}
                            title={item.title}
                            subtitle={`${formatDateTime(item.dueAt)} · ${formatCountdown(item.dueAt, now)}`}
                            faded={item.done}>
                            {!item.done && !isUpcoming(item.dueAt) ? <Muted>Zamanı geçti</Muted> : null}
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
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
                                  setLinkedCourse(item.courseName);
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
                          </EduColorCard>
                        );
                      })
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                <EduFormCard
                  title={editingAttendanceId !== null ? 'Dersi düzenle' : 'Devamsızlık takibi'}
                  accent={c.danger}
                  emoji="📉">
                  <Field label="Dersin adı" value={courseName} onChangeText={setCourseName} placeholder="Algoritma" />
                  {courseSuggestions.length > 0 ? (
                    <CourseChipRow names={courseSuggestions} selected={courseName} onSelect={setCourseName} />
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
                </EduFormCard>

                {attendance.length === 0 ? (
                  <EmptyState
                    emoji="📉"
                    title="Devamsızlık takibi yok"
                    body="Ders adı ve maksimum hak gir. İstersen gelmediğin günü de kaydet."
                    actionLabel="Ders ekle"
                    onAction={() => {
                      setCourseName('Algoritma');
                      setLimit('4');
                    }}
                  />
                ) : (
                  <>
                    <EduSectionTitle title="Devamsızlık listesi" />
                    {attendance.map((item) => {
                      const ratio = item.limit === 0 ? 0 : Math.min(1, item.used / item.limit);
                      const bar = ratio >= 0.8 ? c.danger : ratio >= 0.5 ? c.warning : c.success;
                      const accent = colorForCourseName(item.name, schedule);
                      const picking = pickingAttendanceId === item.id;
                      return (
                        <EduProgressCard
                          key={item.id}
                          accent={accent}
                          emoji={emojiForCourse(item.name)}
                          title={item.name}
                          subtitle={attendanceSubtitle(item.used, item.limit, item.missedDates.length)}
                          ratio={ratio}
                          progressColor={bar}>
                          {item.missedDates.length > 0 ? (
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                              {item.missedDates.map((missed) => (
                                <Pressable
                                  key={missed}
                                  onPress={() =>
                                    confirmDelete('Bu gün silinsin mi?', formatMissedDay(missed), () =>
                                      removeAttendanceDate(item.id, missed)
                                    )
                                  }
                                  style={{
                                    paddingHorizontal: 10,
                                    paddingVertical: 6,
                                    borderRadius: 999,
                                    backgroundColor: `${c.danger}14`,
                                    borderWidth: 1,
                                    borderColor: c.line,
                                  }}>
                                  <Text style={{ color: c.text, fontSize: 12, fontWeight: '700' }}>
                                    {formatMissedDay(missed)}  ×
                                  </Text>
                                </Pressable>
                              ))}
                            </View>
                          ) : (
                            <Muted>Gün kaydı yok — istersen gelmediğin tarihi ekle.</Muted>
                          )}
                          {picking ? (
                            <View style={{ gap: 8 }}>
                              <AbsenceDatePicker
                                selected={absenceDate}
                                disabledDates={item.missedDates}
                                onSelect={setAbsenceDate}
                              />
                              <PrimaryButton label="Bu günü kaydet" onPress={() => void saveAbsenceDate(item.id, absenceDate)} />
                              <GhostButton label="Vazgeç" onPress={() => setPickingAttendanceId(null)} />
                            </View>
                          ) : null}
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            <GhostButton label="+ Devamsızlık" onPress={() => onAddAbsence(item.id, item.name)} />
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
                        </EduProgressCard>
                      );
                    })}
                  </>
                )}
              </>
            )}
          </ScrollView>
        </Screen>
      </KeyboardAvoidingView>
    </SwipeTabShell>
  );
}
