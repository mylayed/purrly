// Причини, з яких вхід не вдався, — для зрозумілих повідомлень на екрані.
export type AuthErrorReason =
  | 'expoGo'
  | 'notConfigured'
  | 'playServices'
  | 'invalidCredentials'
  | 'emailNotConfirmed'
  | 'weakPassword'
  | 'invalidEmail'
  | 'rateLimit'
  | 'samePassword'
  | 'generic';

export class AuthError extends Error {
  constructor(
    readonly reason: AuthErrorReason,
    options?: { cause?: unknown },
  ) {
    super(reason, options);
    this.name = 'AuthError';
  }
}

// Користувач закрив вікно входу — це не помилка, нічого не показуємо.
export class AuthCancelledError extends Error {
  constructor() {
    super('cancelled');
    this.name = 'AuthCancelledError';
  }
}
