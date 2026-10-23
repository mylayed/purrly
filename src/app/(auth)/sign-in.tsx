import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import {
  Button,
  Card,
  ErrorBanner,
  Screen,
  SegmentedControl,
  Text,
  TextField,
} from '@/components/ui';
import {
  AuthCancelledError,
  AuthError,
  isAppleSignInAvailable,
  isValidEmail,
  setEmailDraft,
  MIN_PASSWORD_LENGTH,
  signInWithApple,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
  type AuthErrorReason,
} from '@/features/auth';
import { GoogleSignInButton } from '@/features/auth/components/google-sign-in-button';
import { useTheme } from '@/theme';

type Mode = 'signIn' | 'signUp';
type Pending = 'email' | 'google' | 'apple';

export default function SignIn() {
  const { t } = useTranslation();
  const { scheme, colors, radii, spacing } = useTheme();
  const [appleAvailable, setAppleAvailable] = useState(false);

  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [error, setError] = useState<AuthErrorReason | null>(null);
  const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(null);

  useEffect(() => {
    isAppleSignInAvailable().then(setAppleAvailable);
  }, []);

  const emailError = isValidEmail(email) ? null : t('auth.validation.emailInvalid');
  // Довжину пароля перевіряємо лише під час реєстрації: при вході вистачить відповіді сервера.
  const passwordError =
    mode === 'signUp' && password.length < MIN_PASSWORD_LENGTH
      ? t('auth.validation.passwordTooShort', { count: MIN_PASSWORD_LENGTH })
      : null;

  // Після успішного входу сесія оновлюється, і захищені маршрути перекинуть на головну.
  async function run(kind: Pending, action: () => Promise<void>) {
    setPending(kind);
    setError(null);
    try {
      await action();
    } catch (e) {
      if (!(e instanceof AuthCancelledError)) {
        if (!(e instanceof AuthError) || e.reason === 'generic') console.warn('Sign-in failed', e);
        setError(e instanceof AuthError ? e.reason : 'generic');
      }
    } finally {
      setPending(null);
    }
  }

  function submitEmail() {
    setShowValidation(true);
    if (emailError || passwordError || !password) return;

    run('email', async () => {
      if (mode === 'signIn') {
        await signInWithEmail(email, password);
        return;
      }
      const { needsConfirmation } = await signUpWithEmail(email, password);
      if (needsConfirmation) {
        setConfirmationSentTo(email.trim());
        setPassword('');
      }
    });
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setShowValidation(false);
  }

  if (confirmationSentTo) {
    return (
      <Screen contentStyle={{ justifyContent: 'center' }}>
        <Card style={{ gap: spacing.md }}>
          <Text variant="title">{t('auth.checkEmail.title')}</Text>
          <Text>{t('auth.checkEmail.body', { email: confirmationSentTo })}</Text>
          <Button
            title={t('auth.checkEmail.back')}
            variant="secondary"
            onPress={() => {
              setConfirmationSentTo(null);
              switchMode('signIn');
            }}
          />
        </Card>
      </Screen>
    );
  }

  const busy = pending !== null;

  return (
    <Screen scroll contentStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
        <Text variant="display">{t('app.name')}</Text>
        <Text tone="muted">{t('auth.welcome')}</Text>
      </View>

      {/* Квіз без реєстрації: спершу «вау», потім акаунт. */}
      <Card style={{ gap: spacing.sm, backgroundColor: colors.accentSoft }}>
        <Text variant="bodyStrong">🐱 {t('onboarding.teaserTitle')}</Text>
        <Text tone="muted">{t('onboarding.teaserBody')}</Text>
        <Button title={t('onboarding.teaserCta')} onPress={() => router.push('/meet')} />
      </Card>

      <SegmentedControl
        options={[
          { value: 'signIn', label: t('auth.signIn') },
          { value: 'signUp', label: t('auth.signUp') },
        ]}
        value={mode}
        onChange={switchMode}
      />

      <View style={{ gap: spacing.md }}>
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
          textContentType={mode === 'signUp' ? 'username' : 'emailAddress'}
          returnKeyType="next"
          editable={!busy}
        />
        <TextField
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          error={showValidation ? passwordError : null}
          hint={
            mode === 'signUp' ? t('auth.passwordHint', { count: MIN_PASSWORD_LENGTH }) : undefined
          }
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
          textContentType={mode === 'signUp' ? 'newPassword' : 'password'}
          returnKeyType="go"
          onSubmitEditing={submitEmail}
          editable={!busy}
        />
        <Button
          title={mode === 'signIn' ? t('auth.signIn') : t('auth.signUp')}
          disabled={busy}
          onPress={submitEmail}
        />
        {mode === 'signIn' && (
          <Button
            title={t('auth.forgotPassword')}
            variant="ghost"
            disabled={busy}
            onPress={() => {
              setEmailDraft(email);
              router.push('/forgot-password');
            }}
          />
        )}
      </View>

      {pending && <ActivityIndicator color={colors.accent} />}

      {error && <ErrorBanner message={t(`auth.errors.${error}`)} />}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        <Text variant="caption" tone="muted">
          {t('auth.or')}
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      </View>

      <View style={{ gap: spacing.md }}>
        {appleAvailable && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={
              scheme === 'dark'
                ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={radii.pill}
            style={{ height: 48 }}
            onPress={() => run('apple', signInWithApple)}
          />
        )}

        <GoogleSignInButton
          title={t('auth.continueWithGoogle')}
          disabled={busy}
          onPress={() => run('google', signInWithGoogle)}
        />
      </View>
    </Screen>
  );
}
