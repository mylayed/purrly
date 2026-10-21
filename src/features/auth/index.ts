import { queryClient } from '@/api/query-client';
import { supabase } from '@/api/supabase';

import { signOutFromGoogle } from './google-sign-in';

export { isAppleSignInAvailable, signInWithApple } from './apple-sign-in';
export {
  isValidEmail,
  MIN_PASSWORD_LENGTH,
  requestPasswordReset,
  signInWithEmail,
  signUpWithEmail,
  updatePassword,
} from './email-auth';
export { getEmailDraft, setEmailDraft } from './email-draft';
export { AuthCancelledError, AuthError, type AuthErrorReason } from './errors';
export { signInWithGoogle } from './google-sign-in';
export { useAuthDeepLink } from './use-auth-deep-link';

// scope 'local' — коли сесію на сервері вже знищено (наприклад, після видалення акаунта).
export async function signOut(options?: { scope: 'local' | 'global' }) {
  await supabase.auth.signOut(options);
  // Вихід із Google — не критичний: сесію Supabase вже завершено.
  await signOutFromGoogle().catch(() => {});
  // Щоб наступний користувач на цьому пристрої не побачив чужих даних.
  queryClient.clear();
}
