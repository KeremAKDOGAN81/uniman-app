import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { SwipeTabShell } from '@/components/SwipeTabShell';
import {
  EduColorCard,
  EduFormCard,
  EduHeroBanner,
  EduPageHeader,
  EduSectionTitle,
  EduSegmentPills,
  EduStatTile,
  eduGradients,
} from '@/components/edu';
import {
  Card,
  EmptyState,
  Field,
  GhostButton,
  Muted,
  PrimaryButton,
  Screen,
  useColors,
} from '@/components/ui';
import { CountNumber } from '@/components/CountNumber';
import { GradesPanel } from './grades';
import { confirmDelete } from '@/lib/confirm';
import { colorForCourseName, emojiForCourse } from '@/lib/courseColor';
import { calculateRequiredFinal, finalMessage } from '@/lib/finalGrade';
import { statAgno, statLatestFinal } from '@/lib/copy';
import { hapticSuccess, hapticWarning } from '@/lib/haptics';
import { useAppStore } from '@/store/useAppStore';

type ExtraRow = { id: string; score: string; weight: string };

function parseNum(value: string, fallback = 0): number {
  const n = Number(value.replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
}

function finalAccent(required: number, c: ReturnType<typeof useColors>): string {
  if (required <= 0) return c.teal;
  if (required > 100) return c.danger;
  if (required > 75) return c.warning;
  if (required > 50) return c.blue;
  return c.success;
}

export default function CalculatorScreen() {
  const c = useColors();
  const schedule = useAppStore((state) => state.schedule);
  const courses = useAppStore((state) => state.courses);
  const examTargets = useAppStore((state) => state.examTargets);
  const addExamTarget = useAppStore((state) => state.addExamTarget);
  const updateExamTarget = useAppStore((state) => state.updateExamTarget);
  const removeExamTarget = useAppStore((state) => state.removeExamTarget);

  const [editingTargetId, setEditingTargetId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [passing, setPassing] = useState('60');
  const [midterm, setMidterm] = useState('');
  const [midtermWeight, setMidtermWeight] = useState('40');
  const [extras, setExtras] = useState<ExtraRow[]>([]);
  const [pane, setPane] = useState<'final' | 'agno'>('final');
  const [resultText, setResultText] = useState<string | null>(null);
  const [requiredFinal, setRequiredFinal] = useState<number | null>(null);
  const [resultTone, setResultTone] = useState<'critical' | 'hard' | 'ok' | 'easy' | 'passed'>('ok');

  const resetTargetForm = () => {
    setEditingTargetId(null);
    setName('');
    setPassing('60');
    setMidterm('');
    setMidtermWeight('40');
    setExtras([]);
  };

  const toneColor = {
    critical: c.danger,
    hard: c.warning,
    ok: c.blue,
    easy: c.success,
    passed: c.teal,
  }[resultTone];

  const formAccent = name.trim() ? colorForCourseName(name, schedule) : c.success;

  const finalStat = useMemo(() => statLatestFinal(examTargets), [examTargets]);
  const agnoStat = useMemo(() => statAgno(courses), [courses]);

  const onAddExtra = () => {
    setExtras((rows) => [...rows, { id: String(Date.now()), score: '', weight: '' }]);
  };

  const onCalculate = async () => {
    const extrasParsed = extras.map((row) => ({
      score: parseNum(row.score),
      weight: parseNum(row.weight),
    }));
    const calc = calculateRequiredFinal({
      passing: parseNum(passing, 60),
      midtermScore: parseNum(midterm),
      midtermWeight: parseNum(midtermWeight),
      extras: extrasParsed,
    });
    if (!calc.ok) {
      hapticWarning();
      Alert.alert('Yüzde hatası', calc.error);
      return;
    }
    const message = finalMessage(calc.requiredFinal);
    setResultTone(message.tone);
    setRequiredFinal(calc.requiredFinal);
    setResultText(
      `${message.text}\nYıl içi: ${calc.yearPoints.toFixed(1)} puan · Final ağırlığı %${calc.finalWeight}`
    );
    hapticSuccess();
    const payload = {
      name: name.trim() || 'İsimsiz Ders',
      yearPoints: Number(calc.yearPoints.toFixed(1)),
      requiredFinal: calc.requiredFinal,
    };
    if (editingTargetId !== null) {
      await updateExamTarget(editingTargetId, payload);
      setEditingTargetId(null);
    } else {
      await addExamTarget(payload);
    }
  };

  return (
    <SwipeTabShell tab="calculator">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Screen>
          <EduPageHeader
            title="Hesap"
            subtitle="Final hedefi ve dönem ortalamasını hesapla."
            badge="Hesap"
            accentColor={c.success}
            emoji="🧮"
          />

          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 4 }}>
            <EduStatTile
              label={finalStat.label}
              value={finalStat.value}
              hint={finalStat.hint}
              gradient={eduGradients.mint}
            />
            <EduStatTile
              label={agnoStat.label}
              value={agnoStat.value}
              hint={agnoStat.hint}
              gradient={eduGradients.primary}
            />
          </View>

          <EduSegmentPills
            options={[
              { key: 'final', label: 'Final', color: c.success },
              { key: 'agno', label: 'AGNO', color: c.pink },
            ]}
            value={pane}
            onChange={(key) => setPane(key as 'final' | 'agno')}
          />
          <View style={{ height: 8 }} />
          {pane === 'agno' ? (
            <GradesPanel />
          ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 36, gap: 14 }} showsVerticalScrollIndicator={false}>
            {requiredFinal !== null && resultText ? (
              <EduHeroBanner
                badge="FİNAL HEDEFİ"
                title={requiredFinal > 0 ? `${requiredFinal} puan` : 'Geçtin!'}
                subtitle={resultText.split('\n')[0]}
                footer={resultText.split('\n')[1]}
                colors={
                  resultTone === 'critical' || resultTone === 'hard'
                    ? eduGradients.sunset
                    : resultTone === 'passed'
                      ? eduGradients.mint
                      : eduGradients.sky
                }
              />
            ) : (
              <EduHeroBanner
                badge="FİNAL HESABI"
                title="Henüz hesaplanmadı"
                subtitle="Vize notunu ve ağırlıkları gir, final hedefini gör."
                colors={eduGradients.mint}
              />
            )}

            <EduFormCard
              title={editingTargetId !== null ? 'Hesabı güncelle' : 'Final hesabı'}
              accent={formAccent}
              emoji={name.trim() ? emojiForCourse(name) : '🎯'}>
              <Field label="Dersin adı" value={name} onChangeText={setName} placeholder="Örn. Matematik" />
              <Field
                label="Dersi geçme notu"
                value={passing}
                onChangeText={setPassing}
                keyboardType="decimal-pad"
                placeholder="60"
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Vize notun"
                    value={midterm}
                    onChangeText={setMidterm}
                    keyboardType="decimal-pad"
                    placeholder="70"
                  />
                </View>
                <View style={{ width: 110 }}>
                  <Field
                    label="Yüzdesi (%)"
                    value={midtermWeight}
                    onChangeText={setMidtermWeight}
                    keyboardType="decimal-pad"
                    placeholder="40"
                  />
                </View>
              </View>

              {extras.map((row, index) => (
                <View key={row.id} style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: c.text, fontWeight: '800' }}>Ek etkinlik {index + 1}</Text>
                    <GhostButton
                      label="Kaldır"
                      danger
                      onPress={() => setExtras((rows) => rows.filter((item) => item.id !== row.id))}
                    />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Field
                        label="Not"
                        value={row.score}
                        onChangeText={(value) =>
                          setExtras((rows) =>
                            rows.map((item) => (item.id === row.id ? { ...item, score: value } : item))
                          )
                        }
                        keyboardType="decimal-pad"
                        placeholder="80"
                      />
                    </View>
                    <View style={{ width: 110 }}>
                      <Field
                        label="Yüzdesi (%)"
                        value={row.weight}
                        onChangeText={(value) =>
                          setExtras((rows) =>
                            rows.map((item) => (item.id === row.id ? { ...item, weight: value } : item))
                          )
                        }
                        keyboardType="decimal-pad"
                        placeholder="10"
                      />
                    </View>
                  </View>
                </View>
              ))}

              <GhostButton label="+ Ek etkinlik ekle (ödev, quiz, proje…)" onPress={onAddExtra} />
              <PrimaryButton
                label={editingTargetId !== null ? 'Güncelle ve hesapla' : 'Hesapla'}
                onPress={onCalculate}
              />
              {editingTargetId !== null ? <GhostButton label="Vazgeç" onPress={resetTargetForm} /> : null}
            </EduFormCard>

            {resultText && requiredFinal !== null ? (
              <Card style={{ borderColor: toneColor, borderWidth: 2, gap: 8, borderRadius: 28 }}>
                <Muted>Finalden alman gereken</Muted>
                <CountNumber value={requiredFinal} color={toneColor} />
                <Text style={{ color: toneColor, fontWeight: '700', fontSize: 16, lineHeight: 22 }}>{resultText}</Text>
              </Card>
            ) : null}

            <EduSectionTitle title="Kaydedilen dersler" />
            {examTargets.length === 0 ? (
              <EmptyState
                emoji="🎯"
                title="Kayıtlı final hesabı yok"
                body="Vize, yüzde ve varsa ek etkinlikleri gir. Hesapla dediğinde sonuç burada saklanır."
                actionLabel="Formu doldur"
                onAction={() => setName('Veri Yapıları')}
              />
            ) : (
              examTargets.map((item) => {
                const accent = finalAccent(item.requiredFinal, c);
                const badge =
                  item.requiredFinal <= 0
                    ? 'Geçiyorsun'
                    : `Final: ${item.requiredFinal} puan`;
                return (
                  <EduColorCard
                    key={item.id}
                    accent={accent}
                    emoji="🎯"
                    badge={badge}
                    title={item.name}
                    subtitle={`Yıl içi ortalama: ${item.yearPoints} puan`}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <GhostButton
                        label="Düzenle"
                        onPress={() => {
                          setEditingTargetId(item.id);
                          setName(item.name);
                          setResultText(null);
                          setRequiredFinal(null);
                        }}
                      />
                      <GhostButton
                        label="Sil"
                        danger
                        onPress={() =>
                          confirmDelete('Hesap silinsin mi?', item.name, () => removeExamTarget(item.id))
                        }
                      />
                    </View>
                  </EduColorCard>
                );
              })
            )}
          </ScrollView>
          )}
        </Screen>
      </KeyboardAvoidingView>
    </SwipeTabShell>
  );
}
