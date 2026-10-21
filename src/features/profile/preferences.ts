import { useEffect, useRef } from 'react';

import { isSupportedLanguage } from '@/i18n/languages';
import { useLanguageStore, type LanguagePreference } from '@/stores/language-store';
import { useThemeStore, type ThemePreference } from '@/stores/theme-store';

import { useProfile, useUpdateProfile } from './api';

// Тема й мова живуть локально (щоб працювати миттєво й до входу) і в профілі
// (щоб переїжджати на інший пристрій). Після входу перемагає профіль — один раз
// на користувача, далі зміни з кабінету пишуться в обидва місця.
export function useApplyProfilePreferences() {
  const { data: profile } = useProfile();
  const appliedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!profile || appliedFor.current === profile.id) return;
    appliedFor.current = profile.id;

    useThemeStore.getState().setPreference(profile.theme);
    useLanguageStore
      .getState()
      .setPreference(isSupportedLanguage(profile.language) ? profile.language : 'system');
  }, [profile]);
}

export function usePreferenceSetters() {
  const updateProfile = useUpdateProfile();

  return {
    setTheme(theme: ThemePreference) {
      useThemeStore.getState().setPreference(theme);
      updateProfile.mutate({ theme });
    },
    setLanguage(language: LanguagePreference) {
      useLanguageStore.getState().setPreference(language);
      updateProfile.mutate({ language: language === 'system' ? null : language });
    },
  };
}
