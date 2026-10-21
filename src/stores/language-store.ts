import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import i18n, { type Language } from '@/i18n';

import { persistStorage } from './persist-storage';

export type LanguagePreference = 'system' | Language;

type LanguageState = {
  preference: LanguagePreference;
  hydrated: boolean;
  setPreference: (preference: LanguagePreference) => void;
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      preference: 'system',
      hydrated: false,
      setPreference: (preference) => set({ preference }),
    }),
    {
      name: 'purrly-language',
      storage: createJSONStorage(() => persistStorage),
      partialize: ({ preference }) => ({ preference }),
      // Збережену мову вмикаємо до першого кадру, щоб інтерфейс не перемикався на очах.
      onRehydrateStorage: () => (state) => {
        if (state && state.preference !== 'system') {
          i18n.changeLanguage(state.preference);
        }
        useLanguageStore.setState({ hydrated: true });
      },
    },
  ),
);
