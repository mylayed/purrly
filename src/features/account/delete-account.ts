import { supabase } from '@/api/supabase';
import { signOut } from '@/features/auth';

// Видаляє акаунт на сервері (Edge Function delete-account), потім прибирає
// сесію на пристрої. Сесія на сервері вже недійсна, тож вихід — лише локальний.
export async function deleteAccount() {
  const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
  if (error) throw error;
  await signOut({ scope: 'local' });
}
