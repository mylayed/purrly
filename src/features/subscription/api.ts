import { router } from 'expo-router';

import { useCats } from '@/features/cats/api';
import { useProfile } from '@/features/profile/api';
import { useSessionStore } from '@/stores/session-store';

// Статус Plus. is_plus у профілі змінює лише сервер (вебхук RevenueCat) — клієнт його тільки читає.
export function useIsPlus() {
  const { data: profile, isPending } = useProfile();
  return { isPlus: profile?.is_plus === true, isPending };
}

// Покупки запрацюють після підключення RevenueCat: ключі SDK для iOS / Android
// з'являться в змінних оточення. До того paywall показує тарифи без кнопки купівлі.
export const purchasesAvailable = false;

// Free: скільки активних (не архівних) котів можна мати.
export const FREE_CAT_LIMIT = 1;

export type PaywallReason = 'cats' | 'ai' | 'general';

export function openPaywall(reason: PaywallReason) {
  router.push({ pathname: '/paywall', params: { reason } });
}

// Ліміт котів для Free: рахуємо лише активних котів, яких користувач створив сам
// (коти, куди його запросили як члена сім'ї, не рахуються). Базу захищає тригер.
export function useCatLimit() {
  const userId = useSessionStore((s) => s.session?.user.id);
  const { data: cats } = useCats();
  const { isPlus, isPending } = useIsPlus();
  const ownedActive = (cats ?? []).filter((c) => c.created_by === userId && !c.archived_at).length;
  const atLimit = !isPending && !isPlus && ownedActive >= FREE_CAT_LIMIT;
  return { atLimit, ownedActive };
}

// «Додати кота»: на межі ліміту Free — paywall замість форми.
export function useAddCat() {
  const { atLimit } = useCatLimit();
  return () => (atLimit ? openPaywall('cats') : router.push('/cat/new'));
}
