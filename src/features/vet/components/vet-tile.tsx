import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import { StethoscopeIcon } from '@/components/icons';
import { Button, ProfileTile, Text } from '@/components/ui';
import { upcomingDue } from '@/lib/vet';
import { useTheme } from '@/theme';

import { useVetEvents } from '../api';
import { useVetFormat } from '../use-vet-format';
import { DueBadge } from './due-badge';

const TILE_ITEMS = 2;

// Плитка на профілі кота: найближчі щеплення й обробки.
export function VetTile({ catId }: { catId: string }) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const { data: events, isPending } = useVetEvents(catId);
  const fmt = useVetFormat();

  const open = () => router.push({ pathname: '/cat/[id]/vet', params: { id: catId } });
  const upcoming = upcomingDue(events ?? []).slice(0, TILE_ITEMS);
  // Порожня плитка має власну кнопку, тож сама не натискається.
  const isEmpty = !isPending && (events ?? []).length === 0;

  return (
    <ProfileTile title={t('vet.title')} onPress={isEmpty ? undefined : open}>
      {isPending ? (
        <ActivityIndicator color={colors.accent} />
      ) : isEmpty ? (
        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <StethoscopeIcon size={28} color={colors.accent} strokeWidth={1.75} />
            <Text tone="muted" style={{ flex: 1 }}>
              {t('vet.emptyBody')}
            </Text>
          </View>
          <Button title={t('vet.add')} variant="secondary" onPress={open} />
        </View>
      ) : upcoming.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          {upcoming.map(({ event, days, status }) => (
            <View key={event.id} style={{ gap: 2 }}>
              <Text variant="bodyStrong" numberOfLines={1}>
                {fmt.title(event)}
              </Text>
              <DueBadge days={days} status={status} />
            </View>
          ))}
        </View>
      ) : (
        <Text tone="muted">{t('vet.lastRecord', { date: fmt.date(events![0]!.occurred_on) })}</Text>
      )}
    </ProfileTile>
  );
}
