import { Switch } from 'react-native';

import { useTheme } from '@/theme';

type ToggleProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel: string;
  disabled?: boolean;
};

// Перемикач у кольорах теми.
export function Toggle({ value, onValueChange, accessibilityLabel, disabled }: ToggleProps) {
  const { colors } = useTheme();
  return (
    <Switch
      accessibilityLabel={accessibilityLabel}
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: colors.border, true: colors.accent }}
      thumbColor={colors.card}
      ios_backgroundColor={colors.border}
      // react-native-web бере колір увімкненого повзунка лише з activeThumbColor,
      // якого немає в типах React Native.
      {...({ activeThumbColor: colors.card } as object)}
    />
  );
}
