import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { FauxGradient } from '@/components/edu';
import { GhostButton, Muted, PrimaryButton, Screen, useColors } from '@/components/ui';
import { hapticSuccess } from '@/lib/haptics';
import { useToast } from '@/lib/toast';

const PRESETS = [
  { label: '25 dk odak', minutes: 25 },
  { label: '45 dk odak', minutes: 45 },
  { label: '15 dk mola', minutes: 15 },
];

export default function FocusScreen() {
  const c = useColors();
  const router = useRouter();
  const toast = useToast((s) => s.show);
  const params = useLocalSearchParams<{ course?: string | string[]; minutes?: string | string[] }>();
  const course = Array.isArray(params.course) ? params.course[0] : params.course;
  const initialMinutes = Number(Array.isArray(params.minutes) ? params.minutes[0] : params.minutes);

  const [totalSeconds, setTotalSeconds] = useState(
    Number.isFinite(initialMinutes) && initialMinutes > 0 ? initialMinutes * 60 : 25 * 60
  );
  const [remaining, setRemaining] = useState(totalSeconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setRemaining(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    if (!running || remaining <= 0) return;
    const timer = setInterval(() => {
      setRemaining((value) => value - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [running, remaining]);

  useEffect(() => {
    if (remaining <= 0 && running) {
      setRunning(false);
      hapticSuccess();
      toast('Odak süresi bitti');
    }
  }, [remaining, running, toast]);

  const label = useMemo(() => {
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [remaining]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <Screen>
        <ScrollView contentContainerStyle={{ paddingBottom: 36, gap: 16 }} showsVerticalScrollIndicator={false}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text style={{ color: c.blue, fontWeight: '700' }}>‹ Geri</Text>
          </Pressable>

          <Animated.View entering={FadeInDown.duration(280).springify()}>
            <FauxGradient colors={['#6C5CE7', '#22C55E']} style={{ borderRadius: 28, padding: 24, alignItems: 'center', gap: 10 }}>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontWeight: '700' }}>Odak modu</Text>
              <Text style={{ color: '#fff', fontSize: 56, fontWeight: '900', letterSpacing: 2 }}>{label}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.88)', fontSize: 14, textAlign: 'center' }}>
                {course ? `${course} için çalışıyorsun` : 'Ders seçmeden genel odak seansı'}
              </Text>
            </FauxGradient>
          </Animated.View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {PRESETS.map((preset) => (
              <GhostButton
                key={preset.minutes}
                label={preset.label}
                onPress={() => {
                  setTotalSeconds(preset.minutes * 60);
                  setRunning(false);
                }}
              />
            ))}
          </View>

          <PrimaryButton
            label={running ? 'Duraklat' : remaining < totalSeconds && remaining > 0 ? 'Devam et' : 'Başlat'}
            onPress={() => setRunning((value) => !value)}
          />
          <GhostButton
            label="Sıfırla"
            onPress={() => {
              setRunning(false);
              setRemaining(totalSeconds);
            }}
          />
          <Muted>Boş saatlerinden veya ders merkezinden buraya gelebilirsin. Bildirimler odak sırasında de devam eder.</Muted>
        </ScrollView>
      </Screen>
    </SafeAreaView>
  );
}
