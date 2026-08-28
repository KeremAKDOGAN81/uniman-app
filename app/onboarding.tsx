import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
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

const HASHTAGS = ['Program', 'Mentoring', 'Training', 'Curriculum', 'Development', 'Enrichment'];

const STEPS = [
  {
    headline: 'Beginner To Expert',
    title: 'Your Gateway To Unlimited Learning With AI',
    body: "Join 'UniMan' for unlimited learning — program, AGNO, notlar ve hatırlatmalar tek yerde.",
    accent: '#6C5CE7',
  },
  {
    headline: 'Haftanı planla',
    title: 'Learning Timeline ile derslerini yönet',
    body: 'Renkli zaman çizelgesi, hafta şeridi ve dersten önce bildirim.',
    accent: '#6C5CE7',
  },
  {
    headline: 'Hatırlat',
    title: 'Sınav ve ödevleri kaçırma',
    body: 'Yerel bildirimlerle sınav ve ödev tarihlerini takip et.',
    accent: '#FF9F1C',
  },
  {
    headline: 'AGNO & Final',
    title: 'Hedefini net gör',
    body: 'Final hesabı ve dönem ortalaması canlı güncellenir.',
    accent: '#22C55E',
  },
  {
    headline: 'Hazırsın',
    title: 'Kaydırarak keşfet',
    body: 'Üst oklar veya yatay kaydırma ile sekmeler arasında geç.',
    accent: '#E879F9',
  },
] as const;

function FloatingOrb({ size, color, top, left, delay }: { size: number; color: string; top: number; left: number; delay: number }) {
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
      style={[style, { position: 'absolute', top, left, width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}
    />
  );
}

export default function OnboardingScreen() {
  const c = useColors();
  const router = useRouter();
  const introDone = useAppStore((state) => state.introDone);
  const completeIntro = useAppStore((state) => state.completeIntro);
  const saveProfile = useAppStore((state) => state.saveProfile);
  const [phase, setPhase] = useState<'intro' | 'profile'>(() => (introDone ? 'profile' : 'intro'));
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [department, setDepartment] = useState('');
  const [university, setUniversity] = useState('');
  const [year, setYear] = useState('');
  const current = STEPS[step];

  const goToProfile = async () => {
    await completeIntro();
    setPhase('profile');
  };

  const finishIntro = async () => {
    if (step === 2) await ensureNotificationPermission();
    if (step < STEPS.length - 1) {
      setStep((v) => v + 1);
      return;
    }
    await goToProfile();
  };

  const skipIntro = async () => {
    await goToProfile();
  };

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
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F4F8' }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 22, paddingBottom: 28 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeIn.duration(300)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 8 }}>
              <Image source={require('../assets/images/icon.png')} style={{ width: 36, height: 36, borderRadius: 12 }} />
              <Text style={{ color: c.accent, fontWeight: '900', fontSize: 20 }}>UniMan</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(350)} style={{ marginTop: 28, gap: 8 }}>
              <Text style={{ color: c.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.5 }}>Seni tanıyalım</Text>
              <Text style={{ color: c.muted, fontSize: 15, lineHeight: 22 }}>
                Bilgiler yalnızca bu cihazda kalır. Ana sayfada seni isminle karşılayacağız.
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
              <Field label="Ad" value={firstName} onChangeText={setFirstName} placeholder="Ahmet" autoCapitalize="words" />
              <Field label="Soyad" value={lastName} onChangeText={setLastName} placeholder="Yılmaz" autoCapitalize="words" />
              <Field label="Bölüm" value={department} onChangeText={setDepartment} placeholder="Bilgisayar Mühendisliği" autoCapitalize="words" />
              <Field label="Üniversite (isteğe bağlı)" value={university} onChangeText={setUniversity} placeholder="İstanbul Üniversitesi" autoCapitalize="words" />
              <Field label="Sınıf (isteğe bağlı)" value={year} onChangeText={setYear} placeholder="2. sınıf" />
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(140)} style={{ marginTop: 20 }}>
              <PrimaryButton label="Uygulamaya gir" onPress={submitProfile} />
              <Text style={{ color: c.muted, textAlign: 'center', marginTop: 10, fontSize: 12 }}>
                Profilini sonra Ayarlar’dan güncelleyebilirsin.
              </Text>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F4F8' }} edges={['top', 'bottom']}>
      <View style={{ flex: 1, paddingHorizontal: 22, paddingBottom: 20 }}>
        <Animated.View entering={FadeIn.duration(300)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Image source={require('../assets/images/icon.png')} style={{ width: 36, height: 36, borderRadius: 12 }} />
            <Text style={{ color: c.accent, fontWeight: '900', fontSize: 20 }}>UniMan</Text>
          </View>
          <Pressable onPress={skipIntro} hitSlop={10}>
            <Text style={{ color: c.muted, fontWeight: '700' }}>Atla</Text>
          </Pressable>
        </Animated.View>

        {step === 0 ? (
          <Animated.View entering={FadeInDown.duration(400)} style={{ flexWrap: 'wrap', flexDirection: 'row', gap: 8, marginTop: 16, justifyContent: 'center' }}>
            {HASHTAGS.map((tag, i) => (
              <EduHashtagChip key={tag} label={tag} dark={i % 3 === 0} />
            ))}
          </Animated.View>
        ) : null}

        <Animated.View
          key={step}
          entering={SlideInRight.duration(320).springify()}
          exiting={SlideOutLeft.duration(220)}
          style={{ flex: 1, justifyContent: 'center', gap: 16 }}>
          <View style={{ alignItems: 'center', minHeight: width * 0.45, justifyContent: 'center' }}>
            <FloatingOrb size={100} color={`${current.accent}22`} top={20} left={width * 0.1} delay={0} />
            <FloatingOrb size={60} color={`${current.accent}18`} top={60} left={width * 0.65} delay={150} />
            <FauxGradient
              colors={[current.accent, '#E879F9']}
              style={{ borderRadius: 28, padding: 24, width: width * 0.72, alignItems: 'center' }}>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontWeight: '800', fontSize: 13, marginBottom: 8 }}>
                {current.headline}
              </Text>
              <Text style={{ fontSize: 56 }}>🎓</Text>
            </FauxGradient>
          </View>

          <Animated.Text entering={FadeInDown.delay(80)} style={{ color: c.text, fontSize: 26, fontWeight: '900', textAlign: 'center', lineHeight: 32, letterSpacing: -0.5 }}>
            {current.title}
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(120)} style={{ color: c.muted, fontSize: 15, lineHeight: 22, textAlign: 'center', paddingHorizontal: 12 }}>
            {current.body}
          </Animated.Text>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 }}>
            {STEPS.map((_, index) => (
              <View
                key={index}
                style={{
                  width: index === step ? 22 : 8,
                  height: 8,
                  borderRadius: 99,
                  backgroundColor: index === step ? current.accent : c.line,
                }}
              />
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(180)}>
          <PrimaryButton
            label={step === STEPS.length - 1 ? 'Devam et' : step === 2 ? 'İzni sor ve devam' : 'Devam'}
            onPress={finishIntro}
          />
          {step === 0 ? (
            <Text style={{ color: c.muted, textAlign: 'center', marginTop: 10, fontSize: 12 }}>
              Tanıtım bittikten sonra kısa bir profil formu gelir.
            </Text>
          ) : null}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
