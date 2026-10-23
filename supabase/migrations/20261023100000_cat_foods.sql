-- Харчування: довідник кормів кота, прив'язка годувань до корму й до слота графіка.

create type public.food_kind as enum ('dry', 'wet', 'treat', 'other');

create table public.cat_foods (
  id uuid primary key default gen_random_uuid(),
  cat_id uuid not null references public.cats (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  kind public.food_kind not null default 'dry',
  -- Метаболічна енергія з упаковки; необов'язково, потрібна лише для підрахунку ккал.
  kcal_per_100g numeric(5, 1) check (kcal_per_100g > 0 and kcal_per_100g <= 900),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Для складених ключів нижче: корм і слот можна вказати лише свого кота.
  unique (id, cat_id)
);

create trigger cat_foods_updated_at
before update on public.cat_foods
for each row execute function public.set_updated_at();

create index cat_foods_cat_idx on public.cat_foods (cat_id);

alter table public.feeding_schedule add unique (id, cat_id);

-- food_name лишається знімком назви: після видалення корму історія не порожніє.
alter table public.feeding_schedule
  add column food_id uuid,
  add foreign key (food_id, cat_id)
    references public.cat_foods (id, cat_id) on delete set null (food_id);

alter table public.meals
  add column food_id uuid,
  add column schedule_id uuid,
  add foreign key (food_id, cat_id)
    references public.cat_foods (id, cat_id) on delete set null (food_id),
  add foreign key (schedule_id, cat_id)
    references public.feeding_schedule (id, cat_id) on delete set null (schedule_id);

create index meals_schedule_idx on public.meals (schedule_id) where schedule_id is not null;
create index meals_food_idx on public.meals (food_id) where food_id is not null;
create index feeding_schedule_food_idx on public.feeding_schedule (food_id) where food_id is not null;

-- RLS — як в інших записах про кота: повний доступ для учасників, автор — поточний користувач.
alter table public.cat_foods enable row level security;

create policy "cat_foods: read as member" on public.cat_foods
for select to authenticated using (private.is_cat_member(cat_id));

create policy "cat_foods: create as member" on public.cat_foods
for insert to authenticated
with check (private.is_cat_member(cat_id) and created_by = (select auth.uid()));

create policy "cat_foods: update as member" on public.cat_foods
for update to authenticated
using (private.is_cat_member(cat_id)) with check (private.is_cat_member(cat_id));

create policy "cat_foods: delete as member" on public.cat_foods
for delete to authenticated using (private.is_cat_member(cat_id));
