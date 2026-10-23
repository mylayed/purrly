import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme';

import { BlinkingCat } from './blinking-cat';
import { Text } from './text';

type EmptyStateProps = {
  // Іконка розділу (≈22 px) — у значку біля кота.
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  const { colors, radii, spacing } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md }}>
      <View style={{ marginBottom: spacing.sm }}>
        <BlinkingCat />
        {icon && (
          <View
            style={{
              position: 'absolute',
              right: -6,
              bottom: -4,
              width: 44,
              height: 44,
              borderRadius: radii.pill,
              borderWidth: 3,
              borderColor: colors.bg,
              backgroundColor: colors.card,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </View>
        )}
      </View>
      <Text variant="heading" style={{ textAlign: 'center' }}>
        {title}
      </Text>
      {body && (
        <Text tone="muted" style={{ textAlign: 'center', maxWidth: 320 }}>
          {body}
        </Text>
      )}
      {action}
    </View>
  );
}
