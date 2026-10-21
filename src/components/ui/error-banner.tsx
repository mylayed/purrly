import { View } from 'react-native';

import { useTheme } from '@/theme';

import { Text } from './text';

export function ErrorBanner({ message }: { message: string }) {
  const { colors, radii, spacing } = useTheme();
  return (
    <View
      accessibilityRole="alert"
      style={{ backgroundColor: colors.dangerBg, borderRadius: radii.md, padding: spacing.md }}
    >
      <Text tone="danger">{message}</Text>
    </View>
  );
}
