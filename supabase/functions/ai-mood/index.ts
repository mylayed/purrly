// AI-настрій кота за фото зі стрічки: настрій + короткий підпис для сторіз.
// Ключ Anthropic живе лише тут (секрет ANTHROPIC_API_KEY) і ніколи не потрапляє в клієнт.
//
// Що відбувається:
//  1. Фото читаємо клієнтом від імені користувача — RLS пускає лише учасників кота.
//  2. Настрій уже є — повертаємо його (кеш, ліміт не витрачається).
//  3. Free: не більше FREE_WEEKLY_LIMIT аналізів за 7 днів (лічильник ai_usage).
//  4. Фото без кота ліміт не витрачає.
import Anthropic from 'npm:@anthropic-ai/sdk@1';
import { encodeBase64 } from 'jsr:@std/encoding@1/base64';
import { withSupabase } from 'npm:@supabase/server@1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MODEL = 'claude-haiku-5-5';
const USAGE_KIND = 'mood';
const FREE_WEEKLY_LIMIT = 3;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_CAPTION_LENGTH = 160;

// Ключі настроїв; назви й емодзі — у перекладах застосунку.
const MOODS = [
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

const LANGUAGES: Record<string, string> = { uk: 'Ukrainian', en: 'English' };

// Незмінний системний промпт: умови для тексту, який побачать власники котів.
const SYSTEM = `You look at a photo a cat owner took of their cat and describe the cat's mood for a fun social media story.

Rules:
- Pick the single mood from the allowed list that best matches the cat's posture, eyes, ears and setting.
- Write one short, warm, playful caption in the requested language, at most ${MAX_CAPTION_LENGTH} characters, as if for an Instagram or Telegram story. You may use one or two emoji. No hashtags.
- The caption is about mood and personality only. Never mention health, illness, pain, weight or anything that could read as a diagnosis, even jokingly.
- Never shame or guilt the owner.
- If there is no cat in the photo, set has_cat to false, mood to "curious" and caption to an empty string.`;

const SCHEMA = {
  type: 'object',
  properties: {
    has_cat: { type: 'boolean' },
    mood: { type: 'string', enum: [...MOODS] },
    caption: { type: 'string' },
  },
  required: ['has_cat', 'mood', 'caption'],
  additionalProperties: false,
};

type MoodResult = { has_cat: boolean; mood: (typeof MOODS)[number]; caption: string };

const anthropic = new Anthropic();

async function analyze(image: Uint8Array, language: string): Promise<MoodResult | null> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    // Коротка класифікація з підписом — глибокі роздуми не потрібні.
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: encodeBase64(image) },
          },
          { type: 'text', text: `Caption language: ${LANGUAGES[language] ?? 'English'}.` },
        ],
      },
    ],
  });

  // Відмова чи обрізана відповідь — без результату (ліміт не витрачаємо).
  if (response.stop_reason === 'refusal' || response.stop_reason === 'max_tokens') {
    console.warn('ai-mood: no result', response.stop_reason, response.stop_details);
    return null;
  }
  const text = response.content.find((b) => b.type === 'text');
  if (!text || text.type !== 'text') return null;
  const parsed = JSON.parse(text.text) as MoodResult;
  return { ...parsed, caption: parsed.caption.trim().slice(0, MAX_CAPTION_LENGTH) };
}

const handler = withSupabase({ auth: 'user' }, async (req, ctx) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'method_not_allowed' }, { status: 405 });
  }
  const userId = ctx.userClaims?.id;
  if (!userId) return Response.json({ error: 'unauthorized' }, { status: 401 });

  let body: { photoId?: unknown; language?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'bad_request' }, { status: 400 });
  }
  const photoId = typeof body.photoId === 'string' ? body.photoId : null;
  const language = typeof body.language === 'string' ? body.language : 'en';
  if (!photoId) return Response.json({ error: 'bad_request' }, { status: 400 });

  const admin = ctx.supabaseAdmin;
  try {
    // RLS: рядок повернеться, лише якщо користувач — учасник кота.
    const { data: photo, error: photoError } = await ctx.supabase
      .from('photos')
      .select('id, storage_path, mood, mood_caption')
      .eq('id', photoId)
      .maybeSingle();
    if (photoError) throw photoError;
    if (!photo) return Response.json({ error: 'not_found' }, { status: 404 });

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('is_plus')
      .eq('id', userId)
      .single();
    if (profileError) throw profileError;
    const isPlus = profile.is_plus === true;

    const since = new Date(Date.now() - WEEK_MS).toISOString();
    const { data: usage, error: usageError } = await admin
      .from('ai_usage')
      .select('created_at')
      .eq('user_id', userId)
      .eq('kind', USAGE_KIND)
      .gte('created_at', since)
      .order('created_at', { ascending: true });
    if (usageError) throw usageError;
    const used = usage?.length ?? 0;
    // Найстаріший запит у вікні звільнить місце через тиждень після себе.
    const resetsAt =
      used > 0 ? new Date(Date.parse(usage![0]!.created_at) + WEEK_MS).toISOString() : null;
    const remaining = (n: number) => (isPlus ? null : Math.max(0, FREE_WEEKLY_LIMIT - n));

    if (photo.mood) {
      return Response.json({
        hasCat: true,
        mood: photo.mood,
        caption: photo.mood_caption ?? '',
        cached: true,
        remaining: remaining(used),
        resetsAt,
      });
    }
    if (!isPlus && used >= FREE_WEEKLY_LIMIT) {
      return Response.json({ error: 'limit', remaining: 0, resetsAt }, { status: 429 });
    }

    const { data: file, error: fileError } = await admin.storage
      .from('cat-photos')
      .download(photo.storage_path);
    if (fileError) throw fileError;

    const result = await analyze(new Uint8Array(await file.arrayBuffer()), language);
    if (!result) return Response.json({ error: 'no_result' }, { status: 422 });
    if (!result.has_cat) {
      return Response.json({ hasCat: false, remaining: remaining(used), resetsAt });
    }

    const { error: saveError } = await admin
      .from('photos')
      .update({ mood: result.mood, mood_caption: result.caption })
      .eq('id', photo.id);
    if (saveError) throw saveError;
    const { error: countError } = await admin
      .from('ai_usage')
      .insert({ user_id: userId, kind: USAGE_KIND });
    if (countError) throw countError;

    return Response.json({
      hasCat: true,
      mood: result.mood,
      caption: result.caption,
      cached: false,
      remaining: remaining(used + 1),
      resetsAt: resetsAt ?? (isPlus ? null : new Date(Date.now() + WEEK_MS).toISOString()),
    });
  } catch (error) {
    if (
      error instanceof Anthropic.RateLimitError ||
      error instanceof Anthropic.InternalServerError
    ) {
      console.error('ai-mood: provider busy', error.status);
      return Response.json({ error: 'busy' }, { status: 503 });
    }
    if (error instanceof Anthropic.APIError) {
      console.error('ai-mood: provider error', error.status, error.message);
      return Response.json({ error: 'provider_error' }, { status: 502 });
    }
    console.error('ai-mood failed', { userId, photoId, error });
    return Response.json({ error: 'failed' }, { status: 500 });
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
