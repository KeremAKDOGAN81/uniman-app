import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  SlideOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { EduHashtagChip, FauxGradient } from '@/components/edu';
import { Field, PrimaryButton, useColors } from '@/components/ui';
import { isProfileComplete } from '@/lib/profile';
import { ensureNotificationPermission } from '@/lib/notifications';
import { useAppStore } from '@/store/useAppStore';

const { width } = Dimensions.get('window');

const HASHTAGS = ['Program', 'Notlar', 'AGNO', 'Final', 'Hatırlatma', 'Devamsızlık'];

const STEPS = [
  {
    emoji: '🎓',
    headline: 'UniMan nedir?',
    title: 'Üniversite işlerin tek uygulamada',
    body: 'Hesap yok, sunucu yok. Ders programın, notların, AGNO’n ve hatırlatmaların yalnızca bu telefonda durur.',
    points: ['Kurulum bir dakikadan kısa', 'Verin dışarı çıkmaz', 'Ücretsiz, reklam yok'],
    accent: '#6C5CE7',
  },
  {
    emoji: '📅',
    headline: 'Program',
    title: 'Haftalık ders saatlerini yönet',
    body: 'Hangi gün, hangi sınıf, kaçta başlıyor — kartlarla görürsün. İstersen dersi paylaşır, dersten önce hatırlatma alırsın.',
    points: ['Günlük ve haftalık görünüm', 'Renkli ders kartları', 'Dersten 1–3 saat önce bildirim'],
    accent: '#5B7CFA',
  },
  {
    emoji: '📝',
    headline: 'Notlar',
    title: 'Ders notunu unutma',
    body: 'Hızlı not al, derse etiketle, önemli olanı sabitle. İstersen fotoğraf da eklenir.',
    points: ['Ders etiketleri', 'Arama ve sabitleme', 'Galeri fotoğrafı'],
    accent: '#E879F9',
  },
  {
    emoji: '🧮',
    headline: 'Hesap',
    title: 'AGNO ve final hedefini gör',
    body: 'Vize ve ağırlıkları gir, finalden kaç alman gerektiğini anında hesapla. Dönem ortalaman da burada.',
    points: ['Final hedefi', 'Dönem AGNO', 'Kaydedilen hesaplar'],
    accent: '#22C55E',
  },
  {
    emoji: '🔔',
    headline: 'Takip',
    title: 'Sınav, ödev, devamsızlık',
    body: 'Tarihleri kaçırma. Devamsızlık hakkını say, istersen gelmediğin günü de kaydet.',
    points: ['Yerel bildirim', 'Sınav / ödev hatırlatması', 'Gün gün devamsızlık'],
    accent: '#FF9F1C',
    askNotify: true,
  },
  {
    emoji: '👋',
    headline: 'Hazırsın',
    title: 'Bir sonraki adım: seni tanıyalım',
    body: 'Sekmeler arasında sağa-sola kaydırarak gezinirsin. Şimdi adın ve bölümün, ardından ana sayfa.',
    points: ['Kaydırarak sekme değiştir', 'Ayarlar’dan profili güncelle', 'Yedek alıp geri yükle'],
    accent: '#14B8A6',
  },
] as const;

function FloatingOrb({
  size,
  color,
  top,
  left,
  delay,
}: {
  size: number;
  color: string;
  top: number;
  left: number;
  delay: number;
}) {
  const drift = useSharedValue(0);
  useEffect(() => {
    drift.value = withRepeat(
      withSequence(withTiming(-8, { duration: 1200 + delay }), withTiming(8, { duration: 1200 + delay })),
      -1,
      true
    );
  }, [delay, drift]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: drift.value }] }));
  return (
    <Animated.View
      style={[
        style,
        { position: 'absolute', top, left, width: size, height: size, borderRadius: size / 2, backgroundColor: color },
      ]}
    />
  );
}

