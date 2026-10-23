import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { CheckIcon, ChevronRightIcon, UtensilsIcon } from '@/components/icons';
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
  MEALS_HISTORY_DAYS,
  useAddMeal,
  useDeleteMeal,
  type FeedingSlot,
  type Food,
  type Meal,
} from '@/features/feeding/api';
import { FoodPicker } from '@/features/feeding/components/food-picker';
import { SlotDots } from '@/features/feeding/components/slot-dots';
import { useFeedingFormat } from '@/features/feeding/use-feeding-format';
import { useFeedingToday } from '@/features/feeding/use-feeding-today';
import {
  localDayKey,
  maskTimeInput,
  MAX_PORTION_GRAMS,
  mealDate,
  MIN_PORTION_GRAMS,
  nowTimeInput,
  parsePortionInput,
  parseTimeInput,
} from '@/lib/feeding';
import { useTheme } from '@/theme';

const JOURNAL_PREVIEW_DAYS = 3;

export default function CatFeeding() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: cat } = useCat(id);
  const today = useFeedingToday(id);
  const [adding, setAdding] = useState(false);

  const title = cat ? `${t('feeding.title')} · ${cat.name}` : t('feeding.title');
  const isEmpty = today.schedule.length === 0 && today.allMeals.length === 0;
  const openSchedule = () =>
    router.push({ pathname: '/cat/[id]/feeding/schedule', params: { id } });
  const openFoods = () => router.push({ pathname: '/cat/[id]/feeding/foods', params: { id } });

  return (
    <Screen scroll>
      <ScreenHeader title={title} backLabel={t('cats.back')} />

      {today.isPending ? (
        <ActivityIndicator color={colors.accent} />
      ) : today.isError ? (
        <>
          <ErrorBanner message={t('feeding.loadError')} />
          <Button title={t('cats.retry')} variant="secondary" onPress={() => today.refetch()} />
        </>
      ) : isEmpty && !adding ? (
        <View style={{ minHeight: 360 }}>
          <EmptyState
            icon={<UtensilsIcon size={40} color={colors.accent} strokeWidth={1.75} />}
            title={t('feeding.emptyTitle')}
            body={t('feeding.emptyBody')}
            action={
              <View style={{ gap: spacing.sm, alignSelf: 'stretch' }}>
                <Button title={t('feeding.setupSchedule')} onPress={openSchedule} />
                <Button
                  title={t('feeding.logMeal')}
                  variant="ghost"
                  onPress={() => setAdding(true)}
                />
              </View>
            }
          />
        </View>
      ) : (
        <>
          <TodayCard catId={id} today={today} />

          {adding ? (
            <AddMealForm
              catId={id}
              foods={today.allFoods}
              lastMeal={today.allMeals[0]}
              onDone={() => setAdding(false)}
            />
          ) : (
            <AddButton title={t('feeding.logMeal')} onPress={() => setAdding(true)} />
          )}

          <Card style={{ gap: spacing.xs, paddingVertical: spacing.sm }}>
            <NavRow
              title={t('feeding.schedule.title')}
              value={
                today.schedule.length > 0
                  ? t('feeding.schedule.count', { count: today.schedule.length })
                  : t('feeding.schedule.none')
              }
              onPress={openSchedule}
            />
            <NavRow
              title={t('feeding.foods.title')}
              value={
                today.allFoods.length > 0
                  ? t('feeding.foods.count', { count: today.allFoods.length })
                  : t('feeding.foods.none')
              }
              onPress={openFoods}
            />
          </Card>

          {today.allMeals.length > 0 && (
            <Journal catId={id} meals={today.allMeals} foods={today.foods} />
          )}
        </>
      )}
    </Screen>
  );
}

type Today = ReturnType<typeof useFeedingToday>;

function TodayCard({ catId, today }: { catId: string; today: Today }) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const fmt = useFeedingFormat();
  const done = today.slots.filter((s) => today.mealBySlot.has(s.id)).length;

  const totals = [
    today.plannedGrams > 0
      ? t('feeding.gramsOf', {
          eaten: fmt.number.format(today.eatenGrams),
          planned: fmt.grams(today.plannedGrams),
        })
      : today.eatenGrams > 0
        ? fmt.grams(today.eatenGrams)
        : null,
    today.eatenKcal > 0 ? fmt.kcal(today.eatenKcal) : null,
  ].filter(Boolean);

  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ gap: spacing.xs }}>
        <Text variant="caption" tone="muted">
          {t('feeding.today')}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Text variant="title">
            {today.slots.length > 0
              ? t('feeding.progress', { done, total: today.slots.length })
              : t('feeding.mealsToday', { count: today.meals.length })}
          </Text>
          {today.slots.length > 0 && <SlotDots done={done} total={today.slots.length} />}
        </View>
        {totals.length > 0 && <Text tone="muted">{totals.join(' · ')}</Text>}
      </View>

      {today.slots.length > 0 ? (
        today.slots.map((slot) => (
          <SlotRow
            key={slot.id}
            catId={catId}
            slot={slot}
            meal={today.mealBySlot.get(slot.id)}
            foods={today.foods}
          />
        ))
      ) : (
        <Text tone="muted">{t('feeding.noScheduleToday')}</Text>
      )}
    </Card>
  );
}

