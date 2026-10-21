import { Images } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';

import { EmptyState, Screen, Text } from '@/components/ui';
import { useTheme } from '@/theme';

export default function Feed() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Screen>
      <Text variant="title">{t('tabs.feed')}</Text>
      <EmptyState
        icon={<Images size={44} color={colors.accent} weight="duotone" />}
        title={t('feed.emptyTitle')}
        body={t('feed.emptyBody')}
      />
    </Screen>
  );
}
