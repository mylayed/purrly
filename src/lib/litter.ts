// Лоток: позначки з часом (litter_events.occurred_at) і видом — сеча, стілець або обидва.

import { localDayKey } from './feeding';

export type LitterKind = 'pee' | 'poop' | 'both';
export const LITTER_KINDS: LitterKind[] = ['pee', 'poop', 'both'];

// Скільки днів показуємо в таблиці й вантажимо з бази.
export const LITTER_DAYS = 7;

type LitterLike = { occurred_at: string; kind: LitterKind };

export type LitterDay = { dayKey: string; pee: number; poop: number };

// «Обидва» рахуємо і як сечу, і як стілець.
function counts(events: LitterLike[]) {
  let pee = 0;
  let poop = 0;
  for (const e of events) {
    if (e.kind !== 'poop') pee++;
    if (e.kind !== 'pee') poop++;
  }
  return { pee, poop };
}

// Останні LITTER_DAYS днів, від сьогодні назад, разом із днями без позначок.
export function litterDays(events: LitterLike[], now = new Date()): LitterDay[] {
  const byDay = new Map<string, LitterLike[]>();
  for (const e of events) {
    const key = localDayKey(new Date(e.occurred_at));
    byDay.set(key, [...(byDay.get(key) ?? []), e]);
  }
  return Array.from({ length: LITTER_DAYS }, (_, i) => {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const dayKey = localDayKey(date);
    return { dayKey, ...counts(byDay.get(dayKey) ?? []) };
  });
}

// Остання позначка, де був стілець або сеча (для «востаннє …»).
export function lastOf<T extends LitterLike>(events: T[], what: 'pee' | 'poop') {
  return events
    .filter((e) => e.kind === what || e.kind === 'both')
    .reduce<T | null>(
      (latest, e) => (!latest || e.occurred_at > latest.occurred_at ? e : latest),
      null,
    );
}
