-- Коли користувач видаляє акаунт, його записи в котах, якими він ділився з сім'єю,
-- мають лишитися в кота — без автора, а не зникнути каскадом.
-- Коти, які він створив, як і раніше видаляються разом з ним (cats.created_by cascade).
-- created_by і далі обов'язково заповнюється під час створення: це перевіряє RLS
-- (created_by = auth.uid()), тож null буває лише після видалення автора.

do $$
declare
  t text;
begin
  foreach t in array array[
    'weights', 'meals', 'feeding_schedule', 'vet_events',
    'litter_events', 'reminders', 'photos', 'notes'
  ]
  loop
    execute format('alter table public.%I alter column created_by drop not null', t);
    execute format('alter table public.%I drop constraint %I', t, t || '_created_by_fkey');
    execute format(
      'alter table public.%I add constraint %I foreign key (created_by)
       references auth.users (id) on delete set null',
      t, t || '_created_by_fkey');
  end loop;
end;
$$;
