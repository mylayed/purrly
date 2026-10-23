import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, Switch, View } from 'react-native';

import { UtensilsIcon } from '@/components/icons';
import {
  AddButton,
  Button,
  Card,
  Chip,
  ConfirmDeleteButton,
  EmptyState,
  ErrorBanner,
  Screen,
  ScreenHeader,
  Text,
  TextField,
} from '@/components/ui';
import { useCat } from '@/features/cats/api';
import {
  useDeleteSlot,
  useFeedingSchedule,
  useFoods,
  useSaveSlot,
  type FeedingSlot,
  type Food,
} from '@/features/feeding/api';
import { FoodPicker } from '@/features/feeding/components/food-picker';
import { useFeedingFormat } from '@/features/feeding/use-feeding-format';
import {
  ALL_DAYS,
  maskTimeInput,
  MAX_PORTION_GRAMS,
  MIN_PORTION_GRAMS,
  parsePortionInput,
  parseTimeInput,
  shortTime,
} from '@/lib/feeding';
import { useTheme } from '@/theme';

export default function FeedingSchedule() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: cat } = useCat(id);
  const schedule = useFeedingSchedule(id);
  const foods = useFoods(id);
  // null — форма закрита, 'new' — новий слот, інакше id слота, що редагується.
  const [editing, setEditing] = useState<string | null>(null);

  const title = cat ? `${t('feeding.schedule.title')} · ${cat.name}` : t('feeding.schedule.title');
  const foodsById = new Map((foods.data ?? []).map((f) => [f.id, f]));
  const slots = schedule.data ?? [];

  return (
    <Screen scroll>
      <ScreenHeader title={title} backLabel={t('cats.back')} />

      {schedule.isPending || foods.isPending ? (
        <ActivityIndicator color={colors.accent} />
      ) : schedule.isError || foods.isError ? (
        <>
          <ErrorBanner message={t('feeding.loadError')} />
          <Button
            title={t('cats.retry')}
            variant="secondary"
            onPress={() => Promise.all([schedule.refetch(), foods.refetch()])}
          />
        </>
      ) : slots.length === 0 && !editing ? (
        <View style={{ minHeight: 360 }}>
          <EmptyState
            icon={<UtensilsIcon size={40} color={colors.accent} strokeWidth={1.75} />}
            title={t('feeding.schedule.emptyTitle')}
            body={t('feeding.schedule.emptyBody')}
            action={<Button title={t('feeding.schedule.add')} onPress={() => setEditing('new')} />}
          />
        </View>
      ) : (
        <>
          <Text tone="muted">{t('feeding.schedule.hint')}</Text>

          {slots.map((slot) =>
            editing === slot.id ? (
              <SlotForm
                key={slot.id}
                catId={id}
                slot={slot}
                foods={foods.data ?? []}
                onDone={() => setEditing(null)}
              />
            ) : (
              <SlotCard
                key={slot.id}
                catId={id}
                slot={slot}
                foods={foodsById}
                onEdit={() => setEditing(slot.id)}
              />
            ),
          )}

          {editing === 'new' ? (
            <SlotForm catId={id} foods={foods.data ?? []} onDone={() => setEditing(null)} />
          ) : (
            <AddButton title={t('feeding.schedule.add')} onPress={() => setEditing('new')} />
          )}
        </>
      )}
    </Screen>
  );
}

function SlotCard({
  catId,
  slot,
  foods,
  onEdit,
}: {
  catId: string;
  slot: FeedingSlot;
  foods: Map<string, Food>;
  onEdit: () => void;
}) {
  const { t } = useTranslation();
  const { colors, radii, spacing } = useTheme();
  const fmt = useFeedingFormat();
  const saveSlot = useSaveSlot(catId);
  const deleteSlot = useDeleteSlot(catId);
  const time = fmt.time(slot.time_of_day);

  const toggle = (enabled: boolean) =>
    saveSlot.mutate({
      id: slot.id,
      input: {
        timeOfDay: shortTime(slot.time_of_day),
        daysOfWeek: slot.days_of_week,
        food: slot.food_id ? { id: slot.food_id, name: fmt.foodName(slot, foods) } : null,
        grams: slot.amount_grams,
        enabled,
      },
    });

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
        accessibilityLabel={t('feeding.schedule.editA11y', { time })}
        onPress={onEdit}
        style={({ pressed }) => ({ flex: 1, gap: 2, opacity: pressed ? 0.6 : 1 })}
      >
        <Text variant="title" tone={slot.enabled ? 'default' : 'muted'}>
          {time}
        </Text>
        <Text tone={slot.enabled ? 'default' : 'muted'} numberOfLines={2}>
          {fmt.portion(slot, foods)}
        </Text>
        <Text variant="caption" tone="muted">
          {slot.enabled ? fmt.days(slot.days_of_week) : t('feeding.schedule.paused')}
        </Text>
        {saveSlot.isError && (
          <Text variant="caption" tone="danger">
            {t('feeding.saveError')}
          </Text>
        )}
      </Pressable>
      <Switch
        accessibilityLabel={t('feeding.schedule.enabledA11y', { time })}
        value={slot.enabled}
        onValueChange={toggle}
        disabled={saveSlot.isPending}
        trackColor={{ false: colors.border, true: colors.accent }}
        thumbColor={colors.card}
        ios_backgroundColor={colors.border}
      />
      <ConfirmDeleteButton
        label={t('feeding.schedule.delete')}
        confirmLabel={t('feeding.deleteConfirm')}
        onConfirm={() => deleteSlot.mutate(slot.id)}
      />
    </View>
  );
}

