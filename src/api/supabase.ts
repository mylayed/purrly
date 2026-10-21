import { createClient, processLock } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { persistStorage } from '@/stores/persist-storage';

import type { Database } from './database.types';
import { SecureSessionStorage } from './secure-session-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Не задано EXPO_PUBLIC_SUPABASE_URL або EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY — див. .env.example',
  );
}

const isWeb = Platform.OS === 'web';

export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
  auth: {
    // На телефоні сесія зашифрована; у web SecureStore немає, тож localStorage.
    storage: isWeb ? persistStorage : new SecureSessionStorage(),
    autoRefreshToken: true,
    persistSession: true,
    // У web після OAuth-редіректу сесія приходить в URL; на телефоні вхід нативний.
    detectSessionInUrl: isWeb,
    flowType: 'pkce',
    lock: processLock,
  },
});

// На телефоні оновлюємо токен лише поки застосунок на екрані.
if (!isWeb) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
