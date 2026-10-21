import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Card, ErrorBanner, Screen, Text, TextField } from '@/components/ui';
import {
  AuthError,
  getEmailDraft,
  isValidEmail,
  requestPasswordReset,
  type AuthErrorReason,
} from '@/features/auth';
import { useTheme } from '@/theme';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const { spacing } = useTheme();

  const [email, setEmail] = useState(getEmailDraft);
  const [showValidation, setShowValidation] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<AuthErrorReason | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const emailError = isValidEmail(email) ? null : t('auth.validation.emailInvalid');

  function back() {
    if (router.canGoBack()) router.back();
    else router.replace('/sign-in');
  }

  async function submit() {
    setShowValidation(true);
    if (emailError) return;

    setPending(true);
    setError(null);
    try {
      await requestPasswordReset(email);
      setSentTo(email.trim());
    } catch (e) {
      if (!(e instanceof AuthError) || e.reason === 'generic') console.warn('Reset failed', e);
      setError(e instanceof AuthError ? e.reason : 'generic');
    } finally {
      setPending(false);
    }
  }

  if (sentTo) {
    return (
      <Screen contentStyle={{ justifyContent: 'center' }}>
        <Card style={{ gap: spacing.md }}>
          <Text variant="title">{t('auth.forgot.sentTitle')}</Text>
          <Text>{t('auth.forgot.sentBody', { email: sentTo })}</Text>
          <Button title={t('auth.forgot.back')} variant="secondary" onPress={back} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen scroll contentStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <View style={{ gap: spacing.sm }}>
        <Text variant="title">{t('auth.forgot.title')}</Text>
        <Text tone="muted">{t('auth.forgot.body')}</Text>
      </View>

      <TextField
        label={t('auth.email')}
        placeholder={t('auth.emailPlaceholder')}
        value={email}
        onChangeText={setEmail}
        error={showValidation ? emailError : null}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="send"
        onSubmitEditing={submit}
        editable={!pending}
      />

      {error && <ErrorBanner message={t(`auth.errors.${error}`)} />}

      <View style={{ gap: spacing.sm }}>
        <Button title={t('auth.forgot.submit')} disabled={pending} onPress={submit} />
        <Button title={t('auth.forgot.back')} variant="ghost" onPress={back} />
      </View>
    </Screen>
  );
}
