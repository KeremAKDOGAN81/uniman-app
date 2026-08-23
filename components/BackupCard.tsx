import { useState } from 'react';
import { Alert, Share, Text, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { Card, GhostButton, Muted, PrimaryButton, useColors } from '@/components/ui';
import { stringifyBackup } from '@/lib/backup';
import { confirmAction } from '@/lib/confirm';
import { useAppStore } from '@/store/useAppStore';

export function BackupCard() {
  const c = useColors();
  const [open, setOpen] = useState(false);
  const [paste, setPaste] = useState('');
  const importBackup = useAppStore((state) => state.importBackup);

  const runImport = async (raw: string) => {
    try {
      await importBackup(raw);
      setPaste('');
      setOpen(false);
      Alert.alert('İçe aktarıldı', 'Yedekteki dersler, program ve notlar yüklendi.');
    } catch {
      Alert.alert('Yedek okunamadı', 'UniMan JSON yedeğini olduğu gibi yapıştır veya dosyadan seç.');
    }
  };

  const confirmWipeThenImport = (raw: string) => {
    confirmAction(
      'Mevcut veriler silinsin mi?',
      'İçe aktarma tüm mevcut ders, program, hatırlatma, not ve hesap kayıtlarını siler ve yedekle değiştirir. Bu işlem geri alınamaz.',
      () => runImport(raw),
      'Sil ve yükle'
    );
  };

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
    try {
      const file = new File(Paths.cache, `uniman-backup-${Date.now()}.json`);
      file.create({ overwrite: true });
      file.write(json);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: 'UniMan yedek',
        });
        return;
      }
    } catch {
      // Fall through to Share.share
    }
    await Share.share({
      message: json,
      title: 'UniMan yedek',
    });
  };

  const onImportPaste = () => {
    if (!paste.trim()) {
      Alert.alert('Boş yedek', 'Önce JSON yapıştır veya dosyadan seç.');
      return;
    }
    confirmWipeThenImport(paste);
  };

  const onImportFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      const file = new File(result.assets[0].uri);
      const raw = await file.text();
      confirmWipeThenImport(raw);
    } catch {
      Alert.alert('Dosya okunamadı', 'JSON yedek dosyasını yeniden seç.');
    }
  };

  return (
    <Card style={{ gap: 8 }}>
      <Text style={{ color: c.text, fontWeight: '800' }}>Yedek</Text>
      <Muted>Telefon değişince notların kaybolmasın. Dosya olarak paylaş veya JSON yapıştır.</Muted>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <GhostButton label="Dışa aktar" onPress={onExport} />
        <GhostButton label="Dosyadan içe aktar" onPress={onImportFile} />
        <GhostButton label={open ? 'Vazgeç' : 'Yapıştır'} onPress={() => setOpen((value) => !value)} />
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
          <PrimaryButton label="Yedeği yükle" onPress={onImportPaste} />
        </View>
      ) : null}
    </Card>
  );
}
