import { useState } from 'react';
import { Alert, Share, Text, TextInput, View } from 'react-native';

import { Card, GhostButton, Muted, PrimaryButton, useColors } from '@/components/ui';
import { stringifyBackup } from '@/lib/backup';
import { useAppStore } from '@/store/useAppStore';

export function BackupCard() {
  const c = useColors();
  const [open, setOpen] = useState(false);
  const [paste, setPaste] = useState('');
  const importBackup = useAppStore((state) => state.importBackup);

  const onExport = async () => {
    const state = useAppStore.getState();
    const json = stringifyBackup({
      theme: state.theme,
      courses: state.courses,
      schedule: state.schedule,
      reminders: state.reminders,
      examTargets: state.examTargets,
      attendance: state.attendance,
      notes: state.notes,
    });
    await Share.share({
      message: json,
      title: 'UniMan yedek',
    });
  };

  const onImport = async () => {
    try {
      await importBackup(paste);
      setPaste('');
      setOpen(false);
      Alert.alert('İçe aktarıldı', 'Yedekteki dersler, program ve notlar yüklendi.');
    } catch {
      Alert.alert('Yedek okunamadı', 'UniMan JSON yedeğini olduğu gibi yapıştır.');
    }
  };

  return (
    <Card style={{ gap: 8 }}>
      <Text style={{ color: c.text, fontWeight: '800' }}>Yedek</Text>
      <Muted>Telefon değişince notların kaybolmasın. WhatsApp veya dosyaya paylaş, sonra yapıştır.</Muted>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <GhostButton label="Dışa aktar" onPress={onExport} />
        <GhostButton label={open ? 'Vazgeç' : 'İçe aktar'} onPress={() => setOpen((value) => !value)} />
      </View>
      {open ? (
        <View style={{ gap: 8 }}>
          <TextInput
            value={paste}
            onChangeText={setPaste}
            placeholder="Yedek JSON yapıştır"
            placeholderTextColor={c.muted}
            multiline
            style={{
              minHeight: 90,
              borderWidth: 1,
              borderColor: c.line,
              borderRadius: 12,
              padding: 12,
              color: c.text,
              backgroundColor: c.bgElevated,
              textAlignVertical: 'top',
            }}
          />
          <PrimaryButton label="Yedeği yükle" onPress={onImport} />
        </View>
      ) : null}
    </Card>
  );
}
