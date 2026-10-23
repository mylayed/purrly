import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';

import type { Database } from '@/api/database.types';
import { supabase } from '@/api/supabase';

type Tables = Database['public']['Tables'];
export type Food = Tables['cat_foods']['Row'];
export type FoodKind = Database['public']['Enums']['food_kind'];
export type FeedingSlot = Tables['feeding_schedule']['Row'];
export type Meal = Tables['meals']['Row'];

export const feedingKeys = {
  foods: (catId: string) => ['cat_foods', catId] as const,
  schedule: (catId: string) => ['feeding_schedule', catId] as const,
  meals: (catId: string) => ['meals', catId] as const,
};

// Журнал показує останні дні; старіші годування лишаються в базі й в експорті.
export const MEALS_HISTORY_DAYS = 30;

export function useFoods(catId: string) {
  return useQuery({
    queryKey: feedingKeys.foods(catId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cat_foods')
        .select('*')
        .eq('cat_id', catId)
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function useFeedingSchedule(catId: string) {
  return useQuery({
    queryKey: feedingKeys.schedule(catId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feeding_schedule')
        .select('*')
        .eq('cat_id', catId)
        .order('time_of_day');
      if (error) throw error;
      return data;
    },
  });
}

// Годування за останні MEALS_HISTORY_DAYS днів, від нових до старих.
export function useMeals(catId: string) {
  return useQuery({
    queryKey: feedingKeys.meals(catId),
    queryFn: async () => {
      const since = new Date();
      since.setHours(0, 0, 0, 0);
      since.setDate(since.getDate() - MEALS_HISTORY_DAYS);
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('cat_id', catId)
        .gte('fed_at', since.toISOString())
        .order('fed_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export type FoodInput = { name: string; kind: FoodKind; kcalPer100g: number | null };

export function useSaveFood(catId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: FoodInput }) => {
      const row = { name: input.name, kind: input.kind, kcal_per_100g: input.kcalPer100g };
      const { data, error } = id
        ? await supabase.from('cat_foods').update(row).eq('id', id).select().single()
        : await supabase
            .from('cat_foods')
            .insert({ ...row, cat_id: catId })
            .select()
            .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: feedingKeys.foods(catId) }),
  });
}

export type SlotInput = {
  timeOfDay: string;
  daysOfWeek: number[];
  food: Pick<Food, 'id' | 'name'> | null;
  grams: number | null;
  enabled: boolean;
};

export function useSaveSlot(catId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: SlotInput }) => {
      const row = {
        time_of_day: input.timeOfDay,
        days_of_week: input.daysOfWeek,
        food_id: input.food?.id ?? null,
        food_name: input.food?.name ?? null,
        amount_grams: input.grams,
        enabled: input.enabled,
      };
      const { error } = id
        ? await supabase.from('feeding_schedule').update(row).eq('id', id)
        : await supabase.from('feeding_schedule').insert({ ...row, cat_id: catId });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: feedingKeys.schedule(catId) }),
  });
}

export type MealInput = {
  fedAt: string;
  food: Pick<Food, 'id' | 'name'> | null;
  grams: number | null;
  scheduleId: string | null;
  note: string | null;
};

export function useAddMeal(catId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: MealInput) => {
      const { error } = await supabase.from('meals').insert({
        cat_id: catId,
        fed_at: input.fedAt,
        food_id: input.food?.id ?? null,
        food_name: input.food?.name ?? null,
        amount_grams: input.grams,
        schedule_id: input.scheduleId,
        note: input.note,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: feedingKeys.meals(catId) }),
  });
}

// Оптимістичне видалення: рядок зникає одразу, при помилці повертається.
function useDeleteRow<T extends { id: string }>(
  table: 'cat_foods' | 'feeding_schedule' | 'meals',
  key: QueryKey,
  // Видалення корму чи слота обнуляє посилання в інших таблицях — їх теж оновлюємо.
  alsoInvalidate: QueryKey[] = [],
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<T[]>(key);
      queryClient.setQueryData<T[]>(key, (rows) => rows?.filter((r) => r.id !== id));
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () =>
      Promise.all(
        [key, ...alsoInvalidate].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ),
  });
}

export function useDeleteFood(catId: string) {
  return useDeleteRow<Food>('cat_foods', feedingKeys.foods(catId), [
    feedingKeys.schedule(catId),
    feedingKeys.meals(catId),
  ]);
}

export function useDeleteSlot(catId: string) {
  return useDeleteRow<FeedingSlot>('feeding_schedule', feedingKeys.schedule(catId), [
    feedingKeys.meals(catId),
  ]);
}

export function useDeleteMeal(catId: string) {
  return useDeleteRow<Meal>('meals', feedingKeys.meals(catId));
}
