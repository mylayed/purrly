import { supabase } from '@/api/supabase';

import { saveJsonFile } from './save-json-file';

// Таблиці з даними котів. RLS сам обмежує вибірку котами, де користувач — учасник.
const catTables = [
  'cats',
  'cat_members',
  'weights',
  'cat_foods',
  'meals',
  'feeding_schedule',
  'vet_events',
  'litter_events',
  'reminders',
  'photos',
  'notes',
] as const;

// Експорт усіх даних користувача (право на перенесення даних, GDPR).
// Окрема серверна функція не потрібна: правила доступу вже віддають лише його дані.
export async function exportMyData() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const user = userData.user;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  if (profileError) throw profileError;

  const { data: aiUsage, error: aiError } = await supabase
    .from('ai_usage')
    .select('*')
    .eq('user_id', user.id);
  if (aiError) throw aiError;

  const tables: Record<string, unknown[]> = {};
  for (const table of catTables) {
    const { data, error } = await supabase.from(table).select('*');
    if (error) throw error;
    tables[table] = data;
  }

  const exported = {
    format: 'purrly-export',
    version: 1,
    exported_at: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      sign_in_providers: user.app_metadata.providers ?? [user.app_metadata.provider],
    },
    profile,
    ai_usage: aiUsage,
    ...tables,
  };

  const date = exported.exported_at.slice(0, 10);
  await saveJsonFile(`purrly-export-${date}.json`, JSON.stringify(exported, null, 2));
}
