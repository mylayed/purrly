import { View } from 'react-native';

import { Text } from '@/components/ui';
import type { DueStatus } from '@/lib/vet';
import { useTheme } from '@/theme';

import { useVetFormat } from '../use-vet-format';

// «Через 12 днів» / «Прострочено на 3 дні». Статус завжди словами, колір — лише підсилення.
export function DueBadge({ days, status }: { days: number; status: DueStatus }) {
  const { colors, radii, spacing } = useTheme();
  const fmt = useVetFormat();
  const tone = fmt.tone(status);
  const bg = tone === 'danger' ? colors.dangerBg : tone === 'warning' ? colors.warningBg : null;

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: bg ? spacing.sm : 0,
        paddingVertical: bg ? 2 : 0,
        borderRadius: radii.pill,
        backgroundColor: bg ?? 'transparent',
      }}
    >
      <Text variant="caption" tone={tone ?? 'muted'}>
        {fmt.due(days)}
      </Text>
    </View>
  );
}
