import { useTranslation } from 'react-i18next';

import { BellIcon } from '@/components/icons';
import { EmptyState, Screen, Text } from '@/components/ui';
import { useTheme } from '@/theme';

export default function Reminders() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Screen>
      <Text variant="title">{t('tabs.reminders')}</Text>
      <EmptyState
        icon={<BellIcon size={40} color={colors.accent} strokeWidth={1.75} autoPlay />}
        title={t('reminders.emptyTitle')}
        body={t('reminders.emptyBody')}
      />
    </Screen>
  );
}
