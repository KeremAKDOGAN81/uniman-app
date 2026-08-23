import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Card, Muted, PrimaryButton, Screen, Title, useColors } from '@/components/ui';
import { ensureNotificationPermission } from '@/lib/notifications';
import { useAppStore } from '@/store/useAppStore';

const STEPS = [
  {
    emoji: '📅',
    title: 'Programını kur',
    body: 'Pazartesi–Cuma derslerini ekle. Ana sayfa bugünü oradan okur.',
  },
  {
    emoji: '🔔',
    title: 'Hatırlatma aç',
    body: 'Dersten 1–3 saat önce ve sınav/ödev için yerel bildirim kurabilirsin.',
  },
  {
    emoji: '🎯',
    title: 'Final ve AGNO',
    body: 'Hesap sekmesinde final hedefini ve dönem ortalamasını tut.',
  },
] as const;

export default function OnboardingScreen() {
  const c = useColors();
  const router = useRouter();
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  const finish = async () => {
    if (step === 1) {
      await ensureNotificationPermission();
    }
    if (step < STEPS.length - 1) {
      setStep((value) => value + 1);
      return;
    }
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  const skip = async () => {
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top', 'bottom']}>
      <Screen style={{ justifyContent: 'space-between', paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Image
              source={require('../assets/images/icon.png')}
              style={{ width: 36, height: 36, borderRadius: 10 }}
            />
            <Text style={{ color: c.accent, fontWeight: '800', fontSize: 18 }}>UniMan</Text>
          </View>
          <Pressable onPress={skip}>
            <Text style={{ color: c.muted, fontWeight: '700' }}>Atla</Text>
          </Pressable>
        </View>

        <Card style={{ gap: 14, alignItems: 'center', paddingVertical: 28 }}>
          <Text style={{ fontSize: 52 }}>{current.emoji}</Text>
          <Title>{current.title}</Title>
          <Muted>{current.body}</Muted>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
            {STEPS.map((_, index) => (
              <View
                key={index}
                style={{
                  width: index === step ? 18 : 8,
                  height: 8,
                  borderRadius: 99,
                  backgroundColor: index === step ? c.accent : c.line,
                }}
              />
            ))}
          </View>
        </Card>

        <PrimaryButton
          label={step === STEPS.length - 1 ? 'Başla' : step === 1 ? 'İzni sor ve devam' : 'Devam'}
          onPress={finish}
        />
      </Screen>
    </SafeAreaView>
  );
}
