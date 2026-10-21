import '@/i18n';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { useLanguageSync } from '@/i18n/use-language-sync';
import { useLanguageStore } from '@/stores/language-store';
import { useThemeStore } from '@/stores/theme-store';
import { fontAssets, ThemeProvider, useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const themeHydrated = useThemeStore((s) => s.hydrated);
  const languageHydrated = useLanguageStore((s) => s.hydrated);
  const ready = (fontsLoaded || fontError !== null) && themeHydrated && languageHydrated;

  useLanguageSync();

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
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
    </>
  );
}
