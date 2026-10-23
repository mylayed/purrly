import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { SquarePenIcon } from '@/components/icons';
import { Avatar, Button, Card, ErrorBanner, Screen, ScreenHeader, Text } from '@/components/ui';
import {
  useCat,
  useCatPhotoUrl,
  useCatRole,
  useDeleteCat,
  useSetCatArchived,
  type Cat,
} from '@/features/cats/api';
import { useFormatCatAge } from '@/features/cats/use-cat-age';
import { FeedingTile } from '@/features/feeding/components/feeding-tile';
import { WeightTile } from '@/features/weight/components/weight-tile';
import { formatBirthDate } from '@/lib/cat-age';
import { useTheme } from '@/theme';

export default function CatProfile() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: cat, isPending, isError, refetch } = useCat(id);

  if (cat) return <CatProfileContent cat={cat} />;

  return (
    <Screen header={<ScreenHeader title="" backLabel={t('cats.back')} />}>
      {isPending ? (
        <ActivityIndicator color={colors.accent} />
      ) : isError ? (
        <>
          <ErrorBanner message={t('cats.notFound')} />
          <Button title={t('cats.retry')} variant="secondary" onPress={() => refetch()} />
        </>
      ) : null}
    </Screen>
  );
}

function CatProfileContent({ cat }: { cat: Cat }) {
  const { t } = useTranslation();
  const { colors, radii, spacing } = useTheme();
  const { data: photoUrl } = useCatPhotoUrl(cat.photo_path);
  const { data: role } = useCatRole(cat.id);
  const age = useFormatCatAge()(cat.birth_date);
  const [editPresses, setEditPresses] = useState(0);

  const sexLabel = {
    male: t('cats.form.sexMale'),
    female: t('cats.form.sexFemale'),
    unknown: t('cats.form.sexUnknown'),
  }[cat.sex];
  const sterilizedLabel =
    cat.sterilized === null ? null : cat.sterilized ? t('cats.form.yes') : t('cats.form.no');

  const details: [string, string | null][] = [
    [t('cats.form.sex'), cat.sex === 'unknown' ? null : sexLabel],
    [t('cats.form.birthDate'), cat.birth_date ? formatBirthDate(cat.birth_date) : null],
    [t('cats.form.breed'), cat.breed],
    [t('cats.form.sterilized'), sterilizedLabel],
    [t('cats.form.chip'), cat.chip_number],
  ];

  return (
    <Screen
      scroll
      header={
        <ScreenHeader
          title={cat.name}
          backLabel={t('cats.back')}
          right={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('cats.editTitle')}
              hitSlop={8}
              onPressIn={() => setEditPresses((n) => n + 1)}
              onPress={() => router.push({ pathname: '/cat/[id]/edit', params: { id: cat.id } })}
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: radii.pill,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed ? colors.accentSoft : colors.card,
              })}
            >
              <SquarePenIcon
                size={20}
                color={colors.text}
                strokeWidth={2.25}
                trigger={editPresses}
              />
            </Pressable>
          }
        />
      }
    >
      <View style={{ alignItems: 'center', gap: spacing.xs }}>
        <Avatar uri={photoUrl} name={cat.name} size={112} />
        {age && <Text variant="heading">{age.text}</Text>}
        {cat.archived_at && (
          <Text variant="caption" tone="muted">
            {t('cats.archivedBadge')}
          </Text>
        )}
      </View>

      {age && (
        <Card style={{ gap: spacing.xs, backgroundColor: colors.secondaryBg }}>
          <Text variant="bodyStrong" tone="secondary">
            {t(`cats.stage.${age.stage}`)} · {age.human}
          </Text>
          <Text tone="secondary">{t(`cats.stage.${age.stage}Tip`)}</Text>
        </Card>
      )}

      <WeightTile catId={cat.id} />
      <FeedingTile catId={cat.id} />

      <Card style={{ gap: spacing.md }}>
        <Text variant="heading">{t('cats.details.title')}</Text>
        {details.map(([label, value]) => (
          <View key={label} style={{ flexDirection: 'row', gap: spacing.md }}>
            <Text tone="muted" style={{ flex: 1 }}>
              {label}
            </Text>
            <Text
              tone={value ? 'default' : 'muted'}
              style={{ flex: 1, textAlign: 'right' }}
              selectable={!!value}
            >
              {value ?? t('cats.details.notSpecified')}
            </Text>
          </View>
        ))}
      </Card>

      <CatActions cat={cat} isOwner={role === 'owner'} />
    </Screen>
  );
}

function CatActions({ cat, isOwner }: { cat: Cat; isOwner: boolean }) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const setArchived = useSetCatArchived(cat);
  const deleteCat = useDeleteCat(cat);
  // Видалення — у два натискання, без системного діалогу (його немає в web).
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const failed = setArchived.isError || deleteCat.isError;

  return (
    <View style={{ gap: spacing.sm }}>
      <Button
        title={cat.archived_at ? t('cats.unarchive') : t('cats.archive')}
        variant="secondary"
        disabled={setArchived.isPending || deleteCat.isPending}
        onPress={() => setArchived.mutate(!cat.archived_at)}
      />

      {isOwner &&
        (confirmingDelete ? (
          <>
            <Text tone="danger" style={{ textAlign: 'center' }}>
              {t('cats.deleteConfirm', { name: cat.name })}
            </Text>
            <Button
              title={t('cats.deleteConfirmButton')}
              variant="danger"
              disabled={deleteCat.isPending}
              onPress={() => deleteCat.mutate(undefined, { onSuccess: () => router.replace('/') })}
            />
            <Button
              title={t('deleteAccount.cancel')}
              variant="ghost"
              disabled={deleteCat.isPending}
              onPress={() => setConfirmingDelete(false)}
            />
          </>
        ) : (
          <Button
            title={t('cats.delete')}
            variant="danger"
            onPress={() => setConfirmingDelete(true)}
          />
        ))}

      {failed && <ErrorBanner message={t('cats.actionError')} />}
    </View>
  );
}
