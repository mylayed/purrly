import { Redirect, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen, ScreenHeader } from '@/components/ui';
import { useCreateCat } from '@/features/cats/api';
import { CatForm } from '@/features/cats/components/cat-form';
import { useCatLimit } from '@/features/subscription/api';

export default function NewCat() {
  const { t } = useTranslation();
  const createCat = useCreateCat();
  const { atLimit } = useCatLimit();

  // Відкрили форму напряму (посиланням) на межі ліміту Free — показуємо Plus.
  // Після створення кота ліміт теж «спрацює», тож не перенаправляємо під час збереження.
  if (atLimit && !createCat.isPending && !createCat.isSuccess) {
    return <Redirect href={{ pathname: '/paywall', params: { reason: 'cats' } }} />;
  }

  return (
    <Screen scroll header={<ScreenHeader title={t('cats.newTitle')} backLabel={t('cats.back')} />}>
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
