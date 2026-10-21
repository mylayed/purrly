// Видаляє акаунт користувача, який її викликав, разом з усіма його даними.
// Обов'язково для App Store і Google Play. Видалити користувача Auth можна лише
// з секретним ключем, тому це серверна функція, а не запит із застосунку.
//
// Що відбувається:
//  1. Файли у сховищі (каскад у базі їх не чіпає): фото котів, яких створив
//     користувач, і його аватар.
//  2. Видалення користувача Auth. Далі спрацьовує каскад у базі: профіль, коти
//     користувача з усіма записами, членство в чужих котах. Його записи в чужих
//     котах лишаються без автора (created_by → null).
import { withSupabase } from 'npm:@supabase/server@1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const PAGE_SIZE = 1000;

type StorageClient = {
  storage: {
    from(bucket: string): {
      list(
        prefix: string,
        options: { limit: number; offset: number },
      ): Promise<{ data: { name: string }[] | null; error: Error | null }>;
      remove(paths: string[]): Promise<{ error: Error | null }>;
    };
  };
};

// Видаляє всі файли в «папці» бакета. Структура в нас плоска: {папка}/{файл}.
async function removeFolder(admin: StorageClient, bucket: string, folder: string) {
  for (;;) {
    const { data, error } = await admin.storage
      .from(bucket)
      .list(folder, { limit: PAGE_SIZE, offset: 0 });
    if (error) throw error;
    if (!data || data.length === 0) return;

    const { error: removeError } = await admin.storage
      .from(bucket)
      .remove(data.map((file) => `${folder}/${file.name}`));
    if (removeError) throw removeError;
    if (data.length < PAGE_SIZE) return;
  }
}

const handler = withSupabase({ auth: 'user' }, async (req, ctx) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'method_not_allowed' }, { status: 405 });
  }

  const userId = ctx.userClaims?.id;
  if (!userId) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }
  const admin = ctx.supabaseAdmin;

  try {
    const { data: cats, error: catsError } = await admin
      .from('cats')
      .select('id')
      .eq('created_by', userId);
    if (catsError) throw catsError;

    for (const cat of cats ?? []) {
      await removeFolder(admin, 'cat-photos', cat.id);
    }
    await removeFolder(admin, 'avatars', userId);

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    return Response.json({ deleted: true });
  } catch (error) {
    console.error('delete-account failed', { userId, error });
    return Response.json({ error: 'delete_failed' }, { status: 500 });
  }
});

export default {
  async fetch(req: Request) {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    const response = await handler(req);
    for (const [key, value] of Object.entries(corsHeaders)) {
      response.headers.set(key, value);
    }
    return response;
  },
};
