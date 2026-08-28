import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { BackupCard } from '@/components/BackupCard';
import { Card, Chip, Field, GhostButton, Muted, PrimaryButton, Screen, Title, useColors } from '@/components/ui';
import { isProfileComplete } from '@/lib/profile';
import { ensureNotificationPermission } from '@/lib/notifications';
import { useAppStore } from '@/store/useAppStore';

export default function SettingsScreen() {
  const c = useColors();
  const router = useRouter();
  const theme = useAppStore((state) => state.theme);
  const profile = useAppStore((state) => state.profile);
  const setTheme = useAppStore((state) => state.setTheme);
  const saveProfile = useAppStore((state) => state.saveProfile);
  const [firstName, setFirstName] = useState(profile?.firstName ?? '');
  const [lastName, setLastName] = useState(profile?.lastName ?? '');
  const [department, setDepartment] = useState(profile?.department ?? '');
  const [university, setUniversity] = useState(profile?.university ?? '');
  const [year, setYear] = useState(profile?.year ?? '');
  const [notifyStatus, setNotifyStatus] = useState<string | null>(null);
  const [notifyDenied, setNotifyDenied] = useState(false);

  const onSaveProfile = async () => {
    const next = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      department: department.trim(),
      university: university.trim(),
      year: year.trim(),
    };
    if (!isProfileComplete(next)) {
      Alert.alert('Eksik bilgi', 'Ad, soyad ve bölüm alanları zorunludur.');
      return;
    }
    await saveProfile(next);
    Alert.alert('Kaydedildi', 'Profil bilgilerin güncellendi.');
  };

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
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ paddingBottom: 36, gap: 12 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title>Ayarlar</Title>
            <Pressable onPress={() => router.back()}>
              <Text style={{ color: c.blue, fontWeight: '700' }}>Kapat</Text>
            </Pressable>
          </View>
          <Muted>Tema, profil, bildirim ve yedek burada.</Muted>

          <Card style={{ gap: 10 }}>
            <Text style={{ color: c.text, fontWeight: '800', fontSize: 16 }}>Profil</Text>
            <Muted>Ana sayfada görünen adın ve bölüm bilgilerin.</Muted>
            <Field label="Ad" value={firstName} onChangeText={setFirstName} placeholder="Ad" autoCapitalize="words" />
            <Field label="Soyad" value={lastName} onChangeText={setLastName} placeholder="Soyad" autoCapitalize="words" />
            <Field label="Bölüm" value={department} onChangeText={setDepartment} placeholder="Bölüm" autoCapitalize="words" />
            <Field label="Üniversite" value={university} onChangeText={setUniversity} placeholder="Üniversite" autoCapitalize="words" />
            <Field label="Sınıf" value={year} onChangeText={setYear} placeholder="2. sınıf" />
            <PrimaryButton label="Profili kaydet" onPress={onSaveProfile} />
          </Card>

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
        </KeyboardAvoidingView>
      </Screen>
    </SafeAreaView>
  );
}
