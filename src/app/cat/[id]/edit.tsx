import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator } from 'react-native';

import { ErrorBanner, Screen, ScreenHeader } from '@/components/ui';
import { useCat, useUpdateCat, type Cat } from '@/features/cats/api';
import { CatForm } from '@/features/cats/components/cat-form';
import { useTheme } from '@/theme';

export default function EditCat() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: cat, isPending, isError } = useCat(id);

  return (
    <Screen scroll header={<ScreenHeader title={t('cats.editTitle')} backLabel={t('cats.back')} />}>
      {cat ? (
        <EditForm cat={cat} />
      ) : isPending ? (
        <ActivityIndicator color={colors.accent} />
      ) : isError ? (
        <ErrorBanner message={t('cats.notFound')} />
      ) : null}
    </Screen>
  );
}

function EditForm({ cat }: { cat: Cat }) {
  const { t } = useTranslation();
  const updateCat = useUpdateCat(cat);

  return (
    <CatForm
      cat={cat}
      submitLabel={t('cats.form.save')}
      pending={updateCat.isPending}
      error={updateCat.error}
      onSubmit={(input, photoUri) =>
        updateCat.mutate({ input, photoUri }, { onSuccess: () => router.back() })
      }
    />
  );
}
