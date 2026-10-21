import { View } from 'react-native';

import { BadgeAlertIcon } from '@/components/icons';
import { useTheme } from '@/theme';

import { Text } from './text';

type StatusBannerProps = {
  tone: 'warning' | 'danger';
  message: string;
};

// Статус ніколи не передається лише кольором: іконка + текст (правило dataviz).
export function StatusBanner({ tone, message }: StatusBannerProps) {
  const { colors, radii, spacing } = useTheme();
  const palette =
    tone === 'danger'
      ? { bg: colors.dangerBg, fg: colors.dangerText }
      : { bg: colors.warningBg, fg: colors.warningText };

  return (
    <View
      accessibilityRole="alert"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: palette.bg,
        borderRadius: radii.md,
        padding: spacing.md,
      }}
    >
      <BadgeAlertIcon size={22} color={palette.fg} autoPlay />
      <Text tone={tone} style={{ flex: 1 }}>
        {message}
      </Text>
    </View>
  );
}
