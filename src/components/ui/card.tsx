import { View, type ViewProps } from 'react-native';

import { useTheme } from '@/theme';

// Глибина через відтінок фону, без тіней.
export function Card({ style, ...rest }: ViewProps) {
  const { colors, radii, spacing } = useTheme();
  return (
    <View
      style={[{ backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.lg }, style]}
      {...rest}
    />
  );
}
