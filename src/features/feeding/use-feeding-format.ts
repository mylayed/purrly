import { useTranslation } from 'react-i18next';

import { ALL_DAYS, localDayKey } from '@/lib/feeding';

import type { Food } from './api';

// Понеділок 1 січня 2024 — точка відліку для назв днів тижня.
const MONDAY = new Date(2024, 0, 1);
const WEEKDAYS = [1, 2, 3, 4, 5];
const WEEKEND = [6, 7];

function sameDays(a: number[], b: number[]) {
  return a.length === b.length && b.every((d) => a.includes(d));
}

// Числа, час і дні тижня мовою інтерфейсу.
export function useFeedingFormat() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const timeFormat = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' });
  const weekdayFormat = new Intl.DateTimeFormat(locale, { weekday: 'short' });

  const grams = (value: number) => t('feeding.grams', { value: number.format(value) });
  const kcal = (value: number) => t('feeding.kcal', { value: Math.round(value) });

  // «08:30» або «08:30:00» з бази → місцевий формат (8:30 AM в en-US).
  const time = (timeOfDay: string) => {
    const [h, m] = timeOfDay.split(':').map(Number) as [number, number];
    return timeFormat.format(new Date(2024, 0, 1, h, m));
  };
  const clock = (iso: string) => timeFormat.format(new Date(iso));

  const weekday = (isoDay: number) => {
    const date = new Date(MONDAY);
    date.setDate(MONDAY.getDate() + isoDay - 1);
    return weekdayFormat.format(date);
  };

  const days = (list: number[]) => {
    if (sameDays(list, [...ALL_DAYS])) return t('feeding.days.everyDay');
    if (sameDays(list, WEEKDAYS)) return t('feeding.days.weekdays');
    if (sameDays(list, WEEKEND)) return t('feeding.days.weekend');
    return [...list].sort().map(weekday).join(', ');
  };

  const dayLabel = (dayKey: string) => {
    const today = new Date();
    if (dayKey === localDayKey(today)) return t('feeding.today');
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (dayKey === localDayKey(yesterday)) return t('feeding.yesterday');
    const [y, m, d] = dayKey.split('-').map(Number) as [number, number, number];
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date(y, m - 1, d));
  };

  // Назва з довідника (якщо корм перейменували) або знімок, збережений у записі.
  const foodName = (
    row: { food_id: string | null; food_name: string | null },
    foods: Map<string, Food>,
  ) => (row.food_id && foods.get(row.food_id)?.name) || row.food_name || t('feeding.noFood');

  // «Royal Canin · 40 г · 150 ккал» — лише відомі частини.
  const portion = (
    row: { food_id: string | null; food_name: string | null; amount_grams: number | null },
    foods: Map<string, Food>,
  ) => {
    const food = row.food_id ? foods.get(row.food_id) : undefined;
    const parts = [foodName(row, foods)];
    if (row.amount_grams) {
      parts.push(grams(row.amount_grams));
      if (food?.kcal_per_100g) parts.push(kcal((row.amount_grams * food.kcal_per_100g) / 100));
    }
    return parts.join(' · ');
  };

  return { locale, number, grams, kcal, time, clock, weekday, days, dayLabel, foodName, portion };
}
