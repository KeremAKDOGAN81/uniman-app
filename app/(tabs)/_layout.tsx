import { Tabs } from 'expo-router';

import { useColors } from '@/components/ui';

export default function TabLayout() {
  const c = useColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
        sceneStyle: { backgroundColor: c.bg },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Ana Sayfa' }} />
      <Tabs.Screen name="schedule" options={{ title: 'Program' }} />
      <Tabs.Screen name="calculator" options={{ title: 'Hesap' }} />
      <Tabs.Screen name="grades" options={{ href: null }} />
      <Tabs.Screen name="notes" options={{ title: 'Notlar' }} />
      <Tabs.Screen name="track" options={{ title: 'Takip' }} />
    </Tabs>
  );
}
