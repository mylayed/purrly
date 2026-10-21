-- Функції з security definer не мають бути доступні через /rest/v1/rpc.
-- Порадник Supabase: 0028 / 0029 *_security_definer_function_executable.

-- Перевірки членства потрібні лише політикам RLS. Схема private не відкрита в API,
-- а політики посилаються на функції за OID, тож перенесення їх не ламає.
create schema if not exists private;

alter function public.is_cat_member(uuid) set schema private;
alter function public.is_cat_owner(uuid) set schema private;

revoke execute on function private.is_cat_member(uuid) from public, anon;
revoke execute on function private.is_cat_owner(uuid) from public, anon;

-- Політики виконуються від імені користувача, тож authenticated потрібен доступ.
grant usage on schema private to authenticated;
grant execute on function private.is_cat_member(uuid) to authenticated;
grant execute on function private.is_cat_owner(uuid) to authenticated;

-- Тригерні функції ніхто не викликає напряму; тригери спрацьовують і без EXECUTE.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_new_cat() from public, anon, authenticated;
