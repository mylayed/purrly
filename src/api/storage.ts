import { useQuery } from '@tanstack/react-query';

import { supabase } from './supabase';

export type Bucket = 'avatars' | 'cat-photos';

// Підписане посилання на файл у приватному бакеті; кеш оновлюємо раніше, ніж воно спливе.
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export function useSignedUrl(bucket: Bucket, path: string | null | undefined) {
  return useQuery({
    queryKey: ['signed-url', bucket, path ?? ''],
    enabled: !!path,
    staleTime: (SIGNED_URL_TTL_SECONDS - 5 * 60) * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path!, SIGNED_URL_TTL_SECONDS);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}

// Стискає фото до заданої ширини (JPEG) і завантажує в бакет за вказаним шляхом.
export async function uploadImage(bucket: Bucket, path: string, uri: string, width = 1024) {
  // Нативний модуль вантажимо лише тут — див. lib/native-module.
  const { ImageManipulator, SaveFormat } = await import('expo-image-manipulator');
  const rendered = await ImageManipulator.manipulate(uri).resize({ width }).renderAsync();
  const image = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
  const body = await (await fetch(image.uri)).arrayBuffer();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, body, { contentType: 'image/jpeg' });
  if (error) throw error;
}

// Видалення не критичне: якщо файл лишився, він просто займає місце.
export async function removeFiles(bucket: Bucket, paths: string[]) {
  if (paths.length === 0) return;
  await supabase.storage.from(bucket).remove(paths);
}

// Відкриває галерею з обрізкою до квадрата. null — користувач передумав.
export async function pickSquareImage() {
  // Нативний модуль вантажимо лише тут — див. lib/native-module.
  const ImagePicker = await import('expo-image-picker');
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });
  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

// Фото з галереї без обрізки (для стрічки). null — користувач передумав.
export async function pickImage() {
  const ImagePicker = await import('expo-image-picker');
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

// Кілька підписаних посилань одним запитом (стрічка показує десятки фото).
export async function signedUrls(bucket: Bucket, paths: string[]) {
  if (paths.length === 0) return new Map<string, string>();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  if (error) throw error;
  return new Map(
    data.flatMap((item) => (item.path && item.signedUrl ? [[item.path, item.signedUrl]] : [])),
  );
}

export const SIGNED_URL_STALE_MS = (SIGNED_URL_TTL_SECONDS - 5 * 60) * 1000;
