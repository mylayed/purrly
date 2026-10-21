// Нативний модуль відсутній у встановленій збірці — застосунок застарів
// відносно JS-коду (наприклад, у development build або в Expo Go).
export function isMissingNativeModuleError(error: unknown) {
  return error instanceof Error && /Cannot find native module/i.test(error.message);
}
