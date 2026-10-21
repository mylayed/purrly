// Вага зберігається в грамах (weights.weight_grams), кг/фунти — лише відображення.

export type WeightUnit = 'kg' | 'lb';

export const MIN_WEIGHT_GRAMS = 50;
export const MAX_WEIGHT_GRAMS = 30000;
const GRAMS_PER_LB = 453.59237;

export function gramsToUnit(grams: number, unit: WeightUnit) {
  return unit === 'kg' ? grams / 1000 : grams / GRAMS_PER_LB;
}

export function unitToGrams(value: number, unit: WeightUnit) {
  return Math.round(unit === 'kg' ? value * 1000 : value * GRAMS_PER_LB);
}

// Кіт важить кілька кілограмів, тож точність — до 10 г (кг) або 0.1 фунта.
const FRACTION_DIGITS: Record<WeightUnit, number> = { kg: 2, lb: 1 };

export function formatWeightNumber(grams: number, unit: WeightUnit, locale: string) {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: FRACTION_DIGITS[unit],
  }).format(gramsToUnit(grams, unit));
}

// Приймає і кому, і крапку («4,25» / «4.25»). null — не число або поза межами.
export function parseWeightInput(input: string, unit: WeightUnit) {
  const normalized = input.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  const grams = unitToGrams(Number(normalized), unit);
  if (grams < MIN_WEIGHT_GRAMS || grams > MAX_WEIGHT_GRAMS) return null;
  return grams;
}

export type WeightPoint = { measuredAt: string; grams: number };

const DAY_MS = 24 * 60 * 60 * 1000;

export type WeightChange = {
  deltaGrams: number;
  percent: number;
  days: number;
  // Помітне схуднення — ранній сигнал проблем зі здоров'ям. Без діагнозів:
  // 'watch' — варто стежити, 'vet' — варто показати ветеринару.
  alert: 'watch' | 'vet' | null;
};

// Зміна від останнього виміру до виміру ~місяць тому (найближчого, що старший
// за 25 днів; не старшого за 120). Якщо такого немає — до попереднього виміру.
export function weightChange(points: WeightPoint[]): WeightChange | null {
  if (points.length < 2) return null;
  const sorted = [...points].sort((a, b) => a.measuredAt.localeCompare(b.measuredAt));
  const latest = sorted[sorted.length - 1]!;
  const latestTime = Date.parse(latest.measuredAt);

  const monthAgo = [...sorted].reverse().find((p) => {
    const age = (latestTime - Date.parse(p.measuredAt)) / DAY_MS;
    return age >= 25 && age <= 120;
  });
  const base = monthAgo ?? sorted[sorted.length - 2]!;

  const deltaGrams = latest.grams - base.grams;
  const percent = (deltaGrams / base.grams) * 100;
  const days = Math.round((latestTime - Date.parse(base.measuredAt)) / DAY_MS);

  // Пороги для втрати ваги за період до ~4 місяців: від 5 % — стежити, від 10 % — до ветеринара.
  let alert: WeightChange['alert'] = null;
  if (days <= 120 && percent <= -10) alert = 'vet';
  else if (days <= 120 && percent <= -5) alert = 'watch';

  return { deltaGrams, percent, days, alert };
}

// «Охайні» поділки осі Y: 3–5 круглих значень, що охоплюють дані.
export function niceTicks(min: number, max: number, target = 4) {
  if (min === max) {
    const pad = Math.max(Math.abs(min) * 0.05, 0.1);
    min -= pad;
    max += pad;
  }
  const rawStep = (max - min) / target;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rawStep) ?? 10 * magnitude;
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= end + step / 2; v += step) ticks.push(Number(v.toFixed(10)));
  return { ticks, step, min: start, max: end };
}
