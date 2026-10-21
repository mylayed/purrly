import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen, ScreenHeader } from '@/components/ui';
import { useCreateCat } from '@/features/cats/api';
import { CatForm } from '@/features/cats/components/cat-form';

export default function NewCat() {
  const { t } = useTranslation();
  const createCat = useCreateCat();

  return (
    <Screen scroll>
      <ScreenHeader title={t('cats.newTitle')} backLabel={t('cats.back')} />
      <CatForm
        submitLabel={t('cats.form.create')}
        pending={createCat.isPending}
        error={createCat.error}
        onSubmit={(input, photoUri) =>
          createCat.mutate(
            { input, photoUri },
            {
              onSuccess: (cat) => router.replace({ pathname: '/cat/[id]', params: { id: cat.id } }),
            },
          )
        }
      />
    </Screen>
  );
}
