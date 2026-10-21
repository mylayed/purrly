import { useTranslation } from 'react-i18next';

import { useProfile } from '@/features/profile/api';
import { formatWeightNumber, type WeightChange, type WeightUnit } from '@/lib/weight';

// Одиниці користувача (кг / фунти з профілю) та мова інтерфейсу для чисел і дат.
export function useWeightFormat() {
  const { t, i18n } = useTranslation();
  const { data: profile } = useProfile();
  const unit: WeightUnit = profile?.weight_unit ?? 'kg';
  const locale = i18n.language;
  const unitLabel = t(`weight.units.${unit}`);

  const number = (grams: number) => formatWeightNumber(grams, unit, locale);
  const format = (grams: number) => `${number(grams)} ${unitLabel}`;

  const change = (c: WeightChange) => {
    const sign = c.deltaGrams > 0 ? '+' : c.deltaGrams < 0 ? '−' : '±';
    return t('weight.change', {
      value: `${sign}${number(Math.abs(c.deltaGrams))}`,
      unit: unitLabel,
      period: t('weight.days', { count: Math.max(1, c.days) }),
    });
  };

  const alert = (c: WeightChange) => {
    if (!c.alert) return null;
    const percent = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(
      Math.abs(c.percent),
    );
    return {
      tone: c.alert === 'vet' ? ('danger' as const) : ('warning' as const),
      message: t(c.alert === 'vet' ? 'weight.alertVet' : 'weight.alertWatch', { percent }),
    };
  };

  return { unit, unitLabel, locale, number, format, change, alert };
}
