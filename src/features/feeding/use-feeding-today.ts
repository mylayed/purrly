import { useMemo } from 'react';

import { localDayKey, nowTimeInput, shortTime, slotsForDay } from '@/lib/feeding';

import { useFeedingSchedule, useFoods, useMeals, type Food, type Meal } from './api';

// Стан годувань на сьогодні: слоти графіка, які з них уже виконані, скільки з'їдено.
export function useFeedingToday(catId: string) {
  const foodsQuery = useFoods(catId);
  const scheduleQuery = useFeedingSchedule(catId);
  const mealsQuery = useMeals(catId);

  const today = useMemo(() => {
    const now = new Date();
    const todayKey = localDayKey(now);
    const foods = new Map<string, Food>((foodsQuery.data ?? []).map((f) => [f.id, f]));
    const meals = (mealsQuery.data ?? []).filter(
      (m) => localDayKey(new Date(m.fed_at)) === todayKey,
    );
    const slots = slotsForDay(scheduleQuery.data ?? [], now);

    const mealBySlot = new Map<string, Meal>();
    for (const meal of meals) {
      if (meal.schedule_id && !mealBySlot.has(meal.schedule_id)) {
        mealBySlot.set(meal.schedule_id, meal);
      }
    }

    const sum = (values: (number | null)[]) => values.reduce<number>((a, v) => a + (v ?? 0), 0);
    const plannedGrams = sum(slots.map((s) => s.amount_grams));
    const eatenGrams = sum(meals.map((m) => m.amount_grams));
    // Калорії — лише там, де відомі і порція, і калорійність корму.
    const eatenKcal = sum(
      meals.map((m) => {
        const food = m.food_id ? foods.get(m.food_id) : undefined;
        return m.amount_grams && food?.kcal_per_100g
          ? (m.amount_grams * food.kcal_per_100g) / 100
          : null;
      }),
    );

    const nowTime = nowTimeInput(now);
    const pending = slots.filter((s) => !mealBySlot.has(s.id));
    const next = pending.find((s) => shortTime(s.time_of_day) >= nowTime) ?? pending[0] ?? null;

    return { foods, meals, slots, mealBySlot, plannedGrams, eatenGrams, eatenKcal, next };
  }, [foodsQuery.data, scheduleQuery.data, mealsQuery.data]);

  return {
    ...today,
    isPending: foodsQuery.isPending || scheduleQuery.isPending || mealsQuery.isPending,
    isError: foodsQuery.isError || scheduleQuery.isError || mealsQuery.isError,
    refetch: () =>
      Promise.all([foodsQuery.refetch(), scheduleQuery.refetch(), mealsQuery.refetch()]),
    allFoods: foodsQuery.data ?? [],
    schedule: scheduleQuery.data ?? [],
    allMeals: mealsQuery.data ?? [],
  };
}
