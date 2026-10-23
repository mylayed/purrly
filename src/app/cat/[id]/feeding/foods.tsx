import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { UtensilsIcon } from '@/components/icons';
import {
  AddButton,
  Button,
  Card,
  ConfirmDeleteButton,
  EmptyState,
  ErrorBanner,
  Screen,
  ScreenHeader,
  SegmentedControl,
  Text,
  TextField,
} from '@/components/ui';
import { useCat } from '@/features/cats/api';
import {
  useDeleteFood,
  useFoods,
  useSaveFood,
  type Food,
  type FoodKind,
} from '@/features/feeding/api';
import { useFeedingFormat } from '@/features/feeding/use-feeding-format';
import { MAX_KCAL_PER_100G, parseKcalInput } from '@/lib/feeding';
import { useTheme } from '@/theme';

const KINDS: FoodKind[] = ['dry', 'wet', 'treat', 'other'];

export default function CatFoods() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: cat } = useCat(id);
  const { data: foods, isPending, isError, refetch } = useFoods(id);
  // null — форма закрита, 'new' — новий корм, інакше id корму, що редагується.
  const [editing, setEditing] = useState<string | null>(null);

  const title = cat ? `${t('feeding.foods.title')} · ${cat.name}` : t('feeding.foods.title');

  return (
    <Screen scroll header={<ScreenHeader title={title} backLabel={t('cats.back')} />}>
      {isPending ? (
        <ActivityIndicator color={colors.accent} />
      ) : isError ? (
        <>
          <ErrorBanner message={t('feeding.loadError')} />
          <Button title={t('cats.retry')} variant="secondary" onPress={() => refetch()} />
        </>
      ) : foods.length === 0 && !editing ? (
        <View style={{ minHeight: 360 }}>
          <EmptyState
            icon={<UtensilsIcon size={40} color={colors.accent} strokeWidth={1.75} />}
            title={t('feeding.foods.emptyTitle')}
            body={t('feeding.foods.emptyBody')}
            action={<Button title={t('feeding.foods.add')} onPress={() => setEditing('new')} />}
          />
        </View>
      ) : (
        <>
          {foods.map((food) =>
            editing === food.id ? (
              <FoodForm key={food.id} catId={id} food={food} onDone={() => setEditing(null)} />
            ) : (
              <FoodRow key={food.id} catId={id} food={food} onEdit={() => setEditing(food.id)} />
            ),
          )}
          {editing === 'new' ? (
            <FoodForm catId={id} onDone={() => setEditing(null)} />
          ) : (
            <AddButton title={t('feeding.foods.add')} onPress={() => setEditing('new')} />
          )}
        </>
      )}
    </Screen>
  );
}

function FoodRow({ catId, food, onEdit }: { catId: string; food: Food; onEdit: () => void }) {
  const { t } = useTranslation();
  const { colors, radii, spacing } = useTheme();
  const fmt = useFeedingFormat();
  const deleteFood = useDeleteFood(catId);

  const details = [
    t(`feeding.foods.kinds.${food.kind}`),
    food.kcal_per_100g
      ? t('feeding.foods.kcalValue', { value: fmt.number.format(food.kcal_per_100g) })
      : null,
  ].filter(Boolean);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radii.lg,
        backgroundColor: colors.card,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('feeding.foods.editA11y', { name: food.name })}
        onPress={onEdit}
        style={({ pressed }) => ({ flex: 1, gap: 2, opacity: pressed ? 0.6 : 1 })}
      >
        <Text variant="bodyStrong">{food.name}</Text>
        <Text variant="caption" tone="muted">
          {details.join(' · ')}
        </Text>
      </Pressable>
      <ConfirmDeleteButton
        label={t('feeding.foods.delete')}
        confirmLabel={t('feeding.deleteConfirm')}
        onConfirm={() => deleteFood.mutate(food.id)}
      />
    </View>
  );
}

function FoodForm({ catId, food, onDone }: { catId: string; food?: Food; onDone: () => void }) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const fmt = useFeedingFormat();
  const saveFood = useSaveFood(catId);

  const [name, setName] = useState(food?.name ?? '');
  const [kind, setKind] = useState<FoodKind>(food?.kind ?? 'dry');
  const [kcal, setKcal] = useState(
    food?.kcal_per_100g ? fmt.number.format(food.kcal_per_100g) : '',
  );
  const [showValidation, setShowValidation] = useState(false);

  const kcalValue = kcal.trim() ? parseKcalInput(kcal) : null;
  const nameError = name.trim() ? null : t('feeding.foods.nameRequired');
  const kcalError =
    kcal.trim() && kcalValue === null
      ? t('feeding.foods.kcalInvalid', { max: MAX_KCAL_PER_100G })
      : null;

  function submit() {
    setShowValidation(true);
    if (nameError || kcalError || saveFood.isPending) return;
    saveFood.mutate(
      { id: food?.id, input: { name: name.trim(), kind, kcalPer100g: kcalValue } },
      { onSuccess: onDone },
    );
  }

  return (
    <Card style={{ gap: spacing.md }}>
      <Text variant="heading">{food ? t('feeding.foods.editTitle') : t('feeding.foods.add')}</Text>
      <TextField
        label={t('feeding.foods.name')}
        placeholder={t('feeding.foods.namePlaceholder')}
        value={name}
        onChangeText={setName}
        error={showValidation ? nameError : null}
        maxLength={80}
        autoFocus={!food}
        editable={!saveFood.isPending}
      />
      <View style={{ gap: spacing.xs }}>
        <Text variant="label">{t('feeding.foods.kind')}</Text>
        <SegmentedControl
          options={KINDS.map((value) => ({ value, label: t(`feeding.foods.kinds.${value}`) }))}
          value={kind}
          onChange={setKind}
        />
      </View>
      <TextField
        label={t('feeding.foods.kcal')}
        placeholder={t('feeding.foods.kcalPlaceholder')}
        hint={t('feeding.foods.kcalHint')}
        value={kcal}
        onChangeText={setKcal}
        error={showValidation ? kcalError : null}
        keyboardType="decimal-pad"
        editable={!saveFood.isPending}
      />
      {saveFood.isError && <ErrorBanner message={t('feeding.saveError')} />}
      <View style={{ gap: spacing.sm }}>
        <Button
          title={saveFood.isPending ? t('feeding.saving') : t('feeding.save')}
          disabled={saveFood.isPending}
          onPress={submit}
        />
        <Button
          title={t('deleteAccount.cancel')}
          variant="ghost"
          disabled={saveFood.isPending}
          onPress={onDone}
        />
      </View>
    </Card>
  );
}
