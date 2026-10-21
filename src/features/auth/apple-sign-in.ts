import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

import { supabase } from '@/api/supabase';

import { AuthCancelledError, AuthError } from './errors';

// Нативний вхід через Apple є лише на iOS. На Android Apple не обов'язковий для сторів.
export async function isAppleSignInAvailable() {
  return Platform.OS === 'ios' && (await AppleAuthentication.isAvailableAsync());
}

export async function signInWithApple() {
  // Nonce захищає від повторного використання токена: Apple отримує хеш,
  // Supabase — оригінал і звіряє їх.
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);

  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
  } catch (error) {
    if ((error as { code?: string }).code === 'ERR_REQUEST_CANCELED') {
      throw new AuthCancelledError();
    }
    throw new AuthError('generic', { cause: error });
  }

  if (!credential.identityToken) {
    throw new AuthError('generic', { cause: new Error('Apple returned no identityToken') });
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: rawNonce,
  });
  if (error) {
    throw new AuthError('generic', { cause: error });
  }

  // Apple віддає ім'я лише під час першого входу, і його немає в токені,
  // тож профіль, створений тригером, ще без імені — зберігаємо зараз.
  const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
    .filter(Boolean)
    .join(' ');
  if (fullName && data.user) {
    await supabase.auth.updateUser({ data: { full_name: fullName } });
    await supabase
      .from('profiles')
      .update({ display_name: fullName })
      .eq('id', data.user.id)
      .is('display_name', null);
  }
}