function SlotRow({
  catId,
  slot,
  meal,
  foods,
}: {
  catId: string;
  slot: FeedingSlot;
  meal: Meal | undefined;
  foods: Map<string, Food>;
}) {
  const { t } = useTranslation();
  const { colors, radii, spacing } = useTheme();
  const fmt = useFeedingFormat();
  const addMeal = useAddMeal(catId);
  const deleteMeal = useDeleteMeal(catId);

  const feed = () =>
    addMeal.mutate({
      fedAt: new Date().toISOString(),
      food: slot.food_id ? { id: slot.food_id, name: fmt.foodName(slot, foods) } : null,
      grams: slot.amount_grams,
      scheduleId: slot.id,
      note: null,
    });

  return (
    <View style={{ gap: spacing.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Text variant="bodyStrong" style={{ width: 64, fontVariant: ['tabular-nums'] }}>
          {fmt.time(slot.time_of_day)}
        </Text>
        <Text tone={meal ? 'muted' : 'default'} style={{ flex: 1 }} numberOfLines={2}>
          {fmt.portion(slot, foods)}
        </Text>
        {meal ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View
              accessible
              accessibilityLabel={t('feeding.fedAtA11y', { time: fmt.clock(meal.fed_at) })}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                borderRadius: radii.pill,
                backgroundColor: colors.secondaryBg,
              }}
            >
              <CheckIcon size={16} color={colors.secondaryText} strokeWidth={2.5} autoPlay />
              <Text variant="caption" tone="secondary">
                {fmt.clock(meal.fed_at)}
              </Text>
            </View>
            <ConfirmDeleteButton
              label={t('feeding.undo')}
              confirmLabel={t('feeding.undoConfirm')}
              onConfirm={() => deleteMeal.mutate(meal.id)}
            />
          </View>
        ) : (
          <Button
            title={t('feeding.feed')}
            variant="secondary"
            disabled={addMeal.isPending}
            onPress={feed}
            style={{ minHeight: 40, paddingHorizontal: spacing.lg }}
          />
        )}
      </View>
      {addMeal.isError && <ErrorBanner message={t('feeding.saveError')} />}
    </View>
  );
}

