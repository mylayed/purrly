import { useTranslation } from 'react-i18next';

import { GalleryThumbnailsIcon } from '@/components/icons';
import { EmptyState, Screen, Text } from '@/components/ui';
import { useTheme } from '@/theme';

export default function Feed() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Screen>
      <Text variant="title">{t('tabs.feed')}</Text>
      <EmptyState
        icon={<GalleryThumbnailsIcon size={40} color={colors.accent} strokeWidth={1.75} autoPlay />}
        title={t('feed.emptyTitle')}
        body={t('feed.emptyBody')}
      />
    </Screen>
  );
}
