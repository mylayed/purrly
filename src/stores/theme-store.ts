import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { persistStorage } from './persist-storage';

export type ThemePreference = 'system' | 'light' | 'dark';

type ThemeState = {
  preference: ThemePreference;
  hydrated: boolean;
  setPreference: (preference: ThemePreference) => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: 'system',
      hydrated: false,
      setPreference: (preference) => set({ preference }),
    }),
    {
      name: 'purrly-theme',
      storage: createJSONStorage(() => persistStorage),
      partialize: ({ preference }) => ({ preference }),
      onRehydrateStorage: () => () => useThemeStore.setState({ hydrated: true }),
    },
  ),
);
