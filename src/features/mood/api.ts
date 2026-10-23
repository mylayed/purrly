import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '@/api/supabase';
import i18n from '@/i18n';
import { feedKeys } from '@/features/feed/api';

export const MOODS = [
  'sleepy',
  'playful',
  'curious',
  'grumpy',
  'cozy',
  'hungry',
  'zen',
  'sassy',
  'alert',
  'affectionate',
] as const;
export type Mood = (typeof MOODS)[number];

export function isMood(value: string | null | undefined): value is Mood {
  return MOODS.includes(value as Mood);
}

export type MoodResult =
  | { hasCat: true; mood: Mood; caption: string; cached: boolean; remaining: number | null }
  | { hasCat: false; remaining: number | null };

// Помилки сервера, які показуємо людськими словами.
export type MoodErrorCode = 'limit' | 'busy' | 'no_result' | 'not_found' | 'failed';

export class MoodError extends Error {
  constructor(
    readonly code: MoodErrorCode,
    readonly resetsAt: string | null = null,
  ) {
    super(code);
  }
}

async function requestMood(photoId: string): Promise<MoodResult> {
  // Мова підпису — мова інтерфейсу.
  const { data, error } = await supabase.functions.invoke('ai-mood', {
    method: 'POST',
    body: { photoId, language: i18n.language },
  });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body = (await error.context.json().catch(() => ({}))) as {
        error?: string;
        resetsAt?: string | null;
      };
      const code = (['limit', 'busy', 'no_result', 'not_found'] as const).find(
        (c) => c === body.error,
      );
      throw new MoodError(code ?? 'failed', body.resetsAt ?? null);
    }
    throw new MoodError('failed');
  }
  return data as MoodResult;
}

// AI-настрій фото. Результат зберігає сервер, тож після успіху оновлюємо стрічку.
export function useMoodOfPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requestMood,
    onSuccess: (result) => {
      if (result.hasCat) return queryClient.invalidateQueries({ queryKey: feedKeys.all });
    },
  });
}
