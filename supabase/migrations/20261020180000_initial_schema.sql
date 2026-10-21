-- Purrly: початкова схема MVP (PLAN.md, розділ 4).
-- Принцип доступу: дані кота бачать і змінюють лише його учасники з cat_members.

-- ─── Типи ──────────────────────────────────────────────────────────────────

create type public.cat_sex as enum ('male', 'female', 'unknown');
create type public.cat_member_role as enum ('owner', 'family');
create type public.vet_event_type as enum ('vaccination', 'deworming', 'flea_tick', 'visit', 'other');
create type public.litter_kind as enum ('pee', 'poop', 'both');
create type public.reminder_type as enum ('feeding', 'medication', 'vaccination', 'vet_visit', 'custom');
create type public.weight_unit as enum ('kg', 'lb');
create type public.theme_preference as enum ('system', 'light', 'dark');

-- ─── Службові функції ──────────────────────────────────────────────────────

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── Профілі ───────────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_path text,
  -- null = мова пристрою
  language text check (language in ('uk', 'en', 'pl', 'de', 'es')),
  theme public.theme_preference not null default 'system',
  weight_unit public.weight_unit not null default 'kg',
  -- Змінює лише сервер (вебхук RevenueCat), не клієнт.
  is_plus boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Профіль створюється автоматично під час реєстрації (Google / Apple).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ─── Коти та учасники ──────────────────────────────────────────────────────

create table public.cats (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 50),
  photo_path text,
  breed text,
  birth_date date,
  sex public.cat_sex not null default 'unknown',
  sterilized boolean,
  chip_number text,
  archived_at timestamptz,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger cats_updated_at
before update on public.cats
for each row execute function public.set_updated_at();

