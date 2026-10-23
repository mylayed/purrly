export type ShareOutcome = 'shared' | 'copied' | 'manual';

// Телефон: знімаємо картку як PNG і відкриваємо системне «Поділитися» —
// звідти її можна надіслати в Instagram, Telegram чи зберегти у фото.
// view — екземпляр View з ref (StoryCard).
export async function shareCardImage(view: unknown, text: string): Promise<ShareOutcome> {
  // Нативні модулі вантажимо лише тут — див. lib/native-module.
  const { captureRef } = await import('react-native-view-shot');
  const Sharing = await import('expo-sharing');

  // Типи view-shot ще не знають про ref-екземпляри View з RN 0.8x, хоча знімок працює.
  const target = view as Parameters<typeof captureRef>[0];
  const uri = await captureRef(target, { format: 'png', quality: 1, result: 'tmpfile' });
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device');
  }
  await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: text });
  return 'shared';
}
