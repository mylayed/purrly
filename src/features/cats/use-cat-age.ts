import { useTranslation } from 'react-i18next';

import { ageInMonths, humanYears, lifeStage, type LifeStage } from '@/lib/cat-age';

export type CatAge = {
  months: number;
  text: string;
  human: string;
  stage: LifeStage;
};

export function useFormatCatAge() {
  const { t } = useTranslation();

  return (birthIso: string | null): CatAge | null => {
    if (!birthIso) return null;
    const months = ageInMonths(birthIso);
    const years = Math.floor(months / 12);
    const rest = months % 12;

    let text: string;
    if (months === 0) text = t('cats.age.newborn');
    else if (years === 0) text = t('cats.age.months', { count: rest });
    else if (rest === 0 || years >= 3) text = t('cats.age.years', { count: years });
    else
      text = t('cats.age.combined', {
        years: t('cats.age.years', { count: years }),
        months: t('cats.age.months', { count: rest }),
      });

    const humanCount = humanYears(months);
    return {
      months,
      text,
      human: t('cats.age.human', { count: humanCount }),
      stage: lifeStage(months),
    };
  };
}
