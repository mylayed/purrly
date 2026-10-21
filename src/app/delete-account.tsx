import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Card, ErrorBanner, Screen, Text, TextField } from '@/components/ui';
import { deleteAccount } from '@/features/account/delete-account';
import { useTheme } from '@/theme';

export default function DeleteAccount() {
  const { t, i18n } = useTranslation();
  const { spacing } = useTheme();
  const [confirmation, setConfirmation] = useState('');
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  const word = t('deleteAccount.confirmWord');
  const confirmed = confirmation.trim().toLocaleUpperCase(i18n.language) === word;

  function back() {
    if (router.canGoBack()) router.back();
    else router.replace('/account');
  }

  // Після видалення сесії немає — захищені маршрути самі переведуть на вхід.
  async function submit() {
    if (!confirmed || pending) return;
    setPending(true);
    setFailed(false);
    try {
      await deleteAccount();
    } catch (error) {
      console.warn('Account deletion failed', error);
      setFailed(true);
      setPending(false);
    }
  }

  const items = [
    t('deleteAccount.itemProfile'),
    t('deleteAccount.itemCats'),
    t('deleteAccount.itemAccess'),
  ];

  return (
    <Screen scroll>
      <Text variant="title">{t('deleteAccount.title')}</Text>

      <Card style={{ gap: spacing.sm }}>
        <Text variant="bodyStrong">{t('deleteAccount.intro')}</Text>
        {items.map((item) => (
          <View key={item} style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Text tone="danger">•</Text>
            <Text style={{ flex: 1 }}>{item}</Text>
          </View>
        ))}
        <Text tone="muted" style={{ marginTop: spacing.sm }}>
          {t('deleteAccount.othersKeep')}
        </Text>
        <Text tone="muted">{t('deleteAccount.noUndo')}</Text>
      </Card>

      <TextField
        label={t('deleteAccount.confirmLabel', { word })}
        placeholder={word}
        value={confirmation}
        onChangeText={setConfirmation}
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        editable={!pending}
        onSubmitEditing={submit}
      />

      {failed && <ErrorBanner message={t('deleteAccount.error')} />}

      <View style={{ gap: spacing.sm }}>
        <Button
          title={pending ? t('deleteAccount.deleting') : t('deleteAccount.submit')}
          variant="danger"
          disabled={!confirmed || pending}
          onPress={submit}
        />
        <Button
          title={t('deleteAccount.cancel')}
          variant="ghost"
          disabled={pending}
          onPress={back}
        />
      </View>
    </Screen>
  );
}
