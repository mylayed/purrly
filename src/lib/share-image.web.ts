export type ShareOutcome = 'shared' | 'copied' | 'manual';

// Web: знімок картки потребував би ще й html2canvas, тож ділимося підписом —
// системним «Поділитися» браузера, інакше копіюємо в буфер. Якщо браузер не дає
// й копіювати ('manual'), вікно покаже текст, щоб скопіювати його вручну.
export async function shareCardImage(_view: unknown, text: string): Promise<ShareOutcome> {
  if (typeof navigator.share === 'function') {
    await navigator.share({ text });
    return 'shared';
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'manual';
  }
}
