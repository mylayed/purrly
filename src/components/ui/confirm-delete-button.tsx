import { useState } from 'react';
import { Pressable } from 'react-native';

import { DeleteIcon } from '@/components/icons';
import { useTheme } from '@/theme';

import { Text } from './text';

type ConfirmDeleteButtonProps = {
  label: string;
  confirmLabel: string;
  onConfirm: () => void;
};

// Видалення в два натискання, без системного діалогу (його немає в web).
export function ConfirmDeleteButton({ label, confirmLabel, onConfirm }: ConfirmDeleteButtonProps) {
  const { colors, radii, spacing } = useTheme();
  const [confirming, setConfirming] = useState(false);
  const [presses, setPresses] = useState(0);

  return confirming ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onConfirm}
      hitSlop={8}
      style={{
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: radii.pill,
        backgroundColor: colors.dangerBg,
      }}
    >
      <Text variant="caption" tone="danger">
        {confirmLabel}
      </Text>
    </Pressable>
  ) : (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPressIn={() => setPresses((n) => n + 1)}
      onPress={() => setConfirming(true)}
      hitSlop={12}
    >
      <DeleteIcon size={20} color={colors.textMuted} trigger={presses} />
    </Pressable>
  );
}
