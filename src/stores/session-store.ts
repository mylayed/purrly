import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { supabase } from '@/api/supabase';

type SessionState = {
  session: Session | null;
  // true після першої перевірки збереженої сесії
  initialized: boolean;
  // Вхід за посиланням «відновити пароль»: спершу треба задати новий пароль.
  passwordRecovery: boolean;
};

export const useSessionStore = create<SessionState>()(() => ({
  session: null,
  initialized: false,
  passwordRecovery: false,
}));

export function finishPasswordRecovery() {
  useSessionStore.setState({ passwordRecovery: false });
}

// Підписуємось одразу під час імпорту, а не в ефекті: у web клієнт Supabase
// обробляє посилання з листа ще під час ініціалізації, і подію PASSWORD_RECOVERY
// можна пропустити, якщо підписатися пізніше.
// Supabase сам зберігає сесію, тож тут лише дзеркало для UI.
supabase.auth.onAuthStateChange((event, session) => {
  useSessionStore.setState((state) => ({
    session,
    initialized: true,
    passwordRecovery:
      event === 'PASSWORD_RECOVERY'
        ? true
        : event === 'SIGNED_OUT'
          ? false
          : state.passwordRecovery,
  }));
});

export function startSessionSync() {
  supabase.auth.getSession().then(({ data }) => {
    useSessionStore.setState({ session: data.session, initialized: true });
  });
}
