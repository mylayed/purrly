import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useEffectEvent } from 'react';
import { AppState } from 'react-native';
import { create } from 'zustand';

import { supabase } from '@/api/supabase';
import i18n from '@/i18n';
import { planNotifications, type ReminderTexts } from '@/lib/reminders';
import { useReminderSettingsStore } from '@/stores/reminder-settings-store';

import { applyPlan, notificationsSupported } from './notifications';

// Після змін у даних чекаємо трохи: кілька правок поспіль — одне перепланування.
const DEBOUNCE_MS = 1500;
// Зміни в цих запитах впливають на сповіщення.
const WATCHED = new Set(['cats', 'feeding_schedule', 'vet_events', 'reminders', 'cat_foods']);

type SyncState = {
  scheduled: number | null;
  error: unknown;
  setResult: (n: number | null, e?: unknown) => void;
};

// Скільки сповіщень заплановано — для підпису на вкладці «Нагадування».
export const useReminderSyncState = create<SyncState>()((set) => ({
  scheduled: null,
  error: null,
  setResult: (scheduled, error = null) => set({ scheduled, error }),
}));

function texts(): ReminderTexts {
  const t = i18n.t.bind(i18n);
  const number = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 });
  return {
    feedingTitle: (cats) => t('reminders.push.feedingTitle', { cats: cats.join(', ') }),
    feedingBody: (parts) => parts.join('\n'),
    feedingPart: (cat, portion) => (portion ? `${cat}: ${portion}` : cat),
    portion: (food, grams) =>
      [food, grams ? t('feeding.grams', { value: number.format(grams) }) : null]
        .filter(Boolean)
        .join(' · ') || null,
    vetTitle: t('reminders.push.vetTitle'),
    vetPart: (cat, what) => `${cat}: ${what}`,
    vetWhat: (type, title) =>
      title ? `${t(`vet.types.${type}`)} · ${title}` : t(`vet.types.${type}`),
    reminderTitle: (type, cat) =>
      t(`reminders.push.reminderTitle.${type === 'medication' ? 'medication' : 'custom'}`, { cat }),
  };
}

// Свіжі дані з бази (не з кешу): у кеші лежать вибірки окремих котів.
export async function syncReminders() {
  const [cats, slots, vetEvents, reminders] = await Promise.all([
    supabase.from('cats').select('id, name, archived_at'),
    supabase.from('feeding_schedule').select('*'),
    supabase.from('vet_events').select('*'),
    supabase.from('reminders').select('*').is('vet_event_id', null),
  ]);
  for (const r of [cats, slots, vetEvents, reminders]) if (r.error) throw r.error;

  const { feeding, vet } = useReminderSettingsStore.getState();
  const plan = planNotifications({
    cats: cats.data!,
    slots: slots.data!,
    vetEvents: vetEvents.data!,
    reminders: reminders.data!,
    settings: { feeding, vet },
    texts: texts(),
  });
  return applyPlan(plan);
}

// Тримає локальні сповіщення в актуальному стані: на старті, коли застосунок
// повертається з фону, після змін графіка/ветеринарії/нагадувань і налаштувань.
export function useReminderSync() {
  const queryClient = useQueryClient();
  const setResult = useReminderSyncState((s) => s.setResult);

  const run = useEffectEvent(() => {
    syncReminders()
      .then((n) => setResult(n))
      .catch((error) => {
        console.warn('Reminder sync failed', error);
        setResult(null, error);
      });
  });

  useEffect(() => {
    if (!notificationsSupported) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(run, DEBOUNCE_MS);
    };

    run();
    const unsubscribeCache = queryClient.getQueryCache().subscribe((event) => {
      if (event.type !== 'updated' || event.action.type !== 'success') return;
      if (WATCHED.has(String(event.query.queryKey[0]))) schedule();
    });
    const unsubscribeSettings = useReminderSettingsStore.subscribe(schedule);
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') schedule();
    });
    // Зміна мови — тексти сповіщень теж перекладаємо.
    i18n.on('languageChanged', schedule);

    return () => {
      clearTimeout(timer);
      unsubscribeCache();
      unsubscribeSettings();
      appState.remove();
      i18n.off('languageChanged', schedule);
    };
  }, [queryClient]);
}
