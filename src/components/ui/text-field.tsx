import { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '@/theme';

import { Text } from './text';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string | null;
  hint?: string;
};

export function TextField({ label, error, hint, onFocus, onBlur, ...rest }: TextFieldProps) {
  const { colors, radii, spacing, typography } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? colors.danger : focused ? colors.accent : colors.border;

  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="label">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.accent}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          typography.body,
          {
            minHeight: 48,
            paddingHorizontal: spacing.lg,
            borderRadius: radii.md,
            borderWidth: 1.5,
            borderColor,
            backgroundColor: colors.card,
            color: colors.text,
          },
        ]}
        {...rest}
      />
      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
