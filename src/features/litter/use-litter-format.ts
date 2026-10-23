import { useTranslation } from 'react-i18next';

import { localDayKey } from '@/lib/feeding';

const HOUR_MS = 60 * 60 * 1000;

export function useLitterFormat() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const timeFormat = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' });

  const clock = (iso: string) => timeFormat.format(new Date(iso));

  // «сьогодні о 8:30», «вчора о 22:10», «3 дні тому».
  const ago = (iso: string, now = new Date()) => {
    const date = new Date(iso);
    const key = localDayKey(date);
    if (key === localDayKey(now)) return t('litter.todayAt', { time: clock(iso) });
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (key === localDayKey(yesterday)) return t('litter.yesterdayAt', { time: clock(iso) });
    return t('litter.daysAgo', {
      count: Math.max(2, Math.floor((now.getTime() - date.getTime()) / (24 * HOUR_MS))),
    });
  };

  const dayLabel = (dayKey: string, now = new Date()) => {
    if (dayKey === localDayKey(now)) return t('feeding.today');
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (dayKey === localDayKey(yesterday)) return t('feeding.yesterday');
    const [y, m, d] = dayKey.split('-').map(Number) as [number, number, number];
    return new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(new Date(y, m - 1, d));
  };

  return { locale, clock, ago, dayLabel };
}
