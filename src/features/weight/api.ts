import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Database } from '@/api/database.types';
import { supabase } from '@/api/supabase';

export type WeightEntry = Database['public']['Tables']['weights']['Row'];

export const weightKeys = {
  forCat: (catId: string) => ['weights', catId] as const,
};

// Усі виміри кота, від старих до нових. Навіть щоденне зважування за 10 років —
// кілька тисяч рядків, тож вантажимо все й фільтруємо період на клієнті.
export function useWeights(catId: string) {
  return useQuery({
    queryKey: weightKeys.forCat(catId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weights')
        .select('*')
        .eq('cat_id', catId)
        .order('measured_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddWeight(catId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { grams: number; measuredAt: string; note: string | null }) => {
      const { data, error } = await supabase
        .from('weights')
        .insert({
          cat_id: catId,
          weight_grams: input.grams,
          measured_at: input.measuredAt,
          note: input.note,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: weightKeys.forCat(catId) }),
  });
}

export function useDeleteWeight(catId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('weights').delete().eq('id', id);
      if (error) throw error;
    },
    // Оптимістично: рядок зникає одразу, при помилці повертається.
    onMutate: async (id) => {
      const key = weightKeys.forCat(catId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<WeightEntry[]>(key);
      queryClient.setQueryData<WeightEntry[]>(key, (rows) => rows?.filter((r) => r.id !== id));
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(weightKeys.forCat(catId), context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: weightKeys.forCat(catId) }),
  });
}