function SlotForm({
  catId,
  slot,
  foods,
  onDone,
}: {
  catId: string;
  slot?: FeedingSlot;
  foods: Food[];
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const fmt = useFeedingFormat();
  const saveSlot = useSaveSlot(catId);

  const [time, setTime] = useState(slot ? shortTime(slot.time_of_day) : '');
  const [days, setDays] = useState<number[]>(slot?.days_of_week ?? [...ALL_DAYS]);
  const [food, setFood] = useState<Pick<Food, 'id' | 'name'> | null>(
    slot?.food_id ? (foods.find((f) => f.id === slot.food_id) ?? null) : null,
  );
  const [grams, setGrams] = useState(
    slot?.amount_grams ? fmt.number.format(slot.amount_grams) : '',
  );
  const [showValidation, setShowValidation] = useState(false);

  const parsedTime = parseTimeInput(time);
  const portion = grams.trim() ? parsePortionInput(grams) : null;
  const timeError = parsedTime ? null : t('feeding.timeInvalid');
  const daysError = days.length > 0 ? null : t('feeding.schedule.daysRequired');
  const gramsError =
    grams.trim() && portion === null
      ? t('feeding.gramsInvalid', { min: MIN_PORTION_GRAMS, max: MAX_PORTION_GRAMS })
      : null;

  const toggleDay = (day: number) =>
    setDays((current) =>
      current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort(),
    );

  function submit() {
    setShowValidation(true);
    if (!parsedTime || daysError || gramsError || saveSlot.isPending) return;
    saveSlot.mutate(
      {
        id: slot?.id,
        input: {
          timeOfDay: parsedTime,
          daysOfWeek: days,
          food,
          grams: portion,
          enabled: slot?.enabled ?? true,
        },
      },
      { onSuccess: onDone },
    );
  }

  return (
    <Card style={{ gap: spacing.md }}>
      <Text variant="heading">
        {slot ? t('feeding.schedule.editTitle') : t('feeding.schedule.add')}
      </Text>
      <TextField
        label={t('feeding.time')}
        placeholder={t('feeding.timePlaceholder')}
        value={time}
        onChangeText={(text) => setTime(maskTimeInput(text))}
        error={showValidation ? timeError : null}
        keyboardType="number-pad"
        maxLength={5}
        autoFocus={!slot}
        editable={!saveSlot.isPending}
      />
      <View style={{ gap: spacing.sm }}>
        <Text variant="label">{t('feeding.schedule.days')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {ALL_DAYS.map((day) => (
            <Chip
              key={day}
              label={fmt.weekday(day)}
              selected={days.includes(day)}
              disabled={saveSlot.isPending}
              onPress={() => toggleDay(day)}
            />
          ))}
        </View>
        {showValidation && daysError ? (
          <Text variant="caption" tone="danger">
            {daysError}
          </Text>
        ) : (
          <Text variant="caption" tone="muted">
            {days.length > 0 ? fmt.days(days) : ' '}
          </Text>
        )}
      </View>
      <FoodPicker
        catId={catId}
        foods={foods}
        value={food?.id ?? null}
        onChange={setFood}
        disabled={saveSlot.isPending}
      />
      <TextField
        label={t('feeding.portion')}
        placeholder={t('feeding.portionPlaceholder')}
        value={grams}
        onChangeText={setGrams}
        error={showValidation ? gramsError : null}
        keyboardType="decimal-pad"
        editable={!saveSlot.isPending}
      />
      {saveSlot.isError && <ErrorBanner message={t('feeding.saveError')} />}
      <View style={{ gap: spacing.sm }}>
        <Button
          title={saveSlot.isPending ? t('feeding.saving') : t('feeding.save')}
          disabled={saveSlot.isPending}
          onPress={submit}
        />
        <Button
          title={t('deleteAccount.cancel')}
          variant="ghost"
          disabled={saveSlot.isPending}
          onPress={onDone}
        />
      </View>
    </Card>
  );
}
