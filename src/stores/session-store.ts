import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { supabase } from '@/api/supabase';

type SessionState = {
  session: Session | null;
  // true після першої перевірки збереженої сесії
  initialized: boolean;
};

export const useSessionStore = create<SessionState>()(() => ({
  session: null,
  initialized: false,
}));

// Підписка на зміни сесії. Supabase сам зберігає сесію, тож тут лише дзеркало для UI.
export function startSessionSync() {
  supabase.auth.getSession().then(({ data }) => {
    useSessionStore.setState({ session: data.session, initialized: true });
  });

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    useSessionStore.setState({ session, initialized: true });
  });

  return () => data.subscription.unsubscribe();
}
