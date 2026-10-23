// Планувальник локальних сповіщень: з графіків годування, ветеринарних дат і власних
// нагадувань складає список сповіщень. «Без спаму»: те, що збігається в часі, об'єднуємо
// (два коти о 8:00 — одне сповіщення; кілька ветсправ одного дня — одне).

import { shortTime } from './feeding';
import { upcomingDue, type VetType } from './vet';

// iOS тримає до 64 запланованих локальних сповіщень — лишаємо запас.
export const MAX_SCHEDULED = 60;
// О котрій нагадувати про ветеринарію в день «наступного разу».
export const VET_REMINDER_HOUR = 10;

export type Trigger =
  | { type: 'daily'; hour: number; minute: number }
  // weekday: 1 — неділя … 7 — субота (як у expo-notifications).
  | { type: 'weekly'; weekday: number; hour: number; minute: number }
  | { type: 'date'; date: Date };

export type Thread = 'feeding' | 'vet' | 'reminders';

export type PlannedNotification = {
  key: string;
  thread: Thread;
  title: string;
  body: string;
  trigger: Trigger;
};

export type ReminderRepeat = 'once' | 'daily' | 'weekly';

type Cat = { id: string; name: string; archived_at: string | null };
type Slot = {
  cat_id: string;
  time_of_day: string;
  days_of_week: number[];
  enabled: boolean;
  food_name: string | null;
  amount_grams: number | null;
};
type VetEventLike = {
  id: string;
  cat_id: string;
  type: VetType;
  title: string | null;
  occurred_on: string;
  next_due_on: string | null;
  created_at: string;
};
type Reminder = {
  id: string;
  cat_id: string;
  type: string;
  title: string | null;
  starts_at: string;
  repeat_rule: string | null;
  enabled: boolean;
};

export type ReminderTexts = {
  feedingTitle: (catNames: string[]) => string;
  feedingBody: (parts: string[]) => string;
  feedingPart: (catName: string, portion: string | null) => string;
  portion: (food: string | null, grams: number | null) => string | null;
  vetTitle: string;
  vetPart: (catName: string, what: string) => string;
  vetWhat: (type: VetType, title: string | null) => string;
  reminderTitle: (type: string, catName: string) => string;
};

export type PlanInput = {
  cats: Cat[];
  slots: Slot[];
  vetEvents: VetEventLike[];
  reminders: Reminder[];
  settings: { feeding: boolean; vet: boolean };
  texts: ReminderTexts;
  now?: Date;
};

// RRULE (RFC 5545) — підтримуємо лише те, що створює застосунок.
export function repeatRule(repeat: ReminderRepeat) {
  return repeat === 'daily' ? 'FREQ=DAILY' : repeat === 'weekly' ? 'FREQ=WEEKLY' : null;
}

export function repeatOf(rule: string | null): ReminderRepeat {
  if (rule?.includes('FREQ=DAILY')) return 'daily';
  if (rule?.includes('FREQ=WEEKLY')) return 'weekly';
  return 'once';
}

// ISO-день (1 — понеділок) → день expo-notifications (1 — неділя).
function toNotificationWeekday(isoDay: number) {
  return (isoDay % 7) + 1;
}

function hourMinute(timeOfDay: string) {
  const [hour, minute] = shortTime(timeOfDay).split(':').map(Number) as [number, number];
  return { hour, minute };
}

