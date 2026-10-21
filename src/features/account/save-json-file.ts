import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// Телефон: пишемо файл у кеш і відкриваємо системне «Поділитися» —
// звідти його можна зберегти у Файли, на Диск чи надіслати собі.
export async function saveJsonFile(fileName: string, json: string) {
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  await file.write(json);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    UTI: 'public.json',
    dialogTitle: fileName,
  });
}
