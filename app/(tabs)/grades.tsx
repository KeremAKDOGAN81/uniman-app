import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  EduColorCard,
  EduFormCard,
  EduGpaHero,
  EduSectionTitle,
} from '@/components/edu';
import {
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
import { confirmDelete } from '@/lib/confirm';
import { colorForCourseName, emojiForCourse } from '@/lib/courseColor';
import { computeGpa100, computeGpa4, formatGpa, letterFromScore, pointsFromLetter } from '@/lib/gpa';
import { LETTER_GRADES, type LetterGrade } from '@/lib/types';
import { useAppStore } from '@/store/useAppStore';

export function GradesPanel() {
  const c = useColors();
  const courses = useAppStore((state) => state.courses);
  const schedule = useAppStore((state) => state.schedule);
  const addCourse = useAppStore((state) => state.addCourse);
  const updateCourse = useAppStore((state) => state.updateCourse);
  const removeCourse = useAppStore((state) => state.removeCourse);
  const [editingId, setEditingId] = useState<number | null>(null);
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

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setEcts('5');
    setScore('');
    setLetter('CC');
  };

  const onEdit = (course: (typeof courses)[number]) => {
    setEditingId(course.id);
    setName(course.name);
    setEcts(String(course.ects));
    setScore(course.score100 !== null ? String(course.score100) : '');
    setLetter(course.letter);
  };

  const onSave = async () => {
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
    const payload = {
      name: trimmed,
      ects: credits,
      letter: numeric === null ? letter : letterFromScore(numeric),
      score100: numeric,
    };
    if (editingId !== null) {
      await updateCourse(editingId, payload);
    } else {
      await addCourse(payload);
    }
    resetForm();
  };

  const formAccent = name.trim() ? colorForCourseName(name, schedule) : c.accent;

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 36, gap: 14 }} showsVerticalScrollIndicator={false}>
      <EduGpaHero
        gpa4={courses.length ? formatGpa(gpa4) : '0.00'}
        gpa100={courses.length ? formatGpa(gpa100, 1) : '0.0'}
        courseCount={courses.length}
      />

      <EduFormCard
        title={editingId !== null ? 'Dersi düzenle' : 'Ders ekle'}
        accent={formAccent}
        emoji={name.trim() ? emojiForCourse(name) : '📊'}>
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
        <PrimaryButton label={editingId !== null ? 'Güncelle' : 'Dersi kaydet'} onPress={onSave} />
        {editingId !== null ? <GhostButton label="Vazgeç" onPress={resetForm} /> : null}
      </EduFormCard>

      <EduSectionTitle title="Dönem dersleri" />
      {courses.length === 0 ? (
        <EmptyState
          emoji="📊"
          title="Ders kaydı yok"
          body="Ders adı, AKTS ve harf notu gir. AGNO otomatik hesaplanır."
          actionLabel="Ders ekle"
          onAction={() => {
            setName('Veri Yapıları');
            setEcts('5');
            setLetter('BB');
          }}
        />
      ) : (
        courses.map((course) => {
          const accent = letterColors[course.letter];
          return (
            <EduColorCard
              key={course.id}
              accent={accent}
              emoji={emojiForCourse(course.name)}
              badge={`${course.ects} AKTS · ${course.letter}`}
              title={course.name}
              subtitle={course.score100 !== null ? `100'lük not: ${course.score100}` : `${course.letter} harf notu`}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <GhostButton label="Düzenle" onPress={() => onEdit(course)} />
                <GhostButton
                  label="Sil"
                  danger
                  onPress={() =>
                    confirmDelete('Ders silinsin mi?', course.name, () => removeCourse(course.id))
                  }
                />
              </View>
            </EduColorCard>
          );
        })
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
