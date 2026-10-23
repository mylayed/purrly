import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Database } from '@/api/database.types';
import { supabase } from '@/api/supabase';

export type VetEvent = Database['public']['Tables']['vet_events']['Row'];
export type VetEventType = Database['public']['Enums']['vet_event_type'];

export const vetKeys = {
  forCat: (catId: string) => ['vet_events', catId] as const,
};

// Усі записи кота, від нових до старих: їх небагато (кілька на рік).
export function useVetEvents(catId: string) {
  return useQuery({
    queryKey: vetKeys.forCat(catId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vet_events')
        .select('*')
        .eq('cat_id', catId)
        .order('occurred_on', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export type VetEventInput = {
  type: VetEventType;
  title: string | null;
  occurredOn: string;
  nextDueOn: string | null;
  clinic: string | null;
  note: string | null;
};

export function useSaveVetEvent(catId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: VetEventInput }) => {
      const row = {
        type: input.type,
        title: input.title,
        occurred_on: input.occurredOn,
        next_due_on: input.nextDueOn,
        clinic: input.clinic,
        note: input.note,
      };
      const { error } = id
        ? await supabase.from('vet_events').update(row).eq('id', id)
        : await supabase.from('vet_events').insert({ ...row, cat_id: catId });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vetKeys.forCat(catId) }),
  });
}

export function useDeleteVetEvent(catId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('vet_events').delete().eq('id', id);
      if (error) throw error;
    },
    // Оптимістично: рядок зникає одразу, при помилці повертається.
    onMutate: async (id) => {
      const key = vetKeys.forCat(catId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<VetEvent[]>(key);
      queryClient.setQueryData<VetEvent[]>(key, (rows) => rows?.filter((r) => r.id !== id));
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(vetKeys.forCat(catId), context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: vetKeys.forCat(catId) }),
  });
}
