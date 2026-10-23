import { useState } from 'react';
import { Pressable } from 'react-native';

import { PlusIcon } from '@/components/icons';
import { useTheme } from '@/theme';

import { Text } from './text';

// Головна дія списку: персикова пілюля з «плюсом», що повертається при натисканні.
export function AddButton({ title, onPress }: { title: string; onPress: () => void }) {
  const { colors, spacing } = useTheme();
  const [presses, setPresses] = useState(0);

  return (
    <Pressable
      accessibilityRole="button"
      onPressIn={() => setPresses((n) => n + 1)}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        minHeight: 48,
        borderRadius: 999,
        backgroundColor: pressed ? colors.accentPressed : colors.accent,
      })}
    >
      <PlusIcon size={18} color={colors.onAccent} strokeWidth={2.5} trigger={presses} />
      <Text variant="label" tone="onAccent">
        {title}
      </Text>
    </Pressable>
  );
}