create table public.cat_members (
  cat_id uuid not null references public.cats (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.cat_member_role not null,
  created_at timestamptz not null default now(),
  primary key (cat_id, user_id)
);

create index cat_members_user_id_idx on public.cat_members (user_id);

-- Той, хто створив кота, автоматично стає його власником.
create function public.handle_new_cat()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.cat_members (cat_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

create trigger on_cat_created
after insert on public.cats
for each row execute function public.handle_new_cat();

-- security definer, щоб політики на cat_members не викликали самі себе рекурсивно.
create function public.is_cat_member(p_cat_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.cat_members
    where cat_id = p_cat_id and user_id = (select auth.uid())
  );
$$;

create function public.is_cat_owner(p_cat_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.cat_members
    where cat_id = p_cat_id and user_id = (select auth.uid()) and role = 'owner'
  );
$$;

-- ─── Записи про кота ───────────────────────────────────────────────────────

-- Вага зберігається в грамах; кг/фунти — лише відображення.
create table public.weights (
  id uuid primary key default gen_random_uuid(),
  cat_id uuid not null references public.cats (id) on delete cascade,
  measured_at timestamptz not null default now(),
  weight_grams integer not null check (weight_grams between 50 and 30000),
  note text,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  cat_id uuid not null references public.cats (id) on delete cascade,
  fed_at timestamptz not null default now(),
  food_name text,
  amount_grams numeric(6, 1) check (amount_grams > 0),
  note text,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.feeding_schedule (
  id uuid primary key default gen_random_uuid(),
  cat_id uuid not null references public.cats (id) on delete cascade,
  time_of_day time not null,
  -- 1 = понеділок … 7 = неділя (ISO)
  days_of_week smallint[] not null default '{1,2,3,4,5,6,7}'
    check (days_of_week <@ '{1,2,3,4,5,6,7}'::smallint[]),
  food_name text,
  amount_grams numeric(6, 1) check (amount_grams > 0),
  enabled boolean not null default true,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger feeding_schedule_updated_at
before update on public.feeding_schedule
for each row execute function public.set_updated_at();

create table public.vet_events (
  id uuid primary key default gen_random_uuid(),
  cat_id uuid not null references public.cats (id) on delete cascade,
  type public.vet_event_type not null,
  title text,
  occurred_on date not null,
  next_due_on date,
  clinic text,
  note text,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger vet_events_updated_at
before update on public.vet_events
for each row execute function public.set_updated_at();

create table public.litter_events (
  id uuid primary key default gen_random_uuid(),
  cat_id uuid not null references public.cats (id) on delete cascade,
  occurred_at timestamptz not null default now(),
  kind public.litter_kind not null,
  note text,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  cat_id uuid not null references public.cats (id) on delete cascade,
  type public.reminder_type not null,
  title text,
  starts_at timestamptz not null,
  -- RRULE (RFC 5545); null = одноразове нагадування
  repeat_rule text,
  vet_event_id uuid references public.vet_events (id) on delete cascade,
  enabled boolean not null default true,
  -- Хто й коли виконав — щоб у решти учасників нагадування зникало.
  last_done_at timestamptz,
  last_done_by uuid references auth.users (id) on delete set null,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger reminders_updated_at
before update on public.reminders
for each row execute function public.set_updated_at();

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  cat_id uuid not null references public.cats (id) on delete cascade,
  -- Шлях у бакеті cat-photos: {cat_id}/{файл}
  storage_path text not null,
  taken_at timestamptz not null default now(),
  caption text,
  mood text,
  mood_caption text,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  cat_id uuid not null references public.cats (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  noted_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger notes_updated_at
before update on public.notes
for each row execute function public.set_updated_at();

-- Лічильник AI-запитів для лімітів Free. Пишуть лише Edge Functions (service role).
create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  created_at timestamptz not null default now()
);

create index ai_usage_user_kind_created_idx on public.ai_usage (user_id, kind, created_at desc);

-- Індекси для стрічок «останні записи кота».
create index weights_cat_measured_idx on public.weights (cat_id, measured_at desc);
create index meals_cat_fed_idx on public.meals (cat_id, fed_at desc);
create index feeding_schedule_cat_idx on public.feeding_schedule (cat_id);
create index vet_events_cat_occurred_idx on public.vet_events (cat_id, occurred_on desc);
create index litter_events_cat_occurred_idx on public.litter_events (cat_id, occurred_at desc);
create index reminders_cat_idx on public.reminders (cat_id);
create index photos_cat_taken_idx on public.photos (cat_id, taken_at desc);
create index notes_cat_noted_idx on public.notes (cat_id, noted_at desc);

-- ─── RLS ───────────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.cats enable row level security;
alter table public.cat_members enable row level security;
alter table public.weights enable row level security;
alter table public.meals enable row level security;
alter table public.feeding_schedule enable row level security;
alter table public.vet_events enable row level security;
alter table public.litter_events enable row level security;
alter table public.reminders enable row level security;
alter table public.photos enable row level security;
alter table public.notes enable row level security;
alter table public.ai_usage enable row level security;

-- Профіль: лише свій. Створює тригер, видаляє каскад з auth.users.
create policy "profiles: read own" on public.profiles
for select to authenticated using (id = (select auth.uid()));

create policy "profiles: update own" on public.profiles
for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- is_plus клієнт змінити не може: оновлення дозволено лише цим колонкам.
revoke update on public.profiles from authenticated;
grant update (display_name, avatar_path, language, theme, weight_unit)
on public.profiles to authenticated;

-- Коти: бачать і редагують учасники, видаляє лише власник.
-- created_by у читанні потрібен для insert(...).select(): рядок у cat_members додає тригер
-- уже після перевірки RETURNING.
create policy "cats: read as member" on public.cats
for select to authenticated
using (public.is_cat_member(id) or created_by = (select auth.uid()));

create policy "cats: create own" on public.cats
for insert to authenticated with check (created_by = (select auth.uid()));

create policy "cats: update as member" on public.cats
for update to authenticated
using (public.is_cat_member(id)) with check (public.is_cat_member(id));

create policy "cats: delete as owner" on public.cats
for delete to authenticated using (public.is_cat_owner(id));

-- Учасники: бачать усі учасники кота; керує власник; член сім'ї може вийти сам.
-- Власник не може понизити чи видалити себе, щоб кіт не лишився без власника
-- (свого кота він видаляє цілком). Додавання — лише тригером або (у v2) через запрошення.
create policy "cat_members: read as member" on public.cat_members
for select to authenticated using (public.is_cat_member(cat_id));

create policy "cat_members: owner updates others" on public.cat_members
for update to authenticated
using (public.is_cat_owner(cat_id) and user_id <> (select auth.uid()))
with check (public.is_cat_owner(cat_id) and user_id <> (select auth.uid()));

create policy "cat_members: owner removes others or member leaves" on public.cat_members
for delete to authenticated
using (
  (public.is_cat_owner(cat_id) and user_id <> (select auth.uid()))
  or (user_id = (select auth.uid()) and role <> 'owner')
);

-- Записи про кота: повний доступ для всіх учасників; автор — завжди поточний користувач.
do $$
declare
  t text;
begin
  foreach t in array array[
    'weights', 'meals', 'feeding_schedule', 'vet_events',
    'litter_events', 'reminders', 'photos', 'notes'
  ]
  loop
    execute format(
      'create policy "%1$s: read as member" on public.%1$I
       for select to authenticated using (public.is_cat_member(cat_id))', t);
    execute format(
      'create policy "%1$s: create as member" on public.%1$I
       for insert to authenticated
       with check (public.is_cat_member(cat_id) and created_by = (select auth.uid()))', t);
    execute format(
      'create policy "%1$s: update as member" on public.%1$I
       for update to authenticated
       using (public.is_cat_member(cat_id)) with check (public.is_cat_member(cat_id))', t);
    execute format(
      'create policy "%1$s: delete as member" on public.%1$I
       for delete to authenticated using (public.is_cat_member(cat_id))', t);
  end loop;
end;
$$;

-- AI-ліміти: користувач бачить лише свої записи, писати не може.
create policy "ai_usage: read own" on public.ai_usage
for select to authenticated using (user_id = (select auth.uid()));

-- ─── Storage ───────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('cat-photos', 'cat-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  ('avatars', 'avatars', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

-- Безпечний розбір uuid з першої папки шляху: кривий шлях не ламає запит, а просто не проходить.
create function public.storage_cat_id(object_name text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
begin
  return (storage.foldername(object_name))[1]::uuid;
exception when others then
  return null;
end;
$$;

-- cat-photos: {cat_id}/{файл} — доступ учасникам кота.
create policy "cat-photos: read as member" on storage.objects
for select to authenticated
using (bucket_id = 'cat-photos' and public.is_cat_member(public.storage_cat_id(name)));

create policy "cat-photos: upload as member" on storage.objects
for insert to authenticated
with check (bucket_id = 'cat-photos' and public.is_cat_member(public.storage_cat_id(name)));

create policy "cat-photos: update as member" on storage.objects
for update to authenticated
using (bucket_id = 'cat-photos' and public.is_cat_member(public.storage_cat_id(name)));

create policy "cat-photos: delete as member" on storage.objects
for delete to authenticated
using (bucket_id = 'cat-photos' and public.is_cat_member(public.storage_cat_id(name)));

-- avatars: {user_id}/{файл} — лише власний.
create policy "avatars: read own" on storage.objects
for select to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars: upload own" on storage.objects
for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars: update own" on storage.objects
for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars: delete own" on storage.objects
for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
