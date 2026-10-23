import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { persistStorage } from './persist-storage';

// Які автоматичні нагадування ставити на цьому пристрої (сповіщення — локальні).
type ReminderSettingsState = {
  feeding: boolean;
  vet: boolean;
  setFeeding: (value: boolean) => void;
  setVet: (value: boolean) => void;
};

export const useReminderSettingsStore = create<ReminderSettingsState>()(
  persist(
    (set) => ({
      feeding: true,
      vet: true,
      setFeeding: (feeding) => set({ feeding }),
      setVet: (vet) => set({ vet }),
    }),
    {
      name: 'purrly-reminder-settings',
      storage: createJSONStorage(() => persistStorage),
      partialize: ({ feeding, vet }) => ({ feeding, vet }),
    },
  ),
);
