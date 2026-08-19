import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { palettes } from '@/constants/theme';
import { configureNotifications } from '@/lib/notifications';
import { useAppStore } from '@/store/useAppStore';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const ready = useAppStore((state) => state.ready);
  const theme = useAppStore((state) => state.theme);
  const hydrate = useAppStore((state) => state.hydrate);
  const c = palettes[theme];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await configureNotifications();
      await hydrate();
      if (!cancelled) {
        await SplashScreen.hideAsync();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrate]);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: palettes.light.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={palettes.light.accent} />
      </View>
    );
  }

  const navTheme = {
    ...(theme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: c.bg,
      card: c.bg,
      text: c.text,
      border: c.line,
      primary: c.accent,
    },
  };

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  );
}
