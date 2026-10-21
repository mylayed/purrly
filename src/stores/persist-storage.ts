import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StateStorage } from 'zustand/middleware';

// Під час серверного рендеру web немає window, а з ним і localStorage.
const serverStorage: StateStorage<void> = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const persistStorage: StateStorage<void | Promise<void>> =
  typeof window === 'undefined' ? serverStorage : AsyncStorage;
