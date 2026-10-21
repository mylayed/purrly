// Телефон: пишемо файл у кеш і відкриваємо системне «Поділитися» —
// звідти його можна зберегти у Файли, на Диск чи надіслати собі.
export async function saveJsonFile(fileName: string, json: string) {
  // Нативні модулі вантажимо лише під час експорту — див. lib/native-module.
  const { File, Paths } = await import('expo-file-system');
  const Sharing = await import('expo-sharing');

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
