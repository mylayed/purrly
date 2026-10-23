import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Database } from '@/api/database.types';
import { supabase } from '@/api/supabase';

export type Reminder = Database['public']['Tables']['reminders']['Row'];
export type ReminderType = Database['public']['Enums']['reminder_type'];

export const reminderKeys = {
  all: ['reminders'] as const,
};

// Власні нагадування (ліки тощо) усіх котів користувача — RLS обмежує учасниками.
// Годування й ветеринарію нагадуємо автоматично з графіка та «наступного разу».
export function useReminders() {
  return useQuery({
    queryKey: reminderKeys.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .is('vet_event_id', null)
        .order('starts_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export type ReminderInput = {
  catId: string;
  type: ReminderType;
  title: string;
  startsAt: string;
  repeatRule: string | null;
  enabled: boolean;
};

export function useSaveReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: ReminderInput }) => {
      const row = {
        cat_id: input.catId,
        type: input.type,
        title: input.title,
        starts_at: input.startsAt,
        repeat_rule: input.repeatRule,
        enabled: input.enabled,
      };
      const { error } = id
        ? await supabase.from('reminders').update(row).eq('id', id)
        : await supabase.from('reminders').insert(row);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reminderKeys.all }),
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reminders').delete().eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: reminderKeys.all });
      const previous = queryClient.getQueryData<Reminder[]>(reminderKeys.all);
      queryClient.setQueryData<Reminder[]>(reminderKeys.all, (rows) =>
        rows?.filter((r) => r.id !== id),
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(reminderKeys.all, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: reminderKeys.all }),
  });
}
