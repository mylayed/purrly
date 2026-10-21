import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme, type ThemeColors, type TypographyVariant } from '@/theme';

type TextTone = 'default' | 'muted' | 'accent' | 'onAccent' | 'secondary' | 'warning' | 'danger';

const toneColor: Record<TextTone, keyof ThemeColors> = {
  default: 'text',
  muted: 'textMuted',
  accent: 'accentText',
  onAccent: 'onAccent',
  secondary: 'secondaryText',
  warning: 'warningText',
  danger: 'dangerText',
};

export type TextProps = RNTextProps & {
  variant?: TypographyVariant;
  tone?: TextTone;
};

export function Text({ variant = 'body', tone = 'default', style, ...rest }: TextProps) {
  const { colors, typography } = useTheme();
  return (
    <RNText style={[typography[variant], { color: colors[toneColor[tone]] }, style]} {...rest} />
  );
}
