import { Pressable, type PressableProps } from 'react-native';

import { useTheme } from '@/theme';

import { Text } from './text';

type ChipProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  selected?: boolean;
};

// Пілюля для вибору: корм, дні тижня. Вибір видно і кольором, і станом для читачів екрана.
export function Chip({ label, selected = false, ...rest }: ChipProps) {
  const { colors, radii, spacing } = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => ({
        minHeight: 40,
        minWidth: 44,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radii.pill,
        borderWidth: 1.5,
        borderColor: selected ? colors.accent : colors.border,
        backgroundColor: selected ? colors.accent : pressed ? colors.accentSoft : colors.card,
      })}
      {...rest}
    >
      <Text variant="label" tone={selected ? 'onAccent' : 'default'}>
        {label}
      </Text>
    </Pressable>
  );
}
