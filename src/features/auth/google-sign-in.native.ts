import Constants, { ExecutionEnvironment } from 'expo-constants';

import { supabase } from '@/api/supabase';

import { AuthCancelledError, AuthError } from './errors';

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

// Нативного модуля Google Sign-In немає в Expo Go — лише в development build.
// Тому модуль завантажуємо ліниво: інакше застосунок падав би в Expo Go ще на старті.
async function loadGoogleSignin() {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    throw new AuthError('expoGo');
  }
  if (!webClientId) {
    throw new AuthError('notConfigured');
  }

  const module = await import('@react-native-google-signin/google-signin');
  module.GoogleSignin.configure({ webClientId, iosClientId });
  return module;
}

export async function signInWithGoogle() {
  const { GoogleSignin, statusCodes } = await loadGoogleSignin();

  let idToken: string | null;
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (response.type === 'cancelled') {
      throw new AuthCancelledError();
    }
    idToken = response.data.idToken;
  } catch (error) {
    if (error instanceof AuthCancelledError) throw error;
    const code = (error as { code?: string }).code;
    if (code === statusCodes.SIGN_IN_CANCELLED || code === statusCodes.IN_PROGRESS) {
      throw new AuthCancelledError();
    }
    if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new AuthError('playServices', { cause: error });
    }
    throw new AuthError('generic', { cause: error });
  }

  if (!idToken) {
    throw new AuthError('generic', { cause: new Error('Google returned no idToken') });
  }

  // Бібліотека не передає nonce, тож у Supabase для Google увімкнено «Skip nonce check».
  const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
  if (error) {
    throw new AuthError('generic', { cause: error });
  }
}

export async function signOutFromGoogle() {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient || !webClientId) {
    return;
  }
  const { GoogleSignin } = await loadGoogleSignin();
  // Щоб наступного разу можна було обрати інший акаунт Google.
  await GoogleSignin.signOut();
}
