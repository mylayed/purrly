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

export async function signOut() {
  await supabase.auth.signOut();
  // Вихід із Google — не критичний: сесію Supabase вже завершено.
  await signOutFromGoogle().catch(() => {});
  // Щоб наступний користувач на цьому пристрої не побачив чужих даних.
  queryClient.clear();
}
