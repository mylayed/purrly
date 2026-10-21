import * as SystemUI from 'expo-system-ui';
import { createContext, use, useEffect, type ReactNode } from 'react';
import { Appearance, Platform, useColorScheme } from 'react-native';

import { useThemeStore, type ThemePreference } from '@/stores/theme-store';

import { colors, type ColorScheme, type ThemeColors } from './colors';
import { radii, spacing, typography } from './tokens';

export type Theme = {
  scheme: ColorScheme;
  colors: ThemeColors;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);
  const systemScheme = useColorScheme();

  const scheme: ColorScheme =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  // Нативні елементи (алерти, пікери, клавіатура) теж ідуть за вибором користувача.
  // У react-native-web цього API немає.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
  }, [preference]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors[scheme].bg);
  }, [scheme]);

  const theme: Theme = {
    scheme,
    colors: colors[scheme],
    spacing,
    radii,
    typography,
    preference,
    setPreference,
  };

  return <ThemeContext value={theme}>{children}</ThemeContext>;
}

export function useTheme(): Theme {
  const theme = use(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return theme;
}
