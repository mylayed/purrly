import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Database } from '@/api/database.types';
import { removeFiles, uploadImage, useSignedUrl } from '@/api/storage';
import { supabase } from '@/api/supabase';
import { useSessionStore } from '@/stores/session-store';

export type Cat = Database['public']['Tables']['cats']['Row'];
export type CatSex = Database['public']['Enums']['cat_sex'];
export type CatRole = Database['public']['Enums']['cat_member_role'];
export type CatInput = Pick<
  Cat,
  'name' | 'breed' | 'birth_date' | 'sex' | 'sterilized' | 'chip_number'
>;

export const MAX_CAT_NAME_LENGTH = 50;
const PHOTO_BUCKET = 'cat-photos' as const;
const PHOTO_SIZE = 1024;

export const catKeys = {
  all: ['cats'] as const,
  detail: (id: string) => ['cats', id] as const,
  role: (id: string) => ['cats', id, 'role'] as const,
};

// Усі коти, де користувач — учасник (RLS). Архівні теж: їх показуємо окремо.
export function useCats() {
  return useQuery({
    queryKey: catKeys.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cats')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useCat(id: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: catKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase.from('cats').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    // Поки вантажиться, показуємо кота зі списку, якщо він уже є.
    initialData: () => queryClient.getQueryData<Cat[]>(catKeys.all)?.find((c) => c.id === id),
  });
}

export function useCatRole(id: string) {
  const userId = useSessionStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: catKeys.role(id),
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cat_members')
        .select('role')
        .eq('cat_id', id)
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) throw error;
      return data?.role ?? null;
    },
  });
}

export function useCatPhotoUrl(path: string | null | undefined) {
  return useSignedUrl(PHOTO_BUCKET, path);
}

function useInvalidateCats() {
  const queryClient = useQueryClient();
  return (cat?: Cat) => {
    if (cat) queryClient.setQueryData(catKeys.detail(cat.id), cat);
    return queryClient.invalidateQueries({ queryKey: catKeys.all, exact: true });
  };
}

async function setCatPhoto(cat: Cat, uri: string) {
  // Шлях {cat_id}/… — так вимагає політика бакета (доступ лише учасникам кота).
  const path = `${cat.id}/profile-${Date.now()}.jpg`;
  await uploadImage(PHOTO_BUCKET, path, uri, PHOTO_SIZE);
  const { data, error } = await supabase
    .from('cats')
    .update({ photo_path: path })
    .eq('id', cat.id)
    .select()
    .single();
  if (error) throw error;
  if (cat.photo_path) await removeFiles(PHOTO_BUCKET, [cat.photo_path]);
  return data;
}

export function useCreateCat() {
  const invalidate = useInvalidateCats();
  return useMutation({
    mutationFn: async ({ input, photoUri }: { input: CatInput; photoUri: string | null }) => {
      // Власником кота робить тригер у базі (handle_new_cat).
      const { data, error } = await supabase.from('cats').insert(input).select().single();
      if (error) throw error;
      // Фото — після створення: для шляху потрібен id кота.
      return photoUri ? setCatPhoto(data, photoUri) : data;
    },
    onSuccess: (cat) => invalidate(cat),
  });
}

export function useUpdateCat(cat: Cat) {
  const invalidate = useInvalidateCats();
  return useMutation({
    mutationFn: async ({ input, photoUri }: { input: CatInput; photoUri: string | null }) => {
      const { data, error } = await supabase
        .from('cats')
        .update(input)
        .eq('id', cat.id)
        .select()
        .single();
      if (error) throw error;
      return photoUri ? setCatPhoto(data, photoUri) : data;
    },
    onSuccess: (updated) => invalidate(updated),
  });
}

export function useSetCatArchived(cat: Cat) {
  const invalidate = useInvalidateCats();
  return useMutation({
    mutationFn: async (archived: boolean) => {
      const { data, error } = await supabase
        .from('cats')
        .update({ archived_at: archived ? new Date().toISOString() : null })
        .eq('id', cat.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (updated) => invalidate(updated),
  });
}

// Лише власник (RLS). Записи кота видаляє каскад у базі, файли — прибираємо самі.
// Порядок важливий: файли можна видалити лише поки ми учасник кота, тож спершу
// переконуємось, що ми власник (інакше член сім'ї стер би фото, а кіт лишився б).
export function useDeleteCat(cat: Cat) {
  const queryClient = useQueryClient();
  const userId = useSessionStore((s) => s.session?.user.id);
  return useMutation({
    mutationFn: async () => {
      const { data: membership, error: roleError } = await supabase
        .from('cat_members')
        .select('role')
        .eq('cat_id', cat.id)
        .eq('user_id', userId!)
        .maybeSingle();
      if (roleError) throw roleError;
      if (membership?.role !== 'owner') throw new Error('Only the owner can delete a cat');

      const { data: files } = await supabase.storage
        .from(PHOTO_BUCKET)
        .list(cat.id, { limit: 1000 });
      await removeFiles(
        PHOTO_BUCKET,
        (files ?? []).map((file) => `${cat.id}/${file.name}`),
      );

      const { error, count } = await supabase
        .from('cats')
        .delete({ count: 'exact' })
        .eq('id', cat.id);
      if (error) throw error;
      if (count === 0) throw new Error('Cat was not deleted (not the owner?)');
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: catKeys.detail(cat.id) });
      return queryClient.invalidateQueries({ queryKey: catKeys.all, exact: true });
    },
  });
}
