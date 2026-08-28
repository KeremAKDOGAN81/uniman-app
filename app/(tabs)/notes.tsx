import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { CourseChipRow } from '@/components/CourseChipRow';
import { SwipeTabShell } from '@/components/SwipeTabShell';
import {
  EduColorCard,
  EduFormCard,
  EduHeroBanner,
  EduPageHeader,
  EduSearchBar,
  EduSectionTitle,
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
import { statNoteTags, statNotesTotal } from '@/lib/copy';
import { colorForCourseName, emojiForCourse } from '@/lib/courseColor';
import { formatDateTime } from '@/lib/dates';
import { hapticSuccess } from '@/lib/haptics';
import { useAppStore } from '@/store/useAppStore';

export default function NotesScreen() {
  const c = useColors();
  const params = useLocalSearchParams<{ ders?: string | string[] }>();
  const courseParam = Array.isArray(params.ders) ? params.ders[0] : params.ders;
  const notes = useAppStore((state) => state.notes);
  const courses = useAppStore((state) => state.courses);
  const schedule = useAppStore((state) => state.schedule);
  const attendance = useAppStore((state) => state.attendance);
  const examTargets = useAppStore((state) => state.examTargets);
  const reminders = useAppStore((state) => state.reminders);
  const addNote = useAppStore((state) => state.addNote);
  const updateNote = useAppStore((state) => state.updateNote);
  const removeNote = useAppStore((state) => state.removeNote);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [courseName, setCourseName] = useState('');
  const [query, setQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState<string | null>(null);

  const courseSuggestions = useMemo(
    () => collectCourseNames({ courses, schedule, attendance, examTargets, notes, reminders }),
    [courses, schedule, attendance, examTargets, notes, reminders]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes.filter((note) => {
      if (courseFilter && note.courseName.trim() !== courseFilter) return false;
      if (!q) return true;
      return (
        note.title.toLowerCase().includes(q) ||
        note.body.toLowerCase().includes(q) ||
        note.courseName.toLowerCase().includes(q)
      );
    });
  }, [notes, query, courseFilter]);

  const tagCount = useMemo(() => {
    const tags = new Set(notes.map((n) => n.courseName.trim()).filter(Boolean));
    return tags.size;
  }, [notes]);

  const notesStat = useMemo(() => statNotesTotal(notes.length), [notes.length]);
  const tagsStat = useMemo(() => statNoteTags(tagCount), [tagCount]);

  useEffect(() => {
    if (courseParam?.trim() && editingId === null) {
      setCourseName(courseParam.trim());
    }
  }, [courseParam, editingId]);

  const resetForm = () => {
    setEditingId(null);
    setNoteTitle('');
    setNoteBody('');
    setCourseName(courseParam?.trim() ?? '');
  };

  const onSave = async () => {
    const heading = noteTitle.trim();
    const tag = courseName.trim();
    if (!heading) {
      Alert.alert('Eksik bilgi', 'Not başlığını yaz.');
      return;
    }
    if (!tag) {
      Alert.alert('Eksik bilgi', 'Hangi derse ait olduğunu seç veya yaz.');
      return;
    }
    if (editingId !== null) {
      await updateNote(editingId, { title: heading, body: noteBody.trim(), courseName: tag });
    } else {
      await addNote({ title: heading, body: noteBody.trim(), courseName: tag });
    }
    hapticSuccess();
    resetForm();
  };

  const filterOptions = useMemo(() => {
    const tags = new Set<string>();
    for (const note of notes) {
      const tag = note.courseName.trim();
      if (tag) tags.add(tag);
    }
    return [...tags].sort((a, b) => a.localeCompare(b, 'tr'));
  }, [notes]);

  const formAccent = courseName.trim()
    ? colorForCourseName(courseName, schedule)
    : c.pink;

  return (
    <SwipeTabShell tab="notes">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Screen>
          <ScrollView contentContainerStyle={{ paddingBottom: 36, gap: 14 }} showsVerticalScrollIndicator={false}>
            <EduPageHeader
              title="Notlar"
              subtitle="Ders notlarını kaydet, etiketle ve ara."
              badge="Notes"
              accentColor={c.pink}
              emoji="📝"
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <EduStatTile
                label={notesStat.label}
                value={notesStat.value}
                hint={notesStat.hint}
                gradient={['#E879F9', '#6C5CE7'] as const}
              />
              <EduStatTile
                label={tagsStat.label}
                value={tagsStat.value}
                hint={tagsStat.hint}
                gradient={eduGradients.sky}
              />
            </View>

            {notes.length > 0 ? (
              <EduHeroBanner
                badge="DEFTER"
                title={`${notes.length} not kayıtlı`}
                subtitle={tagCount ? `${tagCount} derse ayrılmış` : 'Notlarına ders etiketi ekle'}
                colors={['#A594FF', '#F0A8FF'] as const}
              />
            ) : null}

            <EduFormCard
              title={editingId !== null ? 'Notu düzenle' : 'Hızlı not'}
              accent={formAccent}
              emoji={courseName.trim() ? emojiForCourse(courseName) : '📝'}>
              <Field label="Ders etiketi" value={courseName} onChangeText={setCourseName} placeholder="Veri Yapıları" />
              <CourseChipRow names={courseSuggestions} selected={courseName} onSelect={setCourseName} />
              <Field label="Başlık" value={noteTitle} onChangeText={setNoteTitle} placeholder="Ağaçlar — özet" />
              <Field
                label="İçerik"
                value={noteBody}
                onChangeText={setNoteBody}
                placeholder="Haftaya quiz: BST dolaşma"
                multiline
              />
              <PrimaryButton label={editingId !== null ? 'Güncelle' : 'Notu kaydet'} onPress={onSave} />
              {editingId !== null ? <GhostButton label="Vazgeç" onPress={resetForm} /> : null}
            </EduFormCard>

            {notes.length > 0 ? (
              <>
                <EduSearchBar placeholder="Notlarda ara…" value={query} onChangeText={setQuery} />
                {filterOptions.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    <Chip label="Tümü" selected={courseFilter === null} color={c.pink} onPress={() => setCourseFilter(null)} />
                    {filterOptions.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        selected={courseFilter === tag}
                        color={colorForCourseName(tag, schedule)}
                        onPress={() => setCourseFilter(tag)}
                      />
                    ))}
                  </ScrollView>
                ) : null}
                <EduSectionTitle title="Kayıtlı notlar" />
              </>
            ) : null}

            {notes.length === 0 ? (
              <EmptyState
                emoji="📝"
                title="Henüz not yok"
                body="Ders etiketi seç, başlık ve içerik yaz. Programdan derse dokunarak da not açabilirsin."
                actionLabel="Not yazmaya başla"
                onAction={() => setCourseName(courseParam?.trim() || 'Veri Yapıları')}
              />
            ) : filtered.length === 0 ? (
              <EmptyState emoji="🔎" title="Eşleşen not yok" body="Başka bir kelime dene veya aramayı sil." />
            ) : (
              filtered.map((note) => {
                const accent = note.courseName.trim()
                  ? colorForCourseName(note.courseName, schedule)
                  : c.pink;
                return (
                  <EduColorCard
                    key={note.id}
                    accent={accent}
                    emoji={emojiForCourse(note.courseName || note.title)}
                    badge={note.courseName.trim() || 'NOT'}
                    title={note.title}
                    subtitle={formatDateTime(note.createdAt)}>
                    {note.body ? (
                      <Text style={{ color: c.text, lineHeight: 21, fontSize: 15 }}>{note.body}</Text>
                    ) : null}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <GhostButton
                        label="Düzenle"
                        onPress={() => {
                          setEditingId(note.id);
                          setNoteTitle(note.title);
                          setNoteBody(note.body);
                          setCourseName(note.courseName);
                        }}
                      />
                      <GhostButton
                        label="Sil"
                        danger
                        onPress={() =>
                          confirmDelete('Not silinsin mi?', note.title, () => removeNote(note.id))
                        }
                      />
                    </View>
                  </EduColorCard>
                );
              })
            )}
          </ScrollView>
        </Screen>
      </KeyboardAvoidingView>
    </SwipeTabShell>
  );
}
