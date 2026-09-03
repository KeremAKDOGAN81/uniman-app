import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Card, Muted, Screen, Title, useColors } from '@/components/ui';

export default function PrivacyScreen() {
  const c = useColors();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <Screen>
        <ScrollView contentContainerStyle={{ paddingBottom: 36, gap: 12 }} showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title>Gizlilik</Title>
            <Pressable onPress={() => router.back()}>
              <Text style={{ color: c.blue, fontWeight: '700' }}>Kapat</Text>
            </Pressable>
          </View>

          <Card style={{ gap: 10 }}>
            <Text style={{ color: c.text, fontWeight: '800', fontSize: 16 }}>Veriler nerede?</Text>
            <Muted>
              UniMan verilerinizi yalnızca bu cihazda, yerel SQLite veritabanında saklar. Hesap oluşturmaz,
              buluta senkronize etmez.
            </Muted>
          </Card>

          <Card style={{ gap: 10 }}>
            <Text style={{ color: c.text, fontWeight: '800', fontSize: 16 }}>Bildirimler</Text>
            <Muted>
              Ders ve sınav hatırlatmaları cihazınızda yerel olarak zamanlanır. Bildirim içeriği sunucuya
              gönderilmez.
            </Muted>
          </Card>

          <Card style={{ gap: 10 }}>
            <Text style={{ color: c.text, fontWeight: '800', fontSize: 16 }}>Yedekleme</Text>
            <Muted>
              Dışa / içe aktarma tamamen sizin kontrolünüzdedir. Yedek dosyasını paylaşmak veya silmek size
              aittir.
            </Muted>
          </Card>

          <Card style={{ gap: 10 }}>
            <Text style={{ color: c.text, fontWeight: '800', fontSize: 16 }}>İletişim</Text>
            <Muted>Sorularınız için GitHub Issues: github.com/KeremAKDOGAN81/uniman-app</Muted>
          </Card>
        </ScrollView>
      </Screen>
    </SafeAreaView>
  );
}
