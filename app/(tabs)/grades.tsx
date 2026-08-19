import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
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
import { letterColors } from '@/constants/theme';
import { computeGpa100, computeGpa4, formatGpa, letterFromScore, pointsFromLetter } from '@/lib/gpa';
import { LETTER_GRADES, type LetterGrade } from '@/lib/types';
import { useAppStore } from '@/store/useAppStore';

export function GradesPanel() {
  const c = useColors();
  const courses = useAppStore((state) => state.courses);
  const addCourse = useAppStore((state) => state.addCourse);
  const removeCourse = useAppStore((state) => state.removeCourse);
  const [name, setName] = useState('');
  const [ects, setEcts] = useState('5');
  const [score, setScore] = useState('');
  const [letter, setLetter] = useState<LetterGrade>('CC');
  const gpa4 = computeGpa4(courses);
  const gpa100 = computeGpa100(courses);

  const applyScore = (value: string) => {
    setScore(value);
    const numeric = Number(value.replace(',', '.'));
    if (value.trim() && Number.isFinite(numeric) && numeric >= 0 && numeric <= 100) {
      setLetter(letterFromScore(numeric));
    }
  };

  const onAdd = async () => {
    const trimmed = name.trim();
    const credits = Number(ects.replace(',', '.'));
    const numeric = score.trim() ? Number(score.replace(',', '.')) : null;
    if (!trimmed) {
      Alert.alert('Eksik bilgi', 'Ders adını yaz.');
      return;
    }
    if (!Number.isFinite(credits) || credits <= 0) {
      Alert.alert('Eksik bilgi', 'AKTS / kredi 0’dan büyük olmalı.');
      return;
    }
    if (numeric !== null && (!Number.isFinite(numeric) || numeric < 0 || numeric > 100)) {
      Alert.alert('Geçersiz not', '100’lük not 0–100 arasında olmalı.');
      return;
    }
    await addCourse({
      name: trimmed,
      ects: credits,
      letter: numeric === null ? letter : letterFromScore(numeric),
      score100: numeric,
    });
    setName('');
    setScore('');
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 36, gap: 12 }} showsVerticalScrollIndicator={false}>
      <Muted>Web UniMan AGNO: AKTS × harf katsayısı. 4.00 ve 100’lük birlikte.</Muted>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
        <Card style={{ flex: 1, backgroundColor: c.accent }}>
          <Text style={{ color: c.onAccent }}>4.00</Text>
          <Text style={{ color: c.onAccent, fontSize: 30, fontWeight: '800' }}>
            {courses.length ? formatGpa(gpa4) : '0.00'}
          </Text>
        </Card>
        <Card style={{ flex: 1, backgroundColor: c.pink }}>
          <Text style={{ color: '#fff' }}>100'lük</Text>
          <Text style={{ color: '#fff', fontSize: 30, fontWeight: '800' }}>
            {courses.length ? formatGpa(gpa100, 1) : '0.0'}
          </Text>
        </Card>
      </View>

      <Card style={{ gap: 12 }}>
        <Text style={{ color: c.text, fontSize: 16, fontWeight: '800' }}>Ders ekle</Text>
        <Field label="Ders adı" value={name} onChangeText={setName} placeholder="Örn. Veri Yapıları" />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label="AKTS" value={ects} onChangeText={setEcts} keyboardType="decimal-pad" placeholder="5" />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="100'lük (isteğe bağlı)"
              value={score}
              onChangeText={applyScore}
              keyboardType="decimal-pad"
              placeholder="78"
            />
          </View>
        </View>
        <Muted>Harf notu {score.trim() ? '100’lük nottan otomatik' : 'elle seç'}</Muted>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {LETTER_GRADES.map((item) => (
            <Chip
              key={item}
              label={`${item} ${pointsFromLetter(item).toFixed(1)}`}
              selected={letter === item}
              color={letterColors[item]}
              onPress={() => {
                setLetter(item);
                setScore('');
              }}
            />
          ))}
        </ScrollView>
        <PrimaryButton label="Dersi kaydet" onPress={onAdd} />
      </Card>

      <Text style={{ color: c.text, fontSize: 18, fontWeight: '800' }}>Dönem dersleri</Text>
      {courses.length === 0 ? (
        <EmptyState title="Henüz ders yok" body="Ders adı, AKTS, harf veya 100’lük not. AGNO kartları hemen güncellenir." />
      ) : (
        courses.map((course) => (
          <Card key={course.id} style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontSize: 16, fontWeight: '800' }}>{course.name}</Text>
                <Muted>
                  {course.ects} AKTS
                  {course.score100 !== null ? ` · ${course.score100}` : ''}
                </Muted>
              </View>
              <Text style={{ color: letterColors[course.letter], fontWeight: '800', fontSize: 18 }}>
                {course.letter}
              </Text>
            </View>
            <GhostButton label="Sil" danger onPress={() => removeCourse(course.id)} />
          </Card>
        ))
      )}
    </ScrollView>
  );
}

export default function GradesScreen() {
  const c = useColors();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Screen>
          <Title>Dönem ortalaması</Title>
          <GradesPanel />
        </Screen>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
