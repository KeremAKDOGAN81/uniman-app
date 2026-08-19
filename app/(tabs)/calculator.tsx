import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
import { CountNumber } from '@/components/CountNumber';
import { GradesPanel } from './grades';
import { calculateRequiredFinal, finalMessage } from '@/lib/finalGrade';
import { hapticSuccess, hapticWarning } from '@/lib/haptics';
import { useAppStore } from '@/store/useAppStore';

type ExtraRow = { id: string; score: string; weight: string };

function parseNum(value: string, fallback = 0): number {
  const n = Number(value.replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
}

export default function CalculatorScreen() {
  const c = useColors();
  const examTargets = useAppStore((state) => state.examTargets);
  const addExamTarget = useAppStore((state) => state.addExamTarget);
  const removeExamTarget = useAppStore((state) => state.removeExamTarget);

  const [name, setName] = useState('');
  const [passing, setPassing] = useState('60');
  const [midterm, setMidterm] = useState('');
  const [midtermWeight, setMidtermWeight] = useState('40');
  const [extras, setExtras] = useState<ExtraRow[]>([]);
  const [pane, setPane] = useState<'final' | 'agno'>('final');
  const [resultText, setResultText] = useState<string | null>(null);
  const [requiredFinal, setRequiredFinal] = useState<number | null>(null);
  const [resultTone, setResultTone] = useState<'critical' | 'hard' | 'ok' | 'easy' | 'passed'>('ok');

  const toneColor = {
    critical: c.danger,
    hard: c.warning,
    ok: c.blue,
    easy: c.success,
    passed: c.teal,
  }[resultTone];

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
    await addExamTarget({
      name: name.trim() || 'İsimsiz Ders',
      yearPoints: Number(calc.yearPoints.toFixed(1)),
      requiredFinal: calc.requiredFinal,
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Screen>
          <Title>Hesap</Title>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            <Chip label="Final" selected={pane === 'final'} onPress={() => setPane('final')} />
            <Chip label="AGNO" selected={pane === 'agno'} color={c.pink} onPress={() => setPane('agno')} />
          </View>
          {pane === 'agno' ? (
            <GradesPanel />
          ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 36, gap: 12 }} showsVerticalScrollIndicator={false}>
            <Muted>
              Web UniMan ile aynı mantık: vize + ek etkinlik yüzdeleri, kalan ağırlık final. Geçmek için finalden kaç
              alman gerektiğini hesaplar.
            </Muted>

            <Card style={{ gap: 12 }}>
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
              <PrimaryButton label="Hesapla" onPress={onCalculate} />
            </Card>

            {resultText && requiredFinal !== null ? (
              <Card style={{ borderColor: toneColor, borderWidth: 2, gap: 8 }}>
                <Muted>Finalden alman gereken</Muted>
                <CountNumber value={requiredFinal} color={toneColor} />
                <Text style={{ color: toneColor, fontWeight: '700', fontSize: 16, lineHeight: 22 }}>{resultText}</Text>
              </Card>
            ) : null}

            <Text style={{ color: c.text, fontSize: 18, fontWeight: '800', marginTop: 8 }}>Kaydedilen dersler</Text>
            {examTargets.length === 0 ? (
              <EmptyState title="Henüz hesap yok" body="Vize + yüzdesi, istersen ek etkinlik. Hesapla deyince yıl içi puan ve final hedefi burada durur." />
            ) : (
              examTargets.map((item) => (
                <Card key={item.id} style={{ gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: c.text, fontSize: 16, fontWeight: '800', flex: 1 }}>{item.name}</Text>
                    <View
                      style={{
                        backgroundColor: item.requiredFinal > 100 ? c.danger : item.requiredFinal > 75 ? c.warning : c.success,
                        borderRadius: 12,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                      }}>
                      <Text style={{ color: '#fff', fontWeight: '800' }}>
                        {item.requiredFinal > 0 ? item.requiredFinal : 'Geçti'}
                      </Text>
                    </View>
                  </View>
                  <Muted>Yıl içi puanı: {item.yearPoints}</Muted>
                  <GhostButton label="Sil" danger onPress={() => removeExamTarget(item.id)} />
                </Card>
              ))
            )}
          </ScrollView>
          )}
        </Screen>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