function AddMealForm({
  catId,
  foods,
  lastMeal,
  onDone,
}: {
  catId: string;
  foods: Food[];
  lastMeal: Meal | undefined;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const fmt = useFeedingFormat();
  const addMeal = useAddMeal(catId);

  // Підставляємо останній корм і порцію: найчастіше кота годують тим самим.
  const lastFood = lastMeal?.food_id ? foods.find((f) => f.id === lastMeal.food_id) : undefined;
  const [food, setFood] = useState<Food | null>(lastFood ?? null);
  const [grams, setGrams] = useState(
    lastMeal?.amount_grams ? fmt.number.format(lastMeal.amount_grams) : '',
  );
  const [day, setDay] = useState<'today' | 'yesterday'>('today');
  const [time, setTime] = useState(nowTimeInput);
  const [note, setNote] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  // «Час ще не настав» перевіряємо при збереженні: під час рендеру «зараз» не стабільне.
  const [future, setFuture] = useState(false);

  const portion = grams.trim() ? parsePortionInput(grams) : null;
  const gramsError =
    grams.trim() && portion === null
      ? t('feeding.gramsInvalid', { min: MIN_PORTION_GRAMS, max: MAX_PORTION_GRAMS })
      : null;
  const parsedTime = parseTimeInput(time);
  const timeError = !parsedTime
    ? t('feeding.timeInvalid')
    : future
      ? t('feeding.timeFuture')
      : null;

  function submit() {
    setShowValidation(true);
    if (!parsedTime || gramsError || addMeal.isPending) return;
    const now = new Date();
    const fedAt = mealDate(day === 'yesterday' ? -1 : 0, parsedTime, now);
    if (fedAt > now) {
      setFuture(true);
      return;
    }
    addMeal.mutate(
      {
        fedAt: fedAt.toISOString(),
        food: food ? { id: food.id, name: food.name } : null,
        grams: portion,
        scheduleId: null,
        note: note.trim() || null,
      },
      { onSuccess: onDone },
    );
  }

  return (
    <Card style={{ gap: spacing.md }}>
      <Text variant="heading">{t('feeding.logMeal')}</Text>
      <FoodPicker
        catId={catId}
        foods={foods}
        value={food?.id ?? null}
        onChange={setFood}
        disabled={addMeal.isPending}
      />
      <TextField
        label={t('feeding.portion')}
        placeholder={t('feeding.portionPlaceholder')}
        value={grams}
        onChangeText={setGrams}
        error={showValidation ? gramsError : null}
        keyboardType="decimal-pad"
        editable={!addMeal.isPending}
      />
      <View style={{ gap: spacing.xs }}>
        <Text variant="label">{t('feeding.when')}</Text>
        <SegmentedControl
          options={[
            { value: 'today', label: t('feeding.today') },
            { value: 'yesterday', label: t('feeding.yesterday') },
          ]}
          value={day}
          onChange={(value) => {
            setDay(value);
            setFuture(false);
          }}
        />
      </View>
      <TextField
        label={t('feeding.time')}
        placeholder={t('feeding.timePlaceholder')}
        value={time}
        onChangeText={(text) => {
          setTime(maskTimeInput(text));
          setFuture(false);
        }}
        error={showValidation ? timeError : null}
        keyboardType="number-pad"
        maxLength={5}
        editable={!addMeal.isPending}
      />
      <TextField
        label={t('feeding.note')}
        placeholder={t('feeding.notePlaceholder')}
        value={note}
        onChangeText={setNote}
        maxLength={200}
        editable={!addMeal.isPending}
      />
      {addMeal.isError && <ErrorBanner message={t('feeding.saveError')} />}
      <View style={{ gap: spacing.sm }}>
        <Button
          title={addMeal.isPending ? t('feeding.saving') : t('feeding.save')}
          disabled={addMeal.isPending}
          onPress={submit}
        />
        <Button
          title={t('deleteAccount.cancel')}
          variant="ghost"
          disabled={addMeal.isPending}
          onPress={onDone}
        />
      </View>
    </Card>
  );
}

function NavRow({ title, value, onPress }: { title: string; value: string; onPress: () => void }) {
  const { colors, radii, spacing } = useTheme();
  const [presses, setPresses] = useState(0);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${value}`}
      onPressIn={() => setPresses((n) => n + 1)}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        minHeight: 48,
        marginHorizontal: -spacing.sm,
        paddingHorizontal: spacing.sm,
        borderRadius: radii.md,
        backgroundColor: pressed ? colors.accentSoft : 'transparent',
      })}
    >
      <Text variant="bodyStrong" style={{ flex: 1 }}>
        {title}
      </Text>
      <Text tone="muted">{value}</Text>
      <ChevronRightIcon size={20} color={colors.textMuted} trigger={presses} />
    </Pressable>
  );
}

// Журнал за останні дні, згрупований по днях; сьогоднішній день — у картці вище.
function Journal({
  catId,
  meals,
  foods,
}: {
  catId: string;
  meals: Meal[];
  foods: Map<string, Food>;
}) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const fmt = useFeedingFormat();
  const deleteMeal = useDeleteMeal(catId);
  const [showAll, setShowAll] = useState(false);

  const days = new Map<string, Meal[]>();
  for (const meal of meals) {
    const key = localDayKey(new Date(meal.fed_at));
    days.set(key, [...(days.get(key) ?? []), meal]);
  }
  const entries = [...days.entries()];
  const visible = showAll ? entries : entries.slice(0, JOURNAL_PREVIEW_DAYS);

  return (
    <Card style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.xs }}>
        <Text variant="heading">{t('feeding.journal')}</Text>
        <Text variant="caption" tone="muted">
          {t('feeding.journalHint', { count: MEALS_HISTORY_DAYS })}
        </Text>
      </View>
      {visible.map(([key, dayMeals]) => {
        const total = dayMeals.reduce((sum, m) => sum + (m.amount_grams ?? 0), 0);
        return (
          <View key={key} style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <Text variant="label" style={{ flex: 1 }}>
                {fmt.dayLabel(key)}
              </Text>
              {total > 0 && (
                <Text variant="caption" tone="muted">
                  {fmt.grams(total)}
                </Text>
              )}
            </View>
            {dayMeals.map((meal) => (
              <View
                key={meal.id}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
              >
                <Text tone="muted" style={{ width: 64, fontVariant: ['tabular-nums'] }}>
                  {fmt.clock(meal.fed_at)}
                </Text>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text numberOfLines={2}>{fmt.portion(meal, foods)}</Text>
                  {meal.note ? (
                    <Text variant="caption" tone="muted" numberOfLines={2}>
                      {meal.note}
                    </Text>
                  ) : null}
                </View>
                <ConfirmDeleteButton
                  label={t('feeding.deleteMeal')}
                  confirmLabel={t('feeding.deleteConfirm')}
                  onConfirm={() => deleteMeal.mutate(meal.id)}
                />
              </View>
            ))}
          </View>
        );
      })}
      {!showAll && entries.length > JOURNAL_PREVIEW_DAYS && (
        <Button
          title={t('feeding.showAllDays', { count: entries.length })}
          variant="ghost"
          onPress={() => setShowAll(true)}
        />
      )}
    </Card>
  );
}
