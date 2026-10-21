import { supabase } from '@/api/supabase';

import { signOutFromGoogle } from './google-sign-in';

export { isAppleSignInAvailable, signInWithApple } from './apple-sign-in';
export { MIN_PASSWORD_LENGTH, signInWithEmail, signUpWithEmail } from './email-auth';
export { AuthCancelledError, AuthError, type AuthErrorReason } from './errors';
export { signInWithGoogle } from './google-sign-in';
export { useAuthDeepLink } from './use-auth-deep-link';

export async function signOut() {
  await supabase.auth.signOut();
  // Вихід із Google — не критичний: сесію Supabase вже завершено.
  await signOutFromGoogle().catch(() => {});
}
