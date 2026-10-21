import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, ErrorBanner, Screen, Text, TextField } from '@/components/ui';
import {
  AuthError,
  MIN_PASSWORD_LENGTH,
  signOut,
  updatePassword,
  type AuthErrorReason,
} from '@/features/auth';
import { finishPasswordRecovery } from '@/stores/session-store';
import { useTheme } from '@/theme';

// Сюди веде посилання з листа «відновити пароль». Користувач уже увійшов,
// але далі не пускаємо, доки не задасть новий пароль.
export default function ResetPassword() {
  const { t } = useTranslation();
  const { spacing } = useTheme();

  const [password, setPassword] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<AuthErrorReason | null>(null);

  const passwordError =
    password.length < MIN_PASSWORD_LENGTH
      ? t('auth.validation.passwordTooShort', { count: MIN_PASSWORD_LENGTH })
      : null;

  async function submit() {
    setShowValidation(true);
    if (passwordError) return;

    setPending(true);
    setError(null);
    try {
      await updatePassword(password);
      // Захищені маршрути переведуть на головну.
      finishPasswordRecovery();
    } catch (e) {
      if (!(e instanceof AuthError) || e.reason === 'generic') console.warn('Update failed', e);
      setError(e instanceof AuthError ? e.reason : 'generic');
    } finally {
      setPending(false);
    }
  }

  return (
    <Screen scroll contentStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <View style={{ gap: spacing.sm }}>
        <Text variant="title">{t('auth.reset.title')}</Text>
        <Text tone="muted">{t('auth.reset.body')}</Text>
      </View>

      <TextField
        label={t('auth.reset.newPassword')}
        value={password}
        onChangeText={setPassword}
        error={showValidation ? passwordError : null}
        hint={t('auth.passwordHint', { count: MIN_PASSWORD_LENGTH })}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={submit}
        editable={!pending}
      />

      {error && <ErrorBanner message={t(`auth.errors.${error}`)} />}

      <View style={{ gap: spacing.sm }}>
        <Button title={t('auth.reset.submit')} disabled={pending} onPress={submit} />
        <Button title={t('auth.reset.cancel')} variant="ghost" onPress={signOut} />
      </View>
    </Screen>
  );
}
