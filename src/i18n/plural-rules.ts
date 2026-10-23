// Поліфіл Intl.PluralRules для мов застосунку.
//
// У Hermes (iOS/Android) Intl.PluralRules немає. Тоді i18next мовчки бере запасне
// правило «1 → one, решта → other», і українська ламається: «5 року» замість «5 років».
// i18next потрібні лише конструктор, select() і resolvedOptions().pluralCategories,
// тож замість бібліотеки (їй самій треба Intl.Locale) — правила CLDR для наших мов.

type Category = 'one' | 'few' | 'many' | 'other';
type Rule = (i: number, v: number, n: number) => Category;

// i — ціла частина, v — кількість видимих цифр після коми, n — саме число.
const cardinal: Record<string, { rule: Rule; categories: Category[] }> = {
  uk: {
    rule: (i, v) => {
      if (v !== 0) return 'other';
      const d10 = i % 10;
      const d100 = i % 100;
      if (d10 === 1 && d100 !== 11) return 'one';
      if (d10 >= 2 && d10 <= 4 && (d100 < 12 || d100 > 14)) return 'few';
      return 'many';
    },
    categories: ['one', 'few', 'many', 'other'],
  },
  pl: {
    rule: (i, v) => {
      if (v !== 0) return 'other';
      if (i === 1) return 'one';
      const d10 = i % 10;
      const d100 = i % 100;
      if (d10 >= 2 && d10 <= 4 && (d100 < 12 || d100 > 14)) return 'few';
      return 'many';
    },
    categories: ['one', 'few', 'many', 'other'],
  },
  en: { rule: (i, v) => (i === 1 && v === 0 ? 'one' : 'other'), categories: ['one', 'other'] },
  de: { rule: (i, v) => (i === 1 && v === 0 ? 'one' : 'other'), categories: ['one', 'other'] },
  // «many» — для мільйонів: «1 millón de…».
  es: {
    rule: (i, v, n) =>
      n === 1 ? 'one' : v === 0 && i !== 0 && i % 1000000 === 0 ? 'many' : 'other',
    categories: ['one', 'many', 'other'],
  },
};

function languageOf(locales?: string | string[]) {
  const first = Array.isArray(locales) ? locales[0] : locales;
  const language = (first ?? 'en').toLowerCase().split(/[-_]/)[0]!;
  return language in cardinal ? language : 'en';
}

class PluralRules {
  private readonly locale: string;
  private readonly type: 'cardinal' | 'ordinal';

  constructor(locales?: string | string[], options?: { type?: 'cardinal' | 'ordinal' }) {
    this.locale = languageOf(locales);
    this.type = options?.type ?? 'cardinal';
  }

  select(value: number): Category {
    // Порядкові форми застосунок не використовує.
    if (this.type === 'ordinal') return 'other';
    const n = Math.abs(Number(value));
    if (!Number.isFinite(n)) return 'other';
    const [int = '0', fraction = ''] = String(n).split('.');
    return cardinal[this.locale]!.rule(Number(int), fraction.length, n);
  }

  resolvedOptions() {
    return {
      locale: this.locale,
      type: this.type,
      pluralCategories:
        this.type === 'ordinal' ? ['other'] : [...cardinal[this.locale]!.categories],
    };
  }

  static supportedLocalesOf(locales: string | string[]) {
    return (Array.isArray(locales) ? locales : [locales]).filter(
      (l) => l.toLowerCase().split(/[-_]/)[0]! in cardinal,
    );
  }
}

// Вбудовану реалізацію не чіпаємо, якщо вона є й правильно рахує українську.
function nativeWorks() {
  try {
    const rules = new Intl.PluralRules('uk');
    return rules.select(5) === 'many' && rules.select(2) === 'few' && rules.select(1) === 'one';
  } catch {
    return false;
  }
}

export function installPluralRulesPolyfill() {
  if (typeof Intl === 'undefined' || nativeWorks()) return false;
  Object.defineProperty(Intl, 'PluralRules', {
    value: PluralRules,
    configurable: true,
    writable: true,
  });
  return true;
}

installPluralRulesPolyfill();
