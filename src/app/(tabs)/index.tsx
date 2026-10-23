import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { PlusIcon } from '@/components/icons';
import { Button, EmptyState, ErrorBanner, Screen, Text } from '@/components/ui';
import { useCats } from '@/features/cats/api';
import { CatCard } from '@/features/cats/components/cat-card';
import { useProfile } from '@/features/profile/api';
import { useTheme } from '@/theme';

export default function Home() {
  const { t } = useTranslation();
  const { colors, radii, spacing } = useTheme();
  const { data: profile } = useProfile();
  const { data: cats, isPending, isError, refetch } = useCats();
  const [showArchived, setShowArchived] = useState(false);
  const [addPresses, setAddPresses] = useState(0);
  const firstName = profile?.display_name?.trim().split(/\s+/)[0];

  const active = cats?.filter((cat) => !cat.archived_at) ?? [];
  const archived = cats?.filter((cat) => cat.archived_at) ?? [];
  const addCat = () => router.push('/cat/new');

  const greeting = (
    <Text variant="title">
      {firstName ? t('home.greeting', { name: firstName }) : t('home.greetingNoName')}
    </Text>
  );

  if (isPending || isError || cats.length === 0) {
    return (
      <Screen>
        {greeting}
        {isPending ? (
          <ActivityIndicator color={colors.accent} style={{ flex: 1 }} />
        ) : isError ? (
          <View style={{ gap: spacing.sm }}>
            <ErrorBanner message={t('cats.loadError')} />
            <Button title={t('cats.retry')} variant="secondary" onPress={() => refetch()} />
          </View>
        ) : (
          <EmptyState
            title={t('home.emptyTitle')}
            body={t('home.emptyBody')}
            action={<Button title={t('cats.add')} onPress={addCat} />}
          />
        )}
      </Screen>
    );
  }

  return (
    <Screen scroll>
      {greeting}

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text variant="heading" style={{ flex: 1 }}>
          {t('cats.yourCats')}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('cats.add')}
          onPressIn={() => setAddPresses((n) => n + 1)}
          onPress={addCat}
          hitSlop={8}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: radii.pill,
            backgroundColor: pressed ? colors.accentPressed : colors.accent,
          })}
        >
          <PlusIcon size={16} color={colors.onAccent} strokeWidth={2.5} trigger={addPresses} />
          <Text variant="label" tone="onAccent">
            {t('cats.add')}
          </Text>
        </Pressable>
      </View>

      <View style={{ gap: spacing.sm }}>
        {active.map((cat) => (
          <CatCard key={cat.id} cat={cat} />
        ))}
      </View>

      {archived.length > 0 && (
        <View style={{ gap: spacing.sm }}>
          <Button
            title={t('cats.archivedSection', { count: archived.length })}
            variant="ghost"
            onPress={() => setShowArchived((v) => !v)}
          />
          {showArchived && archived.map((cat) => <CatCard key={cat.id} cat={cat} />)}
        </View>
      )}
    </Screen>
  );
}
