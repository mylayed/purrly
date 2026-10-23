import { randomUUID } from 'expo-crypto';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { CheckIcon } from '@/components/icons';
import { ErrorBanner, Text } from '@/components/ui';
import { LITTER_KINDS } from '@/lib/litter';
import { useTheme } from '@/theme';

import { useAddLitter, useDeleteLitter, useLitterEvents, type LitterKind } from '../api';

// Три кнопки «Сеча / Стілець / Обидва»: позначка одним дотиком і «Скасувати» для щойно доданої.
export function LitterButtons({ catId }: { catId: string }) {
  const { t, i18n } = useTranslation();
  const { colors, radii, spacing } = useTheme();
  const { data: events } = useLitterEvents(catId);
  const addLitter = useAddLitter(catId);
  const deleteLitter = useDeleteLitter(catId);
  const [lastId, setLastId] = useState<string | null>(null);
  const [presses, setPresses] = useState<Record<LitterKind, number>>({ pee: 0, poop: 0, both: 0 });

  const last = lastId ? events?.find((e) => e.id === lastId) : undefined;

  function mark(kind: LitterKind) {
    const id = randomUUID();
    setLastId(id);
    setPresses((p) => ({ ...p, [kind]: p[kind] + 1 }));
    addLitter.mutate({ id, kind, occurredAt: new Date().toISOString() });
  }

  function undo() {
    if (!last) return;
    deleteLitter.mutate(last.id);
    setLastId(null);
  }

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {LITTER_KINDS.map((kind) => (
          <Pressable
            key={kind}
            accessibilityRole="button"
            accessibilityLabel={t('litter.markA11y', { kind: t(`litter.kinds.${kind}`) })}
            onPress={() => mark(kind)}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 48,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.xs,
              paddingHorizontal: spacing.sm,
              borderRadius: radii.pill,
              backgroundColor: pressed ? colors.border : colors.secondaryBg,
            })}
          >
            {presses[kind] > 0 && last?.kind === kind && (
              <CheckIcon
                size={16}
                color={colors.secondaryText}
                strokeWidth={2.5}
                trigger={presses[kind]}
              />
            )}
            <Text variant="label" tone="secondary" numberOfLines={1}>
              {t(`litter.kinds.${kind}`)}
            </Text>
          </Pressable>
        ))}
      </View>
      {last && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text variant="caption" tone="muted" style={{ flex: 1 }}>
            {t('litter.marked', {
              kind: t(`litter.kinds.${last.kind}`),
              time: new Intl.DateTimeFormat(i18n.language, {
                hour: 'numeric',
                minute: '2-digit',
              }).format(new Date(last.occurred_at)),
            })}
          </Text>
          <Pressable accessibilityRole="button" onPress={undo} hitSlop={8}>
            <Text variant="caption" tone="accent">
              {t('litter.undo')}
            </Text>
          </Pressable>
        </View>
      )}
      {addLitter.isError && <ErrorBanner message={t('litter.saveError')} />}
    </View>
  );
}
