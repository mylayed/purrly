import { Bell } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';

import { EmptyState, Screen, Text } from '@/components/ui';
import { useTheme } from '@/theme';

export default function Reminders() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Screen>
      <Text variant="title">{t('tabs.reminders')}</Text>
      <EmptyState
        icon={<Bell size={44} color={colors.accent} weight="duotone" />}
        title={t('reminders.emptyTitle')}
        body={t('reminders.emptyBody')}
      />
    </Screen>
  );
}
