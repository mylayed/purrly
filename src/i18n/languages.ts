import { getLocales } from 'expo-localization';

// Російської немає і не буде. pl, de, es — чернетки перекладу, до релізу їх перевіряють носії мови.
export const supportedLanguages = ['uk', 'en', 'pl', 'de', 'es'] as const;
export type Language = (typeof supportedLanguages)[number];

export const fallbackLanguage: Language = 'en';

// Назви мов пишемо їхньою ж мовою, щоб їх упізнавали з будь-якого інтерфейсу.
export const languageNames: Record<Language, string> = {
  uk: 'Українська',
  en: 'English',
  pl: 'Polski',
  de: 'Deutsch',
  es: 'Español',
};

export function isSupportedLanguage(code: string | null | undefined): code is Language {
  return supportedLanguages.includes(code as Language);
}

// Перша мова зі списку пристрою, яку ми підтримуємо; інакше англійська.
export function getDeviceLanguage(): Language {
  const match = getLocales().find((locale) => isSupportedLanguage(locale.languageCode));
  return (match?.languageCode as Language | undefined) ?? fallbackLanguage;
}
