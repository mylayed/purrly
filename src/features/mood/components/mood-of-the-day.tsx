import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card, Text } from '@/components/ui';
import type { FeedItem } from '@/features/feed/api';
import { localDayKey } from '@/lib/feeding';
import { useTheme } from '@/theme';

import { isMood } from '../api';
import { MOOD_EMOJI } from './mood-emoji';
import { ShareMoodButton } from './share-mood-button';

type PhotoItem = Extract<FeedItem, { kind: 'photo' }>;

// «Настрій дня»: найсвіжіше фото за сьогодні, для якого вже є AI-настрій.
export function MoodOfTheDay({
  items,
  catName,
}: {
  items: FeedItem[];
  catName: (catId: string) => string | null;
}) {
  const { t } = useTranslation();
  const { radii, spacing } = useTheme();

  const today = localDayKey(new Date());
  const photo = items.find(
    (item): item is PhotoItem =>
      item.kind === 'photo' && isMood(item.photo.mood) && localDayKey(new Date(item.at)) === today,
  );

  if (!photo || !isMood(photo.photo.mood)) {
    return (
      <Card style={{ gap: spacing.xs }}>
        <Text variant="heading">{t('mood.ofTheDay')}</Text>
        <Text tone="muted">{t('mood.ofTheDayEmpty')}</Text>
      </Card>
    );
  }

  const mood = photo.photo.mood;
  const name = catName(photo.catId);
  return (
    <Card style={{ gap: spacing.md }}>
      <Text variant="heading">
        {name ? t('mood.ofTheDayFor', { cat: name }) : t('mood.ofTheDay')}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        {photo.url && (
          <Image
            source={{ uri: photo.url, cacheKey: photo.photo.storage_path }}
            style={{ width: 72, height: 72, borderRadius: radii.md }}
            contentFit="cover"
          />
        )}
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="title" tone="accent">
            {MOOD_EMOJI[mood]} {t(`mood.moods.${mood}`)}
          </Text>
          {photo.photo.mood_caption ? (
            <Text numberOfLines={3}>{photo.photo.mood_caption}</Text>
          ) : null}
        </View>
      </View>
      <ShareMoodButton item={photo} mood={mood} />
    </Card>
  );
}
