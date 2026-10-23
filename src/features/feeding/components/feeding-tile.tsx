import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import { UtensilsIcon } from '@/components/icons';
import { Button, ProfileTile, Text } from '@/components/ui';
import { useTheme } from '@/theme';

import { useFeedingFormat } from '../use-feeding-format';
import { useFeedingToday } from '../use-feeding-today';
import { SlotDots } from './slot-dots';

// Плитка на профілі кота: годування на сьогодні й наступне за графіком.
export function FeedingTile({ catId }: { catId: string }) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const today = useFeedingToday(catId);
  const fmt = useFeedingFormat();

  const open = () => router.push({ pathname: '/cat/[id]/feeding', params: { id: catId } });
  const openSchedule = () =>
    router.push({ pathname: '/cat/[id]/feeding/schedule', params: { id: catId } });
  const done = today.slots.filter((s) => today.mealBySlot.has(s.id)).length;
  const hasAnything = today.schedule.length > 0 || today.allMeals.length > 0;
  // Порожня плитка має власну кнопку, тож сама не натискається.
  const isEmpty = !today.isPending && !hasAnything;

  return (
    <ProfileTile title={t('feeding.title')} onPress={isEmpty ? undefined : open}>
      {today.isPending ? (
        <ActivityIndicator color={colors.accent} />
      ) : hasAnything ? (
        <View style={{ gap: spacing.xs }}>
          {today.slots.length > 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Text variant="title">
                {t('feeding.progress', { done, total: today.slots.length })}
              </Text>
              <SlotDots done={done} total={today.slots.length} />
            </View>
          ) : (
            <Text variant="title">{t('feeding.mealsToday', { count: today.meals.length })}</Text>
          )}
          <Text tone="muted">
            {today.next
              ? t('feeding.nextAt', {
                  time: fmt.time(today.next.time_of_day),
                  portion: fmt.portion(today.next, today.foods),
                })
              : today.slots.length > 0
                ? t('feeding.allDone')
                : today.eatenGrams > 0
                  ? t('feeding.eatenToday', { value: fmt.grams(today.eatenGrams) })
                  : t('feeding.noScheduleToday')}
          </Text>
        </View>
      ) : (
        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <UtensilsIcon size={28} color={colors.accent} strokeWidth={1.75} />
            <Text tone="muted" style={{ flex: 1 }}>
              {t('feeding.emptyBody')}
            </Text>
          </View>
          <Button title={t('feeding.setupSchedule')} variant="secondary" onPress={openSchedule} />
        </View>
      )}
    </ProfileTile>
  );
}