function planFeeding({ cats, slots, texts }: PlanInput): PlannedNotification[] {
  const names = new Map(cats.map((c) => [c.id, c.name]));
  // (час, день тижня) → частини тексту для кожного кота.
  const byTime = new Map<string, Map<number, { cats: string[]; parts: string[] }>>();
  for (const slot of slots) {
    const name = names.get(slot.cat_id);
    if (!slot.enabled || !name) continue;
    const time = shortTime(slot.time_of_day);
    const days = byTime.get(time) ?? new Map();
    byTime.set(time, days);
    for (const day of slot.days_of_week) {
      const entry = days.get(day) ?? { cats: [], parts: [] };
      if (!entry.cats.includes(name)) entry.cats.push(name);
      entry.parts.push(texts.feedingPart(name, texts.portion(slot.food_name, slot.amount_grams)));
      days.set(day, entry);
    }
  }

  const planned: PlannedNotification[] = [];
  for (const [time, days] of byTime) {
    const { hour, minute } = hourMinute(time);
    const signature = (e: { parts: string[] }) => e.parts.join('|');
    const entries = [...days.entries()];
    // Однаково всі 7 днів — одне щоденне сповіщення замість семи щотижневих.
    const sameEveryDay =
      entries.length === 7 && entries.every(([, e]) => signature(e) === signature(entries[0]![1]));
    if (sameEveryDay) {
      const e = entries[0]![1];
      planned.push({
        key: `feeding:${time}`,
        thread: 'feeding',
        title: texts.feedingTitle(e.cats),
        body: texts.feedingBody(e.parts),
        trigger: { type: 'daily', hour, minute },
      });
      continue;
    }
    for (const [day, e] of entries) {
      planned.push({
        key: `feeding:${time}:${day}`,
        thread: 'feeding',
        title: texts.feedingTitle(e.cats),
        body: texts.feedingBody(e.parts),
        trigger: { type: 'weekly', weekday: toNotificationWeekday(day), hour, minute },
      });
    }
  }
  return planned;
}

function planVet({ cats, vetEvents, texts, now = new Date() }: PlanInput): PlannedNotification[] {
  const names = new Map(cats.map((c) => [c.id, c.name]));
  const byDay = new Map<string, string[]>();
  for (const cat of cats) {
    const due = upcomingDue(
      vetEvents.filter((e) => e.cat_id === cat.id),
      now,
    );
    for (const { event, days } of due) {
      if (days < 0) continue;
      const parts = byDay.get(event.next_due_on) ?? [];
      parts.push(texts.vetPart(names.get(cat.id)!, texts.vetWhat(event.type, event.title)));
      byDay.set(event.next_due_on, parts);
    }
  }
  const planned: PlannedNotification[] = [];
  for (const [day, parts] of byDay) {
    const [y, m, d] = day.split('-').map(Number) as [number, number, number];
    const date = new Date(y, m - 1, d, VET_REMINDER_HOUR, 0, 0, 0);
    if (date <= now) continue;
    planned.push({
      key: `vet:${day}`,
      thread: 'vet',
      title: texts.vetTitle,
      body: parts.join('\n'),
      trigger: { type: 'date', date },
    });
  }
  return planned;
}

function planReminders({ cats, reminders, texts, now = new Date() }: PlanInput) {
  const names = new Map(cats.map((c) => [c.id, c.name]));
  const planned: PlannedNotification[] = [];
  for (const r of reminders) {
    const name = names.get(r.cat_id);
    if (!r.enabled || !name) continue;
    const start = new Date(r.starts_at);
    const repeat = repeatOf(r.repeat_rule);
    const base = {
      key: `reminder:${r.id}`,
      thread: 'reminders' as const,
      title: texts.reminderTitle(r.type, name),
      body: r.title ?? '',
    };
    const hour = start.getHours();
    const minute = start.getMinutes();
    if (repeat === 'daily') planned.push({ ...base, trigger: { type: 'daily', hour, minute } });
    else if (repeat === 'weekly') {
      planned.push({
        ...base,
        trigger: { type: 'weekly', weekday: start.getDay() + 1, hour, minute },
      });
    } else if (start > now) planned.push({ ...base, trigger: { type: 'date', date: start } });
  }
  return planned;
}

// Повний план: повторювані — першими (вони займають по одному місцю назавжди),
// далі разові за датою; усе понад MAX_SCHEDULED відкидаємо (пізніші дати).
export function planNotifications(input: PlanInput) {
  const activeCats = input.cats.filter((c) => !c.archived_at);
  const scoped = { ...input, cats: activeCats };
  const all = [
    ...(input.settings.feeding ? planFeeding(scoped) : []),
    ...(input.settings.vet ? planVet(scoped) : []),
    ...planReminders(scoped),
  ];
  const repeating = all.filter((n) => n.trigger.type !== 'date');
  const once = all
    .filter(
      (n): n is PlannedNotification & { trigger: { type: 'date'; date: Date } } =>
        n.trigger.type === 'date',
    )
    .sort((a, b) => a.trigger.date.getTime() - b.trigger.date.getTime());
  return [...repeating, ...once].slice(0, MAX_SCHEDULED);
}
