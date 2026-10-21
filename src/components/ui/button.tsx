import { Pressable, type PressableProps, type ViewStyle } from 'react-native';

import { useTheme, type ThemeColors } from '@/theme';

import { Text, type TextProps } from './text';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

const variantColors: Record<
  ButtonVariant,
  { bg: keyof ThemeColors | null; pressed: keyof ThemeColors; tone: TextProps['tone'] }
> = {
  primary: { bg: 'accent', pressed: 'accentPressed', tone: 'onAccent' },
  secondary: { bg: 'secondaryBg', pressed: 'border', tone: 'secondary' },
  ghost: { bg: null, pressed: 'accentSoft', tone: 'accent' },
};

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  variant?: ButtonVariant;
  style?: ViewStyle;
};

export function Button({ title, variant = 'primary', disabled, style, ...rest }: ButtonProps) {
  const { colors, radii, spacing } = useTheme();
  const v = variantColors[variant];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        {
          minHeight: 48,
          paddingHorizontal: spacing.xl,
          borderRadius: radii.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed ? colors[v.pressed] : v.bg ? colors[v.bg] : 'transparent',
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
      {...rest}
    >
      <Text variant="label" tone={v.tone}>
        {title}
      </Text>
    </Pressable>
  );
}
