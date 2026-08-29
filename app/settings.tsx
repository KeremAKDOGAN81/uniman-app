import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
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
  const activeSemester = useAppStore((state) => state.activeSemester);
  const morningSummaryEnabled = useAppStore((state) => state.morningSummaryEnabled);
  const setMorningSummaryEnabled = useAppStore((state) => state.setMorningSummaryEnabled);
  const setActiveSemester = useAppStore((state) => state.setActiveSemester);
  const profile = useAppStore((state) => state.profile);
  const setTheme = useAppStore((state) => state.setTheme);
  const saveProfile = useAppStore((state) => state.saveProfile);
  const [firstName, setFirstName] = useState(profile?.firstName ?? '');
  const [lastName, setLastName] = useState(profile?.lastName ?? '');
  const [department, setDepartment] = useState(profile?.department ?? '');
  const [university, setUniversity] = useState(profile?.university ?? '');
  const [year, setYear] = useState(profile?.year ?? '');
  const [semesterDraft, setSemesterDraft] = useState(activeSemester);
  const [notifyStatus, setNotifyStatus] = useState<string | null>(null);
  const [notifyDenied, setNotifyDenied] = useState(false);

  useEffect(() => {
    setFirstName(profile?.firstName ?? '');
    setLastName(profile?.lastName ?? '');
    setDepartment(profile?.department ?? '');
    setUniversity(profile?.university ?? '');
    setYear(profile?.year ?? '');
  }, [profile]);

  useEffect(() => {
    setSemesterDraft(activeSemester);
  }, [activeSemester]);

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
          <Animated.View entering={FadeInDown.duration(280).springify()} style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title>Ayarlar</Title>
              <Pressable onPress={() => router.back()} hitSlop={10}>
                <Text style={{ color: c.blue, fontWeight: '700' }}>Kapat</Text>
              </Pressable>
            </View>
            <Muted>Tema, profil, bildirim ve yedek burada.</Muted>
          </Animated.View>

          <Card style={{ gap: 10 }} animationDelay={40}>
            <Text style={{ color: c.text, fontWeight: '800', fontSize: 16 }}>Profil</Text>
            <Muted>Ana sayfada görünen adın ve bölüm bilgilerin.</Muted>
            <Field label="Ad" value={firstName} onChangeText={setFirstName} placeholder="Ad" autoCapitalize="words" />
            <Field label="Soyad" value={lastName} onChangeText={setLastName} placeholder="Soyad" autoCapitalize="words" />
            <Field label="Bölüm" value={department} onChangeText={setDepartment} placeholder="Bölüm" autoCapitalize="words" />
            <Field label="Üniversite" value={university} onChangeText={setUniversity} placeholder="Üniversite" autoCapitalize="words" />
            <Field label="Sınıf" value={year} onChangeText={setYear} placeholder="2. sınıf" />
            <PrimaryButton label="Profili kaydet" onPress={onSaveProfile} />
          </Card>

          <Card style={{ gap: 10 }} animationDelay={90}>
            <Text style={{ color: c.text, fontWeight: '800', fontSize: 16 }}>Dönem</Text>
            <Muted>AGNO hesabı bu döneme göre filtrelenir. Yeni dersler bu döneme kaydedilir.</Muted>
            <Field
              label="Aktif dönem"
              value={semesterDraft}
              onChangeText={setSemesterDraft}
              placeholder="2025-2026 Güz"
            />
            <PrimaryButton label="Dönemi kaydet" onPress={() => setActiveSemester(semesterDraft)} />
          </Card>

          <Card style={{ gap: 10 }} animationDelay={120}>
            <Text style={{ color: c.text, fontWeight: '800', fontSize: 16 }}>Görünüm</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Chip label="Açık" selected={theme === 'light'} onPress={() => setTheme('light')} />
              <Chip label="Koyu" selected={theme === 'dark'} onPress={() => setTheme('dark')} />
            </View>
          </Card>

          <Card style={{ gap: 10 }} animationDelay={140}>
            <Text style={{ color: c.text, fontWeight: '800', fontSize: 16 }}>Bildirimler</Text>
            <Muted>Ders ve sınav hatırlatmaları için sistem izni gerekir.</Muted>
            <PrimaryButton label="Bildirim iznini kontrol et" onPress={onCheckNotify} />
            {notifyStatus ? <Muted>{notifyStatus}</Muted> : null}
            {notifyDenied ? (
              <GhostButton label="Sistem ayarlarını aç" onPress={() => Linking.openSettings()} />
            ) : null}
            <View style={{ marginTop: 4 }}>
              <Muted>Her sabah 07:30’da bugünkü ders özeti gönderilir.</Muted>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Chip
                label="Sabah özeti açık"
                selected={morningSummaryEnabled}
                onPress={() => setMorningSummaryEnabled(true)}
              />
              <Chip
                label="Sabah özeti kapalı"
                selected={!morningSummaryEnabled}
                onPress={() => setMorningSummaryEnabled(false)}
              />
            </View>
          </Card>

          <Card style={{ gap: 10 }} animationDelay={190}>
            <Text style={{ color: c.text, fontWeight: '800', fontSize: 16 }}>Gizlilik</Text>
            <Muted>Veriler yalnızca bu cihazda tutulur. Hesap yoktur.</Muted>
            <GhostButton label="Gizlilik metnini aç" onPress={() => router.push('/privacy' as never)} />
          </Card>

          <Animated.View entering={FadeInDown.delay(240).duration(300).springify()}>
            <BackupCard />
          </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Screen>
    </SafeAreaView>
  );
}
