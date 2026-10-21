import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { pickSquareImage } from '@/api/storage';
import {
  Avatar,
  Button,
  Card,
  ErrorBanner,
  Screen,
  SegmentedControl,
  Text,
  TextField,
} from '@/components/ui';
import { exportMyData } from '@/features/account/export-data';
import { signOut } from '@/features/auth';
import {
  MAX_DISPLAY_NAME_LENGTH,
  useAvatarUrl,
  useProfile,
  useUpdateProfile,
  useUploadAvatar,
  type Profile,
} from '@/features/profile/api';
import { usePreferenceSetters } from '@/features/profile/preferences';
import { languageNames, supportedLanguages } from '@/i18n';
import { useLanguageStore, type LanguagePreference } from '@/stores/language-store';
import { useSessionStore } from '@/stores/session-store';
import type { ThemePreference } from '@/stores/theme-store';
import { isMissingNativeModuleError } from '@/lib/native-module';
import { useTheme } from '@/theme';

const themePreferences: ThemePreference[] = ['system', 'light', 'dark'];

export default function Account() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const { data: profile, isPending, isError, refetch } = useProfile();

  return (
    <Screen scroll>
      <Text variant="title">{t('tabs.account')}</Text>

      {isPending ? (
        <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing.xl }} />
      ) : isError ? (
        <View style={{ gap: spacing.sm }}>
          <ErrorBanner message={t('account.loadError')} />
          <Button title={t('account.retry')} variant="secondary" onPress={() => refetch()} />
        </View>
      ) : (
        <>
          <ProfileCard profile={profile} />
          <PreferencesCard profile={profile} />
          <PrivacyCard />
        </>
      )}

      <Button title={t('account.signOut')} variant="ghost" onPress={() => signOut()} />
    </Screen>
  );
}

function ProfileCard({ profile }: { profile: Profile }) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const user = useSessionStore((s) => s.session?.user);
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const { data: avatarUrl } = useAvatarUrl(profile.avatar_path);

  // Поки фото не завантажене у сховище, показуємо фото з Google, якщо воно є.
  const providerPhoto =
    (user?.user_metadata?.avatar_url as string | undefined) ??
    (user?.user_metadata?.picture as string | undefined);

  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const name = nameDraft ?? profile.display_name ?? '';
  const trimmed = name.trim();
  const nameError =
    trimmed.length > MAX_DISPLAY_NAME_LENGTH
      ? t('account.nameTooLong', { count: MAX_DISPLAY_NAME_LENGTH })
      : null;
  const nameChanged = trimmed !== (profile.display_name ?? '');

  function saveName() {
    if (!nameChanged || nameError) return;
    updateProfile.mutate(
      { display_name: trimmed || null },
      {
        onSuccess: () => {
          setNameDraft(null);
          setJustSaved(true);
          setTimeout(() => setJustSaved(false), 2000);
        },
      },
    );
  }

  const [pickerFailed, setPickerFailed] = useState<unknown>(null);
  const photoError = pickerFailed ?? uploadAvatar.error;

  async function changePhoto() {
    setPickerFailed(null);
    try {
      const uri = await pickSquareImage();
      if (uri) uploadAvatar.mutate({ uri, previousPath: profile.avatar_path });
    } catch (error) {
      console.warn('Image picker failed', error);
      setPickerFailed(error);
    }
  }

  return (
    <Card style={{ gap: spacing.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('account.changePhoto')}
          onPress={changePhoto}
          disabled={uploadAvatar.isPending}
        >
          <Avatar uri={avatarUrl ?? providerPhoto} name={profile.display_name} size={72} />
        </Pressable>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text variant="heading" numberOfLines={1}>
            {profile.display_name || t('account.profile')}
          </Text>
          {user?.email && (
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {user.email}
            </Text>
          )}
          {uploadAvatar.isPending ? (
            <Text variant="caption" tone="muted">
              {t('account.uploading')}
            </Text>
          ) : (
            <Pressable accessibilityRole="button" onPress={changePhoto} hitSlop={8}>
              <Text variant="label" tone="accent">
                {t('account.changePhoto')}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {photoError ? (
        <ErrorBanner
          message={t(
            isMissingNativeModuleError(photoError) ? 'account.needsUpdate' : 'account.photoError',
          )}
        />
      ) : null}

      <TextField
        label={t('account.name')}
        placeholder={t('account.namePlaceholder')}
        value={name}
        onChangeText={setNameDraft}
        error={nameError}
        autoComplete="name"
        textContentType="name"
        returnKeyType="done"
        onSubmitEditing={saveName}
        maxLength={MAX_DISPLAY_NAME_LENGTH + 10}
      />
      {(nameChanged || justSaved) && (
        <Button
          title={justSaved ? t('account.saved') : t('account.save')}
          variant={justSaved ? 'secondary' : 'primary'}
          disabled={updateProfile.isPending || !!nameError || justSaved}
          onPress={saveName}
        />
      )}
      {updateProfile.isError && <ErrorBanner message={t('account.saveError')} />}
    </Card>
  );
}

function PreferencesCard({ profile }: { profile: Profile }) {
  const { t } = useTranslation();
  const { spacing, preference: theme } = useTheme();
  const language = useLanguageStore((s) => s.preference);
  const { setTheme, setLanguage } = usePreferenceSetters();
  const updateProfile = useUpdateProfile();

  const themeOptions = themePreferences.map((value) => ({
    value,
    label: t(`settings.theme.${value}`),
  }));
  const languageOptions: { value: LanguagePreference; label: string }[] = [
    { value: 'system', label: t('settings.language.system') },
    ...supportedLanguages.map((value) => ({ value, label: languageNames[value] })),
  ];

  return (
    <Card style={{ gap: spacing.lg }}>
      <Text variant="heading">{t('account.preferences')}</Text>

      <View style={{ gap: spacing.sm }}>
        <Text variant="label">{t('settings.theme.title')}</Text>
        <SegmentedControl options={themeOptions} value={theme} onChange={setTheme} />
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text variant="label">{t('settings.language.title')}</Text>
        <SegmentedControl options={languageOptions} value={language} onChange={setLanguage} />
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text variant="label">{t('account.units')}</Text>
        <SegmentedControl
          options={[
            { value: 'kg', label: t('account.kg') },
            { value: 'lb', label: t('account.lb') },
          ]}
          value={profile.weight_unit}
          onChange={(weight_unit) => updateProfile.mutate({ weight_unit })}
        />
      </View>
    </Card>
  );
}

function PrivacyCard() {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<unknown>(null);

  async function exportData() {
    setExporting(true);
    setExportError(null);
    try {
      await exportMyData();
    } catch (error) {
      console.warn('Export failed', error);
      setExportError(error);
    } finally {
      setExporting(false);
    }
  }

  return (
    <Card style={{ gap: spacing.md }}>
      <Text variant="heading">{t('account.privacy')}</Text>
      <Text tone="muted">{t('account.privacyBody')}</Text>
      <Button
        title={exporting ? t('account.exporting') : t('account.exportData')}
        variant="secondary"
        disabled={exporting}
        onPress={exportData}
      />
      {exportError ? (
        <ErrorBanner
          message={t(
            isMissingNativeModuleError(exportError) ? 'account.needsUpdate' : 'account.exportError',
          )}
        />
      ) : null}
      <Button
        title={t('account.deleteAccount')}
        variant="danger"
        onPress={() => router.push('/delete-account')}
      />
    </Card>
  );
}
