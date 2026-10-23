import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import { GalleryThumbnailsIcon } from '@/components/icons';
import { AddButton, Button, Chip, EmptyState, ErrorBanner, Screen, Text } from '@/components/ui';
import { useCats } from '@/features/cats/api';
import { useFeed, type FeedItem } from '@/features/feed/api';
import { Composer } from '@/features/feed/components/composer';
import { FeedCard } from '@/features/feed/components/feed-card';
import { useFeedingFormat } from '@/features/feeding/use-feeding-format';
import { MoodOfTheDay } from '@/features/mood/components/mood-of-the-day';
import { localDayKey } from '@/lib/feeding';
import { useTheme } from '@/theme';

export default function Feed() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const { data: cats, isPending: catsPending } = useCats();
  // null — усі коти.
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  // Перше фото користувача: його AI-настрій показуємо одразу («вау» за кілька секунд).
  const [autoMoodPhotoId, setAutoMoodPhotoId] = useState<string | null>(null);
  const feed = useFeed(catFilter);
  const fmt = useFeedingFormat();

  const activeCats = (cats ?? []).filter((c) => !c.archived_at);
  const catNames = new Map((cats ?? []).map((c) => [c.id, c.name]));
  const showCatNames = (cats ?? []).length > 1 && catFilter === null;

  const days = new Map<string, FeedItem[]>();
  for (const item of feed.data ?? []) {
    const key = localDayKey(new Date(item.at));
    days.set(key, [...(days.get(key) ?? []), item]);
  }

  if (!catsPending && activeCats.length === 0) {
    return (
      <Screen>
        <Text variant="title">{t('tabs.feed')}</Text>
        <EmptyState
          icon={<GalleryThumbnailsIcon size={22} color={colors.accent} strokeWidth={2} autoPlay />}
          title={t('feed.emptyTitle')}
          body={t('feed.noCatsBody')}
          action={<Button title={t('cats.add')} onPress={() => router.push('/cat/new')} />}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Text variant="title">{t('tabs.feed')}</Text>

      {activeCats.length > 1 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <Chip
            label={t('feed.allCats')}
            selected={catFilter === null}
            onPress={() => setCatFilter(null)}
          />
          {activeCats.map((cat) => (
            <Chip
              key={cat.id}
              label={cat.name}
              selected={catFilter === cat.id}
              onPress={() => setCatFilter(cat.id)}
            />
          ))}
        </View>
      )}

      {feed.data && (
        <MoodOfTheDay
          items={feed.data}
          catName={(id) => (activeCats.length > 1 ? (catNames.get(id) ?? null) : null)}
        />
      )}

      {composing ? (
        <Composer
          cats={activeCats}
          defaultCatId={catFilter ?? activeCats[0]!.id}
          onDone={(firstPhotoId) => {
            setComposing(false);
            if (firstPhotoId) setAutoMoodPhotoId(firstPhotoId);
          }}
        />
      ) : (
        activeCats.length > 0 && (
          <AddButton title={t('feed.add')} onPress={() => setComposing(true)} />
        )
      )}

      {catsPending || feed.isPending ? (
        <ActivityIndicator color={colors.accent} />
      ) : feed.isError ? (
        <>
          <ErrorBanner message={t('feed.loadError')} />
          <Button title={t('cats.retry')} variant="secondary" onPress={() => feed.refetch()} />
        </>
      ) : days.size === 0 ? (
        !composing && (
          <View style={{ minHeight: 280 }}>
            <EmptyState
              icon={
                <GalleryThumbnailsIcon size={22} color={colors.accent} strokeWidth={2} autoPlay />
              }
              title={t('feed.emptyTitle')}
              body={t('feed.emptyBody')}
            />
          </View>
        )
      ) : (
        [...days.entries()].map(([key, items]) => (
          <View key={key} style={{ gap: spacing.md }}>
            <Text variant="label" tone="muted">
              {fmt.dayLabel(key)}
            </Text>
            {items.map((item) => (
              <FeedCard
                key={`${item.kind}-${item.id}`}
                item={item}
                catName={showCatNames ? (catNames.get(item.catId) ?? null) : null}
                autoMood={item.kind === 'photo' && item.id === autoMoodPhotoId}
              />
            ))}
          </View>
        ))
      )}
    </Screen>
  );
}