export default function OnboardingScreen() {
  const c = useColors();
  const router = useRouter();
  const profile = useAppStore((state) => state.profile);
  const introDone = useAppStore((state) => state.introDone);
  const completeIntro = useAppStore((state) => state.completeIntro);
  const saveProfile = useAppStore((state) => state.saveProfile);
  const [phase, setPhase] = useState<'intro' | 'profile'>(() => (introDone ? 'profile' : 'intro'));
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState(profile?.firstName ?? '');
  const [lastName, setLastName] = useState(profile?.lastName ?? '');
  const [department, setDepartment] = useState(profile?.department ?? '');
  const [university, setUniversity] = useState(profile?.university ?? '');
  const [year, setYear] = useState(profile?.year ?? '');
  const current = STEPS[step];
  const stepRef = useRef(step);
  stepRef.current = step;

  const goToProfile = async () => {
    await completeIntro();
    setPhase('profile');
  };

  const goNext = async () => {
    const currentStep = STEPS[stepRef.current];
    if ('askNotify' in currentStep && currentStep.askNotify) {
      await ensureNotificationPermission();
    }
    if (stepRef.current < STEPS.length - 1) {
      setStep((value) => value + 1);
      return;
    }
    await goToProfile();
  };

  const goPrev = () => {
    setStep((value) => Math.max(0, value - 1));
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, gesture) =>
          Math.abs(gesture.dx) > 18 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2,
        onPanResponderRelease: (_evt, gesture) => {
          if (gesture.dx < -48) void goNext();
          else if (gesture.dx > 48) goPrev();
        },
      }),
    []
  );

  const submitProfile = async () => {
    const profile = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      department: department.trim(),
      university: university.trim(),
      year: year.trim(),
    };
    if (!isProfileComplete(profile)) {
      Alert.alert('Eksik bilgi', 'Ad, soyad ve bölüm alanları zorunludur.');
      return;
    }
    await saveProfile(profile);
    router.replace('/(tabs)');
  };

  if (phase === 'profile') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 22, paddingBottom: 28 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Animated.View
              entering={FadeIn.duration(300)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 8 }}>
              <Image source={require('../assets/images/icon.png')} style={{ width: 36, height: 36, borderRadius: 12 }} />
              <Text style={{ color: c.accent, fontWeight: '900', fontSize: 20 }}>UniMan</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(350)} style={{ marginTop: 28, gap: 8 }}>
              <Text style={{ color: c.muted, fontSize: 13, fontWeight: '800', letterSpacing: 0.4 }}>SON ADIM</Text>
              <Text style={{ color: c.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.5 }}>Seni tanıyalım</Text>
              <Text style={{ color: c.muted, fontSize: 15, lineHeight: 22 }}>
                Ana sayfada adınla karşılanırız. Bu bilgiler yalnızca cihazda kalır, hesap açılmaz.
              </Text>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(80)}
              style={{
                marginTop: 24,
                gap: 14,
                backgroundColor: c.card,
                borderRadius: 28,
                padding: 18,
                borderWidth: 1,
                borderColor: c.line,
              }}>
              <Field label="Ad" value={firstName} onChangeText={setFirstName} placeholder="Kerem" autoCapitalize="words" />
              <Field label="Soyad" value={lastName} onChangeText={setLastName} placeholder="Akdoğan" autoCapitalize="words" />
              <Field
                label="Bölüm"
                value={department}
                onChangeText={setDepartment}
                placeholder="Bilgisayar Programcılığı"
                autoCapitalize="words"
              />
              <Field
                label="Üniversite (isteğe bağlı)"
                value={university}
                onChangeText={setUniversity}
                placeholder="Sakarya Uygulamalı Bilimler"
                autoCapitalize="words"
              />
              <Field label="Sınıf (isteğe bağlı)" value={year} onChangeText={setYear} placeholder="2. sınıf" />
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(140)} style={{ marginTop: 20 }}>
              <PrimaryButton label="Ana sayfaya geç" onPress={submitProfile} />
              <Text style={{ color: c.muted, textAlign: 'center', marginTop: 10, fontSize: 12 }}>
                Sonra Ayarlar’dan değiştirebilirsin.
              </Text>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top', 'bottom']}>
      <View style={{ flex: 1, paddingHorizontal: 22, paddingBottom: 20 }}>
        <Animated.View
          entering={FadeIn.duration(300)}
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Image source={require('../assets/images/icon.png')} style={{ width: 36, height: 36, borderRadius: 12 }} />
            <Text style={{ color: c.accent, fontWeight: '900', fontSize: 20 }}>UniMan</Text>
          </View>
          <Pressable onPress={() => void goToProfile()} hitSlop={10}>
            <Text style={{ color: c.muted, fontWeight: '700' }}>Atla</Text>
          </Pressable>
        </Animated.View>

        <View style={{ flex: 1 }} {...panResponder.panHandlers}>
          {step === 0 ? (
            <Animated.View
              entering={FadeInDown.duration(400)}
              style={{ flexWrap: 'wrap', flexDirection: 'row', gap: 8, marginTop: 16, justifyContent: 'center' }}>
              {HASHTAGS.map((tag, index) => (
                <EduHashtagChip key={tag} label={tag} dark={index % 3 === 0} />
              ))}
            </Animated.View>
          ) : null}

          <Animated.View
            key={step}
            entering={SlideInRight.duration(280).springify()}
            exiting={SlideOutLeft.duration(180)}
            style={{ flex: 1, justifyContent: 'center', gap: 14 }}>
            <View style={{ alignItems: 'center', minHeight: width * 0.38, justifyContent: 'center' }}>
              <FloatingOrb size={100} color={`${current.accent}22`} top={12} left={width * 0.08} delay={0} />
              <FloatingOrb size={60} color={`${current.accent}18`} top={48} left={width * 0.62} delay={150} />
              <FauxGradient
                colors={[current.accent, '#E879F9']}
                style={{ borderRadius: 28, paddingVertical: 22, paddingHorizontal: 24, width: width * 0.72, alignItems: 'center' }}>
                <Text style={{ color: 'rgba(255,255,255,0.92)', fontWeight: '800', fontSize: 13, marginBottom: 8 }}>
                  {current.headline}
                </Text>
                <Text style={{ fontSize: 52 }}>{current.emoji}</Text>
              </FauxGradient>
            </View>

            <Text style={{ color: c.text, fontSize: 26, fontWeight: '900', textAlign: 'center', lineHeight: 32, letterSpacing: -0.5 }}>
              {current.title}
            </Text>
            <Text style={{ color: c.muted, fontSize: 15, lineHeight: 22, textAlign: 'center', paddingHorizontal: 8 }}>
              {current.body}
            </Text>

            <View style={{ gap: 8, marginTop: 4 }}>
              {current.points.map((point) => (
                <View
                  key={point}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    backgroundColor: c.card,
                    borderRadius: 16,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderWidth: 1,
                    borderColor: c.line,
                  }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: current.accent }} />
                  <Text style={{ color: c.text, fontSize: 14, fontWeight: '700', flex: 1 }}>{point}</Text>
                </View>
              ))}
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 }}>
              {STEPS.map((item, index) => (
                <Pressable key={item.headline} onPress={() => setStep(index)} hitSlop={6}>
                  <View
                    style={{
                      width: index === step ? 22 : 8,
                      height: 8,
                      borderRadius: 99,
                      backgroundColor: index === step ? current.accent : c.line,
                    }}
                  />
                </Pressable>
              ))}
            </View>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInUp.delay(120)}>
          <PrimaryButton
            label={
              step === STEPS.length - 1
                ? 'Seni tanıyalım'
                : 'askNotify' in current && current.askNotify
                  ? 'Bildirimi aç ve devam'
                  : 'Devam'
            }
            onPress={() => void goNext()}
          />
          <Text style={{ color: c.muted, textAlign: 'center', marginTop: 10, fontSize: 12 }}>
            {step === 0 ? 'Sola kaydırarak da ilerleyebilirsin.' : `${step + 1} / ${STEPS.length}`}
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
