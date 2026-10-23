// Порції зберігаються в грамах, час графіка — як місцевий час доби (feeding_schedule.time_of_day).

export const MIN_PORTION_GRAMS = 1;
export const MAX_PORTION_GRAMS = 1000;
export const MAX_KCAL_PER_100G = 900;

// 1 = понеділок … 7 = неділя (ISO), як у feeding_schedule.days_of_week.
export const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7] as const;

export function isoWeekday(date: Date) {
  return ((date.getDay() + 6) % 7) + 1;
}

// Приймає і кому, і крапку. null — не число або поза межами.
function parseDecimal(input: string, min: number, max: number) {
  const normalized = input.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  const value = Math.round(Number(normalized) * 10) / 10;
  if (value < min || value > max) return null;
  return value;
}

export function parsePortionInput(input: string) {
  return parseDecimal(input, MIN_PORTION_GRAMS, MAX_PORTION_GRAMS);
}

export function parseKcalInput(input: string) {
  return parseDecimal(input, 1, MAX_KCAL_PER_100G);
}

// Час вводиться як ГГ:ХХ (24 год). Повертає «ГГ:ХХ» або null.
export function parseTimeInput(input: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(input.trim());
  if (!match) return null;
  const [h, m] = [Number(match[1]), Number(match[2])];
  if (h > 23 || m > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Підставляє двокрапку під час введення: «183» → «18:3».
export function maskTimeInput(input: string) {
  const digits = input.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
}

// «08:30:00» з бази → «08:30».
export function shortTime(timeOfDay: string) {
  return timeOfDay.slice(0, 5);
}

export function timeToMinutes(timeOfDay: string) {
  const [h, m] = timeOfDay.split(':').map(Number) as [number, number];
  return h * 60 + m;
}

export function nowTimeInput(now = new Date()) {
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

// Місцевий календарний день — ключ для групування годувань.
export function localDayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function kcalFor(grams: number, kcalPer100g: number) {
  return (grams * kcalPer100g) / 100;
}

type Slot = { id: string; time_of_day: string; days_of_week: number[]; enabled: boolean };

// Увімкнені слоти графіка на цей день, від ранку до вечора.
export function slotsForDay<T extends Slot>(schedule: T[], date: Date) {
  const day = isoWeekday(date);
  return schedule
    .filter((s) => s.enabled && s.days_of_week.includes(day))
    .sort((a, b) => a.time_of_day.localeCompare(b.time_of_day));
}

// Дата годування: день відносно сьогодні (0 — сьогодні, −1 — вчора) і час «ГГ:ХХ».
export function mealDate(dayOffset: number, time: string, now = new Date()) {
  const [h, m] = time.split(':').map(Number) as [number, number];
  const date = new Date(now);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(h, m, 0, 0);
  return date;
}
