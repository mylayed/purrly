import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';

import type { Database } from '@/api/database.types';
import { removeFiles, SIGNED_URL_STALE_MS, signedUrls, uploadImage } from '@/api/storage';
import { supabase } from '@/api/supabase';

export type Note = Database['public']['Tables']['notes']['Row'];
export type Photo = Database['public']['Tables']['photos']['Row'];

export type FeedItem =
  | { kind: 'note'; id: string; catId: string; at: string; note: Note }
  | { kind: 'photo'; id: string; catId: string; at: string; photo: Photo; url: string | null };

const PHOTO_BUCKET = 'cat-photos' as const;
const PHOTO_WIDTH = 1280;
// Стрічка показує останні записи; старіші лишаються в базі й в експорті.
export const FEED_LIMIT = 100;

export const feedKeys = {
  all: ['feed'] as const,
  list: (catId: string | null) => ['feed', catId ?? 'all'] as const,
};

// Фото й нотатки (усіх котів або одного) упереміш, від нових до старих.
// RLS сам обмежує вибірку котами, де користувач — учасник.
export function useFeed(catId: string | null) {
  return useQuery({
    queryKey: feedKeys.list(catId),
    // Підписані посилання спливають — оновлюємо список раніше.
    staleTime: SIGNED_URL_STALE_MS,
    queryFn: async () => {
      let notesQuery = supabase
        .from('notes')
        .select('*')
        .order('noted_at', { ascending: false })
        .limit(FEED_LIMIT);
      let photosQuery = supabase
        .from('photos')
        .select('*')
        .order('taken_at', { ascending: false })
        .limit(FEED_LIMIT);
      if (catId) {
        notesQuery = notesQuery.eq('cat_id', catId);
        photosQuery = photosQuery.eq('cat_id', catId);
      }
      const [notes, photos] = await Promise.all([notesQuery, photosQuery]);
      if (notes.error) throw notes.error;
      if (photos.error) throw photos.error;

      const urls = await signedUrls(
        PHOTO_BUCKET,
        photos.data.map((p) => p.storage_path),
      );
      const items: FeedItem[] = [
        ...notes.data.map((note) => ({
          kind: 'note' as const,
          id: note.id,
          catId: note.cat_id,
          at: note.noted_at,
          note,
        })),
        ...photos.data.map((photo) => ({
          kind: 'photo' as const,
          id: photo.id,
          catId: photo.cat_id,
          at: photo.taken_at,
          photo,
          url: urls.get(photo.storage_path) ?? null,
        })),
      ];
      return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, FEED_LIMIT);
    },
  });
}

function useInvalidateFeed() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: feedKeys.all });
}

export function useSaveNote() {
  const invalidate = useInvalidateFeed();
  return useMutation({
    mutationFn: async ({ id, catId, body }: { id?: string; catId: string; body: string }) => {
      const { error } = id
        ? await supabase.from('notes').update({ body }).eq('id', id)
        : await supabase.from('notes').insert({ cat_id: catId, body });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useAddPhoto() {
  const invalidate = useInvalidateFeed();
  return useMutation({
    mutationFn: async ({
      catId,
      uri,
      caption,
    }: {
      catId: string;
      uri: string;
      caption: string | null;
    }) => {
      // Шлях {cat_id}/… — так вимагає політика бакета (доступ лише учасникам кота).
      const path = `${catId}/feed/${randomUUID()}.jpg`;
      await uploadImage(PHOTO_BUCKET, path, uri, PHOTO_WIDTH);
      const { error } = await supabase
        .from('photos')
        .insert({ cat_id: catId, storage_path: path, caption });
      if (error) {
        await removeFiles(PHOTO_BUCKET, [path]);
        throw error;
      }
    },
    onSuccess: invalidate,
  });
}

export function useDeleteFeedItem() {
  const invalidate = useInvalidateFeed();
  return useMutation({
    mutationFn: async (item: FeedItem) => {
      if (item.kind === 'note') {
        const { error } = await supabase.from('notes').delete().eq('id', item.id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from('photos').delete().eq('id', item.id);
      if (error) throw error;
      // Файл — після рядка: якщо видалення файлу не вдасться, він лише займає місце.
      await removeFiles(PHOTO_BUCKET, [item.photo.storage_path]);
    },
    onSuccess: invalidate,
  });
}
