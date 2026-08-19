import { Link, Stack } from 'expo-router';
import { Text } from 'react-native';

import { Screen, useColors } from '@/components/ui';

export default function NotFoundScreen() {
  const c = useColors();
  return (
    <>
      <Stack.Screen options={{ title: 'Bulunamadı' }} />
      <Screen style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>Bu ekran yok.</Text>
        <Link href="/" style={{ marginTop: 16, paddingVertical: 12 }}>
          <Text style={{ color: c.accent, fontSize: 16, fontWeight: '600' }}>Ana sayfaya dön</Text>
        </Link>
      </Screen>
    </>
  );
}
