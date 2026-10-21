// Дата народження вводиться як ДД.ММ.РРРР, у базі зберігається як РРРР-ММ-ДД.

export const MAX_CAT_AGE_YEARS = 30;

export function parseBirthDate(input: string, today = new Date()): string | null {
  const match = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(input.trim());
  if (!match) return null;
  const [, d, m, y] = match.map(Number) as [number, number, number, number];

  const date = new Date(Date.UTC(y, m - 1, d));
  // Відсікаємо 31.02 тощо: Date «перекочує» їх у наступний місяць.
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return null;
  }
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  if (date.getTime() > todayUtc) return null;
  if (y < today.getFullYear() - MAX_CAT_AGE_YEARS) return null;

  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function formatBirthDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

// Підставляє крапки під час введення: «0103202» → «01.03.202».
export function maskBirthDateInput(input: string) {
  const digits = input.replace(/\D/g, '').slice(0, 8);
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean);
  return parts.join('.');
}

export function ageInMonths(birthIso: string, today = new Date()) {
  const [y, m, d] = birthIso.split('-').map(Number) as [number, number, number];
  let months = (today.getFullYear() - y) * 12 + (today.getMonth() + 1 - m);
  if (today.getDate() < d) months -= 1;
  return Math.max(0, months);
}

// Вік у «людських роках» за поширеною ветеринарною таблицею:
// 1 рік кота ≈ 15 людських, 2 роки ≈ 24, далі +4 за кожен рік.
const HUMAN_YEARS_TABLE: [months: number, humanYears: number][] = [
  [0, 0],
  [1, 1],
  [2, 2],
  [3, 4],
  [4, 6],
  [6, 10],
  [8, 13],
  [12, 15],
  [18, 21],
  [24, 24],
];

export function humanYears(months: number) {
  if (months >= 24) return Math.round(24 + ((months - 24) / 12) * 4);
  for (let i = 1; i < HUMAN_YEARS_TABLE.length; i++) {
    const [m1, h1] = HUMAN_YEARS_TABLE[i]!;
    const [m0, h0] = HUMAN_YEARS_TABLE[i - 1]!;
    if (months <= m1) return Math.round(h0 + ((months - m0) / (m1 - m0)) * (h1 - h0));
  }
  return 24;
}

// Етапи життя за AAHA/AAFP (2021): кошеня < 1 року, молодий дорослий 1–6,
// зрілий 7–10, старший — від 11 років.
export type LifeStage = 'kitten' | 'young' | 'mature' | 'senior';

export function lifeStage(months: number): LifeStage {
  if (months < 12) return 'kitten';
  if (months < 7 * 12) return 'young';
  if (months < 11 * 12) return 'mature';
  return 'senior';
}
