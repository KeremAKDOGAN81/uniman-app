import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { BackupCard } from '@/components/BackupCard';
import { Card, Chip, GhostButton, Muted, PrimaryButton, Screen, Title, useColors } from '@/components/ui';
import { ensureNotificationPermission } from '@/lib/notifications';
import { useAppStore } from '@/store/useAppStore';

export default function SettingsScreen() {
  const c = useColors();
  const router = useRouter();
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const [notifyStatus, setNotifyStatus] = useState<string | null>(null);
  const [notifyDenied, setNotifyDenied] = useState(false);

  const onCheckNotify = async () => {
    const ok = await ensureNotificationPermission();
    setNotifyDenied(!ok);
    setNotifyStatus(ok ? 'Bildirim izni açık' : 'Bildirim izni kapalı — Ayarlar’dan UniMan için aç');
    if (!ok) {
      Alert.alert('Bildirim kapalı', 'Telefon Ayarları → Uygulamalar → UniMan → Bildirimler.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <Screen>
        <ScrollView contentContainerStyle={{ paddingBottom: 36, gap: 12 }} showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title>Ayarlar</Title>
            <Pressable onPress={() => router.back()}>
              <Text style={{ color: c.blue, fontWeight: '700' }}>Kapat</Text>
            </Pressable>
          </View>
          <Muted>Tema, bildirim ve yedek burada. Ana sayfadaki kısayollar da aynı işi görür.</Muted>

          <Card style={{ gap: 10 }}>
            <Text style={{ color: c.text, fontWeight: '800', fontSize: 16 }}>Görünüm</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Chip label="Açık" selected={theme === 'light'} onPress={() => setTheme('light')} />
              <Chip label="Koyu" selected={theme === 'dark'} onPress={() => setTheme('dark')} />
            </View>
          </Card>

          <Card style={{ gap: 10 }}>
            <Text style={{ color: c.text, fontWeight: '800', fontSize: 16 }}>Bildirimler</Text>
            <Muted>Ders ve sınav hatırlatmaları için sistem izni gerekir.</Muted>
            <PrimaryButton label="Bildirim iznini kontrol et" onPress={onCheckNotify} />
            {notifyStatus ? <Muted>{notifyStatus}</Muted> : null}
            {notifyDenied ? (
              <GhostButton label="Sistem ayarlarını aç" onPress={() => Linking.openSettings()} />
            ) : null}
          </Card>

          <Card style={{ gap: 10 }}>
            <Text style={{ color: c.text, fontWeight: '800', fontSize: 16 }}>Gizlilik</Text>
            <Muted>Veriler yalnızca bu cihazda tutulur. Hesap yoktur.</Muted>
            <GhostButton label="Gizlilik metnini aç" onPress={() => router.push('/privacy' as never)} />
          </Card>

          <BackupCard />
        </ScrollView>
      </Screen>
    </SafeAreaView>
  );
}
