import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

import {
  Card,
  EmptyState,
  Field,
  GhostButton,
  Muted,
  PrimaryButton,
  Screen,
  Title,
  useColors,
} from '@/components/ui';
import { hapticSuccess } from '@/lib/haptics';
import { useAppStore } from '@/store/useAppStore';

export default function NotesScreen() {
  const c = useColors();
  const params = useLocalSearchParams<{ ders?: string | string[] }>();
  const courseParam = Array.isArray(params.ders) ? params.ders[0] : params.ders;
  const notes = useAppStore((state) => state.notes);
  const addNote = useAppStore((state) => state.addNote);
  const removeNote = useAppStore((state) => state.removeNote);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (note) => note.title.toLowerCase().includes(q) || note.body.toLowerCase().includes(q)
    );
  }, [notes, query]);

  useEffect(() => {
    if (courseParam?.trim()) {
      setNoteTitle(courseParam.trim());
    }
  }, [courseParam]);

  const onAddNote = async () => {
    const heading = noteTitle.trim();
    if (!heading) {
      Alert.alert('Eksik bilgi', 'Not başlığı yaz. Ders adı da olabilir.');
      return;
    }
    await addNote({ title: heading, body: noteBody.trim() });
    hapticSuccess();
    setNoteTitle(courseParam?.trim() ?? '');
    setNoteBody('');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Screen>
          <ScrollView contentContainerStyle={{ paddingBottom: 36, gap: 12 }} showsVerticalScrollIndicator={false}>
            <Title>Notlar</Title>
            <Muted>Tahtadaki iki cümleyi buraya at. Programdan “Bu derse not” dersen başlık hazır gelir.</Muted>

            <Card style={{ gap: 12 }}>
              <Text style={{ color: c.text, fontWeight: '800', fontSize: 16 }}>Hızlı not</Text>
              <Field
                label="Başlık"
                value={noteTitle}
                onChangeText={setNoteTitle}
                placeholder="Veri Yapıları — ağaçlar"
              />
              <Field
                label="İçerik"
                value={noteBody}
                onChangeText={setNoteBody}
                placeholder="Haftaya quiz: BST dolaşma"
                multiline
              />
              <PrimaryButton label="Notu kaydet" onPress={onAddNote} />
            </Card>

            {notes.length > 0 ? (
              <Field label="Notlarda ara" value={query} onChangeText={setQuery} placeholder="Ders veya kelime" />
            ) : null}

            {notes.length === 0 ? (
              <EmptyState
                title="Defter henüz boş"
                body="Ana sayfadan Not yaz, ya da Program’da derse dokunup not aç."
              />
            ) : filtered.length === 0 ? (
              <EmptyState title="Eşleşen not yok" body="Başka bir kelime dene veya aramayı sil." />
            ) : (
              filtered.map((note) => (
                <Card key={note.id} style={{ gap: 6 }}>
                  <Text style={{ color: c.text, fontWeight: '800', fontSize: 16 }}>{note.title}</Text>
                  {note.body ? <Text style={{ color: c.text, lineHeight: 20 }}>{note.body}</Text> : null}
                  <GhostButton label="Sil" danger onPress={() => removeNote(note.id)} />
                </Card>
              ))
            )}
          </ScrollView>
        </Screen>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
