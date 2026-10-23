import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Database } from '@/api/database.types';
import { supabase } from '@/api/supabase';
import { LITTER_DAYS } from '@/lib/litter';

export type LitterEvent = Database['public']['Tables']['litter_events']['Row'];
export type LitterKind = Database['public']['Enums']['litter_kind'];

export const litterKeys = {
  forCat: (catId: string) => ['litter_events', catId] as const,
};

// Позначки за останні LITTER_DAYS днів, від нових до старих.
export function useLitterEvents(catId: string) {
  return useQuery({
    queryKey: litterKeys.forCat(catId),
    queryFn: async () => {
      const since = new Date();
      since.setHours(0, 0, 0, 0);
      since.setDate(since.getDate() - (LITTER_DAYS - 1));
      const { data, error } = await supabase
        .from('litter_events')
        .select('*')
        .eq('cat_id', catId)
        .gte('occurred_at', since.toISOString())
        .order('occurred_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// Позначка одним дотиком: рядок з'являється одразу, без очікування сервера.
export function useAddLitter(catId: string) {
  const queryClient = useQueryClient();
  const key = litterKeys.forCat(catId);
  return useMutation({
    mutationFn: async ({
      id,
      kind,
      occurredAt,
    }: {
      id: string;
      kind: LitterKind;
      occurredAt: string;
    }) => {
      const { error } = await supabase
        .from('litter_events')
        .insert({ id, cat_id: catId, kind, occurred_at: occurredAt });
      if (error) throw error;
    },
    onMutate: async ({ id, kind, occurredAt }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<LitterEvent[]>(key);
      const optimistic: LitterEvent = {
        id,
        cat_id: catId,
        kind,
        occurred_at: occurredAt,
        note: null,
        created_by: null,
        created_at: occurredAt,
      };
      queryClient.setQueryData<LitterEvent[]>(key, (rows) => [optimistic, ...(rows ?? [])]);
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

export function useDeleteLitter(catId: string) {
  const queryClient = useQueryClient();
  const key = litterKeys.forCat(catId);
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('litter_events').delete().eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<LitterEvent[]>(key);
      queryClient.setQueryData<LitterEvent[]>(key, (rows) => rows?.filter((r) => r.id !== id));
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}
