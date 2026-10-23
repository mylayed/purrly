-- Free: один активний (не архівний) власний кіт. Plus — без ліміту.
-- Застосунок показує paywall раніше; тригер — захист від обходу (прямий запит до API).
-- Коти, куди користувача запросили як члена сім'ї, не рахуються.
-- Наявних котів понад ліміт не чіпаємо: перевірка лише на створення й повернення з архіву.

create function private.enforce_free_cat_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid := coalesce(new.created_by, (select auth.uid()));
  active_count int;
begin
  -- Сервісні запити (service role, міграції) не обмежуємо.
  if owner_id is null then
    return new;
  end if;
  if new.archived_at is not null then
    return new;
  end if;
  -- Оновлення, яке не повертає кота з архіву, ліміт не змінює.
  if tg_op = 'UPDATE' and old.archived_at is null then
    return new;
  end if;
  if exists (select 1 from public.profiles where id = owner_id and is_plus) then
    return new;
  end if;

  select count(*) into active_count
  from public.cats
  where created_by = owner_id and archived_at is null and id <> new.id;

  if active_count >= 1 then
    raise exception 'free_cat_limit' using errcode = 'P0001', hint = 'Purrly Plus removes the limit';
  end if;
  return new;
end;
$$;

revoke execute on function private.enforce_free_cat_limit() from public, anon, authenticated;

create trigger cats_free_limit
before insert or update of archived_at on public.cats
for each row execute function private.enforce_free_cat_limit();
