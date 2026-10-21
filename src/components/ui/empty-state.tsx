import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme';

import { Text } from './text';

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  const { colors, radii, spacing } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md }}>
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: radii.pill,
          backgroundColor: colors.accentSoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.sm,
        }}
      >
        {icon}
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
