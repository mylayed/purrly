// Тарифи Plus — див. PLAN.md, етап 5. Ціни тут — орієнтир для paywall, поки не
// підключено RevenueCat: після цього показуємо ціни зі стору (їх вимагають App Store і Google Play).

export type PlanId = 'yearly' | 'monthly' | 'lifetime';
// Річний — першим: найвигідніший і єдиний із пробним періодом.
export const PLAN_ORDER: PlanId[] = ['yearly', 'monthly', 'lifetime'];
export const TRIAL_DAYS = 7;

type Currency = 'UAH' | 'USD';

// Android та iOS зі Small Business Program.
const PRICES: Record<Currency, Record<PlanId, number>> = {
  UAH: { monthly: 79, yearly: 549, lifetime: 1290 },
  USD: { monthly: 2.99, yearly: 19.99, lifetime: 39.99 },
};

// Гривні — для української мови, решті — долари (до цін зі стору).
export function currencyFor(language: string): Currency {
  return language === 'uk' ? 'UAH' : 'USD';
}

export function planPrice(plan: PlanId, currency: Currency) {
  return PRICES[currency][plan];
}

// Знижка річного плану щодо 12 місяців помісячно, округлена вниз до 5 %,
// щоб не обіцяти більше, ніж є («−40%»).
export function yearlySavingsPercent(currency: Currency) {
  const { monthly, yearly } = PRICES[currency];
  const percent = (1 - yearly / (monthly * 12)) * 100;
  return Math.floor(percent / 5) * 5;
}
