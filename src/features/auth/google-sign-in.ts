import { supabase } from '@/api/supabase';

import { AuthError } from './errors';

// Web: звичайний OAuth-редірект через Supabase. Повернувшись, сторінка
// підхоплює сесію з URL (detectSessionInUrl у клієнті).
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) {
    throw new AuthError('generic', { cause: error });
  }
}

export async function signOutFromGoogle() {}
