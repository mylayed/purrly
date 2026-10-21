import '@/i18n';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { useAuthDeepLink } from '@/features/auth';
import { useLanguageSync } from '@/i18n/use-language-sync';
import { useLanguageStore } from '@/stores/language-store';
import { startSessionSync, useSessionStore } from '@/stores/session-store';
import { useThemeStore } from '@/stores/theme-store';
import { fontAssets, ThemeProvider, useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const themeHydrated = useThemeStore((s) => s.hydrated);
  const languageHydrated = useLanguageStore((s) => s.hydrated);
  const sessionInitialized = useSessionStore((s) => s.initialized);
  const ready =
    (fontsLoaded || fontError !== null) && themeHydrated && languageHydrated && sessionInitialized;

  useLanguageSync();
  useAuthDeepLink();
  useEffect(() => startSessionSync(), []);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <ThemeProvider>
      <RootStack />
    </ThemeProvider>
  );
}

function RootStack() {
  const { scheme, colors } = useTheme();
  const signedIn = useSessionStore((s) => s.session !== null);
  // Увійшов за посиланням «відновити пароль» — спершу новий пароль, потім застосунок.
  const recovering = useSessionStore((s) => s.session !== null && s.passwordRecovery);
  const home = recovering ? '/reset-password' : '/';

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Protected guard={signedIn && !recovering} redirectTo={signedIn ? home : '/sign-in'}>
          <Stack.Screen name="index" />
        </Stack.Protected>
        <Stack.Protected guard={recovering} redirectTo={signedIn ? '/' : '/sign-in'}>
          <Stack.Screen name="reset-password" />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn} redirectTo={home}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}
