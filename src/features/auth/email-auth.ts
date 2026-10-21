import { isAuthApiError } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { supabase } from '@/api/supabase';

import { AuthError, type AuthErrorReason } from './errors';

export const MIN_PASSWORD_LENGTH = 8;

const errorReasons: Partial<Record<string, AuthErrorReason>> = {
  invalid_credentials: 'invalidCredentials',
  email_not_confirmed: 'emailNotConfirmed',
  weak_password: 'weakPassword',
  email_address_invalid: 'invalidEmail',
  validation_failed: 'invalidEmail',
  over_email_send_rate_limit: 'rateLimit',
  over_request_rate_limit: 'rateLimit',
};

function toAuthError(error: unknown) {
  const reason = (isAuthApiError(error) && error.code && errorReasons[error.code]) || 'generic';
  return new AuthError(reason, { cause: error });
}

// Куди веде посилання з листа-підтвердження: у web — на цей самий сайт,
// на телефоні — у застосунок (purrly://), де код обмінюється на сесію.
function emailRedirectUrl() {
  return Platform.OS === 'web' ? window.location.origin : Linking.createURL('/');
}

export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw toAuthError(error);
}

// Повертає true, якщо треба підтвердити email (сесії ще немає).
// Для вже зареєстрованої адреси Supabase навмисно відповідає так само —
// щоб не розкривати, хто має акаунт.
export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { emailRedirectTo: emailRedirectUrl() },
  });
  if (error) throw toAuthError(error);
  return { needsConfirmation: data.session === null };
}

// Посилання з листа відкриває застосунок з ?code=… — завершуємо вхід.
export async function completeAuthFromUrl(url: string) {
  const { queryParams } = Linking.parse(url);
  const code = queryParams?.code;
  if (typeof code !== 'string') return;
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) console.warn('Email link sign-in failed', error);
}
