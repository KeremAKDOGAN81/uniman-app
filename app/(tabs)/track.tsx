import { useState } from 'react';
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
import { formatCountdown, formatDateTime, isUpcoming, parseLocalDateTime, toDateInput } from '@/lib/dates';
import { hapticSuccess } from '@/lib/haptics';
import type { ReminderKind } from '@/lib/types';
import { useAppStore } from '@/store/useAppStore';
import { useClock } from '@/hooks/useClock';

export default function TrackScreen() {
  const c = useColors();
  const [tab, setTab] = useState<'hatirlatma' | 'devamsizlik'>('hatirlatma');

  const reminders = useAppStore((state) => state.reminders);
  const addReminder = useAppStore((state) => state.addReminder);
  const toggleReminder = useAppStore((state) => state.toggleReminder);
  const removeReminder = useAppStore((state) => state.removeReminder);
  const attendance = useAppStore((state) => state.attendance);
  const addAttendance = useAppStore((state) => state.addAttendance);
  const bumpAttendance = useAppStore((state) => state.bumpAttendance);
  const removeAttendance = useAppStore((state) => state.removeAttendance);
  const now = useClock(15000);

  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<ReminderKind>('sinav');
  const [date, setDate] = useState(toDateInput());
  const [time, setTime] = useState('09:00');
  const [courseName, setCourseName] = useState('');
  const [limit, setLimit] = useState('4');

  const onAddReminder = async () => {
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
    if (dueAt.getTime() <= Date.now()) {
      Alert.alert('Geçmiş tarih', 'Hatırlatma gelecekte olmalı.');
      return;
    }
    const result = await addReminder({ title: name, kind, dueAt });
    setTitle('');
    hapticSuccess();
    if (!result.notified) {
      Alert.alert('Kaydedildi, bildirim yok', 'Bildirim iznini Ayarlar’dan UniMan için aç.');
    }
  };

  const onAddAttendance = async () => {
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
    await addAttendance({ name, limit: max });
    setCourseName('');
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
              <Chip label="Devamsızlık" selected={tab === 'devamsizlik'} color={c.orange} onPress={() => setTab('devamsizlik')} />
            </ScrollView>

            {tab === 'hatirlatma' ? (
              <>
                <Card style={{ gap: 12 }}>
                  <Text style={{ color: c.text, fontWeight: '800', fontSize: 16 }}>Yeni hatırlatma</Text>
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
                  <DateTimePicker date={date} time={time} onChange={(nextDate, nextTime) => {
                    setDate(nextDate);
                    setTime(nextTime);
                  }} />
                  <PrimaryButton label="Planla" onPress={onAddReminder} />
                </Card>
                {reminders.length === 0 ? (
                  <EmptyState
                    title="İlk hatırlatmanı kur"
                    body="Sınav mı ödev mi seç, Bugün/Yarın’a dokun, saati seç. Bildirim iznini bir kez onayla."
                  />
                ) : (
                  reminders.map((item) => (
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
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <GhostButton
                          label={item.done ? 'Geri al' : 'Tamamlandı'}
                          onPress={() => {
                            hapticSuccess();
                            toggleReminder(item.id);
                          }}
                        />
                        <GhostButton label="Sil" danger onPress={() => removeReminder(item.id)} />
                      </View>
                    </Card>
                  ))
                )}
              </>
            ) : (
              <>
                <Card style={{ gap: 12 }}>
                  <Text style={{ color: c.text, fontWeight: '800', fontSize: 16 }}>Ders ekle</Text>
                  <Field label="Dersin adı" value={courseName} onChangeText={setCourseName} placeholder="Algoritma" />
                  <Field
                    label="Maksimum hak"
                    value={limit}
                    onChangeText={setLimit}
                    keyboardType="number-pad"
                    placeholder="4"
                  />
                  <PrimaryButton label="Takibe al" onPress={onAddAttendance} />
                </Card>
                {attendance.length === 0 ? (
                  <EmptyState
                    title="Hangi derste hakkın bitiyor?"
                    body="Ders adı + maksimum hak (çoğu bölümde 4). Derse girmedin mi + bas. %75’te ana sayfa uyarır."
                  />
                ) : (
                  attendance.map((item) => {
                    const ratio = item.limit === 0 ? 0 : Math.min(1, item.used / item.limit);
                    const bar =
                      ratio >= 0.8 ? c.danger : ratio >= 0.5 ? c.warning : c.success;
                    return (
                      <Card key={item.id} style={{ gap: 8 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ color: c.text, fontWeight: '800', fontSize: 16, flex: 1 }}>{item.name}</Text>
                          <GhostButton label="Sil" danger onPress={() => removeAttendance(item.id)} />
                        </View>
                        <Muted>
                          Kullanılan: {item.used} / {item.limit}
                          {item.used >= item.limit ? ' · sınır doldu' : ''}
                        </Muted>
                        <View style={{ height: 10, backgroundColor: c.line, borderRadius: 99, overflow: 'hidden' }}>
                          <View style={{ width: `${ratio * 100}%`, height: 10, backgroundColor: bar }} />
                        </View>
                        <View style={{ flexDirection: 'row', gap: 16 }}>
                          <GhostButton label="+ Devamsızlık" onPress={() => bumpAttendance(item.id, 1)} />
                          <GhostButton label="− Düzelt" onPress={() => bumpAttendance(item.id, -1)} />
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
