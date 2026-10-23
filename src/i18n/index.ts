import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

// До першого перекладу: без Intl.PluralRules (Hermes) множина в українській ламається.
import './plural-rules';
import { fallbackLanguage, getDeviceLanguage, supportedLanguages } from './languages';
import de from './locales/de.json';
import en from './locales/en.json';
import es from './locales/es.json';
import pl from './locales/pl.json';
import uk from './locales/uk.json';

// uk — основна мова, тож її ключі є еталоном; решта мусить мати ті самі.
export const resources = {
  uk: { translation: uk },
  en: { translation: en satisfies typeof uk },
  pl: { translation: pl satisfies typeof uk },
  de: { translation: de satisfies typeof uk },
  es: { translation: es satisfies typeof uk },
} as const;

const i18n = createInstance();

i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLanguage(),
  fallbackLng: fallbackLanguage,
  supportedLngs: supportedLanguages,
  interpolation: {
    // React уже екранує значення.
    escapeValue: false,
  },
});

export default i18n;
export * from './languages';
