import { useEffect, useEffectEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import { Button, ErrorBanner, Text } from '@/components/ui';
import type { FeedItem } from '@/features/feed/api';
import { useTheme } from '@/theme';

import { isMood, MoodError, useMoodOfPhoto } from '../api';
import { MOOD_EMOJI } from './mood-emoji';
import { ShareMoodButton } from './share-mood-button';

type PhotoItem = Extract<FeedItem, { kind: 'photo' }>;

// AI-настрій під фото: кнопка «Дізнатися настрій» або вже готовий настрій з підписом.
// autoStart — для першого фото: настрій з'являється сам, без натискання.
export function MoodPanel({ item, autoStart = false }: { item: PhotoItem; autoStart?: boolean }) {
  const { t, i18n } = useTranslation();
  const { colors, radii, spacing } = useTheme();
  const moodOfPhoto = useMoodOfPhoto();
  const { mutate } = moodOfPhoto;
  // Стан беремо з останньої відповіді сервера.
  const noCat = moodOfPhoto.data?.hasCat === false;
  const remaining = moodOfPhoto.data?.remaining ?? null;

  const mood = isMood(item.photo.mood) ? item.photo.mood : null;
  const start = () => mutate(item.id);

  const autoRun = useEffectEvent(() => {
    if (!mood && moodOfPhoto.isIdle) mutate(item.id);
  });
  useEffect(() => {
    if (autoStart) autoRun();
  }, [autoStart]);

  if (mood) {
    return (
      <View
        style={{
          gap: spacing.sm,
          padding: spacing.md,
          borderRadius: radii.md,
          backgroundColor: colors.accentSoft,
        }}
      >
        <Text variant="label" tone="accent">
          {MOOD_EMOJI[mood]} {t('mood.label', { mood: t(`mood.moods.${mood}`) })}
        </Text>
        {item.photo.mood_caption ? <Text selectable>{item.photo.mood_caption}</Text> : null}
        <ShareMoodButton item={item} mood={mood} />
        {remaining !== null && (
          <Text variant="caption" tone="muted">
            {t('mood.remaining', { count: remaining })}
          </Text>
        )}
      </View>
    );
  }

  const error = moodOfPhoto.error;
  const errorMessage =
    error instanceof MoodError
      ? error.code === 'limit'
        ? t('mood.errors.limit', {
            date: error.resetsAt
              ? new Intl.DateTimeFormat(i18n.language, {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                }).format(new Date(error.resetsAt))
              : '',
          })
        : t(`mood.errors.${error.code}`)
      : error
        ? t('mood.errors.failed')
        : null;

  return (
    <View style={{ gap: spacing.sm }}>
      {moodOfPhoto.isPending ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <ActivityIndicator color={colors.accent} />
          <Text tone="muted">{t('mood.reading')}</Text>
        </View>
      ) : noCat ? (
        <Text tone="muted">{t('mood.noCat')}</Text>
      ) : (
        <Button title={t('mood.find')} variant="secondary" onPress={start} />
      )}
      {errorMessage && <ErrorBanner message={errorMessage} />}
    </View>
  );
}
