import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import type { Database } from '@/api/database.types';
import { supabase } from '@/api/supabase';
import { useSessionStore } from '@/stores/session-store';

export type Profile = Database['public']['Tables']['profiles']['Row'];
// Лише ті поля, які клієнту дозволено змінювати (див. grant у міграції).
export type ProfileUpdate = Partial<
  Pick<Profile, 'display_name' | 'avatar_path' | 'language' | 'theme' | 'weight_unit'>
>;

export const MAX_DISPLAY_NAME_LENGTH = 50;
const AVATAR_BUCKET = 'avatars';
const AVATAR_SIZE = 512;
// Підписане посилання на приватний аватар; кеш оновлюємо раніше, ніж воно спливе.
const AVATAR_URL_TTL_SECONDS = 60 * 60;

export const profileKeys = {
  profile: (userId: string) => ['profile', userId] as const,
  avatarUrl: (path: string) => ['avatar-url', path] as const,
};

function useUserId() {
  return useSessionStore((s) => s.session?.user.id ?? null);
}

export function useProfile() {
  const userId = useUserId();
  return useQuery({
    queryKey: profileKeys.profile(userId ?? 'anonymous'),
    enabled: userId !== null,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateProfile() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (changes: ProfileUpdate) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(changes)
        .eq('id', userId!)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    // Оптимістично: перемикачі в кабінеті реагують одразу, а при помилці відкочуються.
    onMutate: async (changes) => {
      if (!userId) return;
      const key = profileKeys.profile(userId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Profile>(key);
      if (previous) queryClient.setQueryData<Profile>(key, { ...previous, ...changes });
      return { previous };
    },
    onError: (_error, _changes, context) => {
      if (userId && context?.previous) {
        queryClient.setQueryData(profileKeys.profile(userId), context.previous);
      }
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(profileKeys.profile(profile.id), profile);
    },
  });
}

export function useAvatarUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: profileKeys.avatarUrl(path ?? ''),
    enabled: !!path,
    staleTime: (AVATAR_URL_TTL_SECONDS - 5 * 60) * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(AVATAR_BUCKET)
        .createSignedUrl(path!, AVATAR_URL_TTL_SECONDS);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}

// Стискає фото до 512 px JPEG і кладе в avatars/{userId}/… — так вимагає політика бакета.
export function useUploadAvatar() {
  const userId = useUserId();
  const updateProfile = useUpdateProfile();

  return useMutation({
    mutationFn: async ({ uri, previousPath }: { uri: string; previousPath: string | null }) => {
      const rendered = await ImageManipulator.manipulate(uri)
        .resize({ width: AVATAR_SIZE })
        .renderAsync();
      const image = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
      const body = await (await fetch(image.uri)).arrayBuffer();

      const path = `${userId}/${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, body, { contentType: 'image/jpeg' });
      if (error) throw error;

      await updateProfile.mutateAsync({ avatar_path: path });

      // Старий файл більше не потрібен; якщо не видалився — не страшно.
      if (previousPath) {
        await supabase.storage.from(AVATAR_BUCKET).remove([previousPath]);
      }
      return path;
    },
  });
}
