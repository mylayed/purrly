import { useTranslation } from 'react-i18next';

import type { DueStatus } from '@/lib/vet';

import type { VetEvent } from './api';

// Дати, назви й «скільки лишилось» мовою інтерфейсу.
export function useVetFormat() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;

  const date = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(y, m - 1, d));
  };

  // «Щеплення · Нобівак» або просто «Щеплення».
  const title = (event: Pick<VetEvent, 'type' | 'title'>) =>
    event.title ? `${t(`vet.types.${event.type}`)} · ${event.title}` : t(`vet.types.${event.type}`);

  const due = (days: number) =>
    days < 0
      ? t('vet.overdue', { count: -days })
      : days === 0
        ? t('vet.dueToday')
        : t('vet.dueIn', { count: days });

  const tone = (status: DueStatus) =>
    status === 'overdue' ? ('danger' as const) : status === 'soon' ? ('warning' as const) : null;

  return { locale, date, title, due, tone };
}
