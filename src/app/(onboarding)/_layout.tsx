import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

// «Познайомся з котом» — відкрито й до входу: квіз і картка для шерингу без реєстрації.
export default function OnboardingLayout() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
  );
}
