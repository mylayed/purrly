import { useLocales } from 'expo-localization';
import { useEffect } from 'react';

import { useLanguageStore } from '@/stores/language-store';

import i18n from '.';
import { fallbackLanguage, isSupportedLanguage } from './languages';

// Тримає мову i18next у відповідності до вибору користувача або мови пристрою.
export function useLanguageSync() {
  const preference = useLanguageStore((s) => s.preference);
  const locales = useLocales();

  const deviceLanguage =
    locales.map((locale) => locale.languageCode).find(isSupportedLanguage) ?? fallbackLanguage;
  const language = preference === 'system' ? deviceLanguage : preference;

  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language]);
}
