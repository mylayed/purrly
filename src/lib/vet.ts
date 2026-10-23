// Ветеринарні записи: дати зберігаються як РРРР-ММ-ДД (vet_events.occurred_on / next_due_on),
// вводяться як ДД.ММ.РРРР — як дата народження кота.

export type VetType = 'vaccination' | 'deworming' | 'flea_tick' | 'visit' | 'other';

export const VET_TYPES: VetType[] = ['vaccination', 'deworming', 'flea_tick', 'visit', 'other'];

// Типовий інтервал до наступного разу — лише підказка у формі, власник може змінити.
// Щеплення — щороку, від глистів — раз на 3 місяці, від бліх і кліщів — щомісяця.
export const DEFAULT_INTERVAL_MONTHS: Record<VetType, number | null> = {
  vaccination: 12,
  deworming: 3,
  flea_tick: 1,
  visit: null,
  other: null,
};

// Скільки днів наперед підсвічувати «скоро».
export const DUE_SOON_DAYS = 14;
const MAX_FUTURE_YEARS = 5;
const MAX_PAST_YEARS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

function toIso(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function todayIso(now = new Date()) {
  return toIso(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

// ДД.ММ.РРРР → РРРР-ММ-ДД. future: чи дозволено дату після сьогодні.
export function parseDateInput(input: string, future: 'allow' | 'deny', now = new Date()) {
  const match = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(input.trim());
  if (!match) return null;
  const [, d, m, y] = match.map(Number) as [number, number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return null;
  }
  const iso = toIso(y, m, d);
  const today = todayIso(now);
  if (future === 'deny' && iso > today) return null;
  if (y < now.getFullYear() - MAX_PAST_YEARS || y > now.getFullYear() + MAX_FUTURE_YEARS) {
    return null;
  }
  return iso;
}

export function formatDateInput(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

// Додає місяці; 31 січня + 1 міс → 28/29 лютого, а не 3 березня.
export function addMonths(iso: string, months: number) {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  return toIso(target.getUTCFullYear(), target.getUTCMonth() + 1, Math.min(d, lastDay));
}

// Днів від сьогодні до дати: 0 — сьогодні, від'ємне — прострочено.
export function daysUntil(iso: string, now = new Date()) {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((Date.UTC(y, m - 1, d) - today) / DAY_MS);
}

export type DueStatus = 'overdue' | 'soon' | 'later';

export function dueStatus(days: number): DueStatus {
  if (days < 0) return 'overdue';
  if (days <= DUE_SOON_DAYS) return 'soon';
  return 'later';
}

type VetEventLike = {
  type: VetType;
  title: string | null;
  occurred_on: string;
  next_due_on: string | null;
  created_at: string;
};

// Найближчі справи: для кожного «ряду» (тип + назва, напр. «Щеплення · Нобівак»)
// беремо останній запис; новіший запис закриває «наступний раз» попереднього.
export function upcomingDue<T extends VetEventLike>(events: T[], now = new Date()) {
  const latest = new Map<string, T>();
  for (const event of events) {
    const key = `${event.type}:${(event.title ?? '').trim().toLowerCase()}`;
    const current = latest.get(key);
    if (
      !current ||
      event.occurred_on > current.occurred_on ||
      (event.occurred_on === current.occurred_on && event.created_at > current.created_at)
    ) {
      latest.set(key, event);
    }
  }
  return [...latest.values()]
    .filter((e): e is T & { next_due_on: string } => !!e.next_due_on)
    .map((event) => {
      const days = daysUntil(event.next_due_on, now);
      return { event, days, status: dueStatus(days) };
    })
    .sort((a, b) => a.event.next_due_on.localeCompare(b.event.next_due_on));
}
