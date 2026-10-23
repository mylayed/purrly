import { Image } from 'expo-image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, ShareSheet, Text } from '@/components/ui';
import type { FeedItem } from '@/features/feed/api';
import { useTheme } from '@/theme';

import type { Mood } from '../api';
import { MOOD_EMOJI } from './mood-emoji';

// «Поділитися»: картка для сторіз з фото, настроєм і AI-підписом.
export function ShareMoodButton({
  item,
  mood,
}: {
  item: Extract<FeedItem, { kind: 'photo' }>;
  mood: Mood;
}) {
  const { t } = useTranslation();
  const { radii, spacing } = useTheme();
  const [open, setOpen] = useState(false);
  const caption = item.photo.mood_caption ?? '';
  const label = `${MOOD_EMOJI[mood]} ${t('mood.label', { mood: t(`mood.moods.${mood}`) })}`;

  return (
    <>
      <Button title={t('share.share')} variant="ghost" onPress={() => setOpen(true)} />
      <ShareSheet
        visible={open}
        onClose={() => setOpen(false)}
        text={[label, caption].filter(Boolean).join('\n')}
      >
        {item.url && (
          <Image
            source={{ uri: item.url, cacheKey: item.photo.storage_path }}
            style={{ width: '100%', aspectRatio: 1, borderRadius: radii.md }}
            contentFit="cover"
          />
        )}
        <View style={{ gap: spacing.sm }}>
          <Text variant="title" tone="accent" style={{ textAlign: 'center' }}>
            {label}
          </Text>
          {caption ? (
            <Text variant="bodyStrong" style={{ textAlign: 'center' }}>
              {caption}
            </Text>
          ) : null}
        </View>
      </ShareSheet>
    </>
  );
}
