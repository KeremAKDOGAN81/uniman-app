import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

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
  const addNote = useAppStore((state) => state.addNote);
  const updateNote = useAppStore((state) => state.updateNote);
  const removeNote = useAppStore((state) => state.removeNote);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [query, setQuery] = useState('');

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (note) => note.title.toLowerCase().includes(q) || note.body.toLowerCase().includes(q)
    );
  }, [notes, query]);

  useEffect(() => {
    if (courseParam?.trim() && editingId === null) {
      setNoteTitle(courseParam.trim());
    }
  }, [courseParam, editingId]);

  const resetForm = () => {
    setEditingId(null);
    setNoteTitle(courseParam?.trim() ?? '');
    setNoteBody('');
  };

  const onSave = async () => {
    const heading = noteTitle.trim();
    if (!heading) {
      Alert.alert('Eksik bilgi', 'Not başlığı yaz. Ders adı da olabilir.');
      return;
    }
    if (editingId !== null) {
      await updateNote(editingId, { title: heading, body: noteBody.trim() });
    } else {
      await addNote({ title: heading, body: noteBody.trim() });
    }
    hapticSuccess();
    resetForm();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Screen>
          <ScrollView contentContainerStyle={{ paddingBottom: 36, gap: 12 }} showsVerticalScrollIndicator={false}>
            <Title>Notlar</Title>
            <Muted>Tahtadaki iki cümleyi buraya at. Programdan “Bu derse not” dersen başlık hazır gelir.</Muted>

            <Card style={{ gap: 12 }}>
              <Text style={{ color: c.text, fontWeight: '800', fontSize: 16 }}>
                {editingId !== null ? 'Notu düzenle' : 'Hızlı not'}
              </Text>
              <Field
                label="Başlık"
                value={noteTitle}
                onChangeText={setNoteTitle}
                placeholder="Veri Yapıları — ağaçlar"
              />
              {courseSuggestions.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {courseSuggestions.map((suggestion) => (
                    <Chip
                      key={suggestion}
                      label={suggestion}
                      selected={noteTitle === suggestion}
                      onPress={() => setNoteTitle(suggestion)}
                    />
                  ))}
                </ScrollView>
              ) : null}
              <Field
                label="İçerik"
                value={noteBody}
                onChangeText={setNoteBody}
                placeholder="Haftaya quiz: BST dolaşma"
                multiline
              />
              <PrimaryButton label={editingId !== null ? 'Güncelle' : 'Notu kaydet'} onPress={onSave} />
              {editingId !== null ? <GhostButton label="Vazgeç" onPress={resetForm} /> : null}
            </Card>

            {notes.length > 0 ? (
              <Field label="Notlarda ara" value={query} onChangeText={setQuery} placeholder="Ders veya kelime" />
            ) : null}

            {notes.length === 0 ? (
              <EmptyState
                emoji="📝"
                title="Defter henüz boş"
                body="İlk notunu yukarıdan yaz. Program’dan derse dokunup da açabilirsin."
                actionLabel="Örnek başlık koy"
                onAction={() => setNoteTitle(courseParam?.trim() || 'Yeni not')}
              />
            ) : filtered.length === 0 ? (
              <EmptyState emoji="🔎" title="Eşleşen not yok" body="Başka bir kelime dene veya aramayı sil." />
            ) : (
              filtered.map((note) => (
                <Card key={note.id} style={{ gap: 6 }}>
                  <Text style={{ color: c.text, fontWeight: '800', fontSize: 16 }}>{note.title}</Text>
                  {note.body ? <Text style={{ color: c.text, lineHeight: 20 }}>{note.body}</Text> : null}
                  <Muted>{formatDateTime(note.createdAt)}</Muted>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <GhostButton
                      label="Düzenle"
                      onPress={() => {
                        setEditingId(note.id);
                        setNoteTitle(note.title);
                        setNoteBody(note.body);
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
                </Card>
              ))
            )}
          </ScrollView>
        </Screen>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
