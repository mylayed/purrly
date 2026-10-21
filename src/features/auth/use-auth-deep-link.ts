import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { completeAuthFromUrl } from './email-auth';

// На телефоні посилання з листа відкриває застосунок — ловимо його і завершуємо вхід.
// У web це робить сам клієнт Supabase (detectSessionInUrl).
export function useAuthDeepLink() {
  useEffect(() => {
    if (Platform.OS === 'web') return;

    Linking.getInitialURL().then((url) => {
      if (url) completeAuthFromUrl(url);
    });
    const subscription = Linking.addEventListener('url', ({ url }) => completeAuthFromUrl(url));
    return () => subscription.remove();
  }, []);
}
