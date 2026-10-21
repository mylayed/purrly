import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

export default function CatLayout() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
  );
}
