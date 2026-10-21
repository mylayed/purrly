import { Cat } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';

import { Button, EmptyState, Screen, Text } from '@/components/ui';
import { useProfile } from '@/features/profile/api';
import { useTheme } from '@/theme';

export default function Home() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { data: profile } = useProfile();
  const firstName = profile?.display_name?.trim().split(/\s+/)[0];

  return (
    <Screen>
      <Text variant="title">
        {firstName ? t('home.greeting', { name: firstName }) : t('home.greetingNoName')}
      </Text>
      <EmptyState
        icon={<Cat size={44} color={colors.accent} weight="duotone" />}
        title={t('home.emptyTitle')}
        body={t('home.emptyBody')}
        action={
          <>
            <Button title={t('home.addCat')} disabled />
            <Text variant="caption" tone="muted">
              {t('home.comingSoon')}
            </Text>
          </>
        }
      />
    </Screen>
  );
}
