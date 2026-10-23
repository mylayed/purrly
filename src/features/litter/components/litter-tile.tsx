import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import { Button, ProfileTile, Text } from '@/components/ui';
import { lastOf, litterDays } from '@/lib/litter';
import { useTheme } from '@/theme';

import { useLitterEvents } from '../api';
import { useLitterFormat } from '../use-litter-format';
import { LitterButtons } from './litter-buttons';

// Плитка на профілі кота: позначка лотка одним дотиком, не відкриваючи окремий екран.
// Сама плитка не натискається (у ній кнопки), тож історія — окремою кнопкою.
export function LitterTile({ catId }: { catId: string }) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const { data: events, isPending } = useLitterEvents(catId);
  const fmt = useLitterFormat();

  const today = litterDays(events ?? [])[0]!;
  const lastPoop = lastOf(events ?? [], 'poop');

  return (
    <ProfileTile title={t('litter.title')}>
      {isPending ? (
        <ActivityIndicator color={colors.accent} />
      ) : (
        <View style={{ gap: spacing.md }}>
          <View style={{ gap: 2 }}>
            <Text tone={today.pee + today.poop > 0 ? 'default' : 'muted'}>
              {today.pee + today.poop > 0
                ? t('litter.todaySummary', { pee: today.pee, poop: today.poop })
                : t('litter.emptyBody')}
            </Text>
            {lastPoop && (
              <Text variant="caption" tone="muted">
                {t('litter.lastPoop', { when: fmt.ago(lastPoop.occurred_at) })}
              </Text>
            )}
          </View>
          <LitterButtons catId={catId} />
          {(events ?? []).length > 0 && (
            <Button
              title={t('litter.history')}
              variant="ghost"
              onPress={() => router.push({ pathname: '/cat/[id]/litter', params: { id: catId } })}
            />
          )}
        </View>
      )}
    </ProfileTile>
  );
}
