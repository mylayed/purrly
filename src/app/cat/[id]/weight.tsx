import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import { ChartLineIcon } from '@/components/icons';
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
  StatusBanner,
  Text,
  TextField,
} from '@/components/ui';
import { useCat } from '@/features/cats/api';
import { useAddWeight, useDeleteWeight, useWeights, type WeightEntry } from '@/features/weight/api';
import { WeightChart } from '@/features/weight/components/weight-chart';
import { useWeightFormat } from '@/features/weight/use-weight-format';
import { formatBirthDate, maskBirthDateInput, parseBirthDate } from '@/lib/cat-age';
import { MAX_WEIGHT_GRAMS, MIN_WEIGHT_GRAMS, parseWeightInput, weightChange } from '@/lib/weight';
import { useTheme } from '@/theme';

type Range = 'm1' | 'm3' | 'm6' | 'y1' | 'all';
const RANGE_DAYS: Record<Range, number | null> = { m1: 31, m3: 92, m6: 183, y1: 366, all: null };
const HISTORY_PREVIEW = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

function todayInput() {
  const now = new Date();
  return formatBirthDate(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
  );
}

export default function CatWeight() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: cat } = useCat(id);
  const { data: weights, isPending, isError, refetch } = useWeights(id);
  const fmt = useWeightFormat();
  const [range, setRange] = useState<Range>('m3');
  const [adding, setAdding] = useState(false);

  const title = cat ? `${t('weight.title')} · ${cat.name}` : t('weight.title');
  const latest = weights?.[weights.length - 1];
  const change = weights
    ? weightChange(weights.map((w) => ({ measuredAt: w.measured_at, grams: w.weight_grams })))
    : null;
  const alert = change ? fmt.alert(change) : null;

  // Період рахуємо від останнього виміру, а не від сьогодні: так графік не порожніє,
  // якщо кота давно не зважували.
  const rangeDays = RANGE_DAYS[range];
  const latestTime = latest ? Date.parse(latest.measured_at) : 0;
  const points = (weights ?? [])
    .filter(
      (w) => rangeDays === null || latestTime - Date.parse(w.measured_at) <= rangeDays * DAY_MS,
    )
    .map((w) => ({ time: Date.parse(w.measured_at), grams: w.weight_grams }));

  const formatDate = (time: number) =>
    new Intl.DateTimeFormat(fmt.locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(
      new Date(time),
    );

  return (
    <Screen scroll header={<ScreenHeader title={title} backLabel={t('cats.back')} />}>
      {isPending ? (
        <ActivityIndicator color={colors.accent} />
      ) : isError ? (
        <>
          <ErrorBanner message={t('weight.loadError')} />
          <Button title={t('cats.retry')} variant="secondary" onPress={() => refetch()} />
        </>
      ) : weights.length === 0 && !adding ? (
        <View style={{ minHeight: 360 }}>
          <EmptyState
            icon={<ChartLineIcon size={40} color={colors.accent} strokeWidth={1.75} autoPlay />}
            title={t('weight.emptyTitle')}
            body={t('weight.emptyBody')}
            action={<Button title={t('weight.add')} onPress={() => setAdding(true)} />}
          />
        </View>
      ) : (
        <>
          {latest && (
            <View style={{ gap: spacing.xs }}>
              <Text variant="caption" tone="muted">
                {t('weight.latest')}
              </Text>
              <Text variant="display">{fmt.format(latest.weight_grams)}</Text>
              {change && <Text tone="muted">{fmt.change(change)}</Text>}
            </View>
          )}
          {alert && <StatusBanner tone={alert.tone} message={alert.message} />}

          {weights.length > 0 && (
            <>
              {/* Фільтр періоду — один рядок над графіком, який він обмежує. */}
              <SegmentedControl
                options={(['m1', 'm3', 'm6', 'y1', 'all'] as const).map((value) => ({
                  value,
                  label: t(`weight.ranges.${value}`),
                }))}
                value={range}
                onChange={setRange}
              />
              <Card>
                {points.length > 0 ? (
                  <WeightChart
                    points={points}
                    unit={fmt.unit}
                    unitLabel={fmt.unitLabel}
                    locale={fmt.locale}
                    accessibilityLabel={t('weight.chartA11y', {
                      from: formatDate(points[0]!.time),
                      to: formatDate(points[points.length - 1]!.time),
                      value: fmt.format(points[points.length - 1]!.grams),
                    })}
                  />
                ) : (
                  <Text tone="muted">{t('weight.noDataInRange')}</Text>
                )}
              </Card>
            </>
          )}

          {adding ? (
            <AddWeightForm catId={id} onDone={() => setAdding(false)} />
          ) : (
            <AddButton title={t('weight.add')} onPress={() => setAdding(true)} />
          )}

          {weights.length > 0 && <History catId={id} weights={weights} formatDate={formatDate} />}
        </>
      )}
    </Screen>
  );
}

function AddWeightForm({ catId, onDone }: { catId: string; onDone: () => void }) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const fmt = useWeightFormat();
  const addWeight = useAddWeight(catId);

  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(todayInput);
  const [note, setNote] = useState('');
  const [showValidation, setShowValidation] = useState(false);

  const grams = parseWeightInput(weight, fmt.unit);
  const dateIso = parseBirthDate(date);
  const weightError =
    grams === null
      ? t('weight.weightInvalid', {
          min: fmt.number(MIN_WEIGHT_GRAMS),
          max: fmt.number(MAX_WEIGHT_GRAMS),
          unit: fmt.unitLabel,
        })
      : null;
  const dateError = dateIso ? null : t('weight.dateInvalid');

  function submit() {
    setShowValidation(true);
    if (grams === null || !dateIso || addWeight.isPending) return;

    // Сьогоднішній запис — з поточним часом (щоб кілька за день ішли по порядку),
    // минулі дні — опівдні, щоб часовий пояс не перекинув дату.
    const [y, m, d] = dateIso.split('-').map(Number) as [number, number, number];
    const now = new Date();
    const isToday = y === now.getFullYear() && m === now.getMonth() + 1 && d === now.getDate();
    const measuredAt = isToday ? now.toISOString() : new Date(y, m - 1, d, 12).toISOString();

    addWeight.mutate({ grams, measuredAt, note: note.trim() || null }, { onSuccess: onDone });
  }

  return (
    <Card style={{ gap: spacing.md }}>
      <Text variant="heading">{t('weight.addTitle')}</Text>
      <TextField
        label={t('weight.weightLabel', { unit: fmt.unitLabel })}
        placeholder={t(`weight.weightPlaceholder.${fmt.unit}`)}
        value={weight}
        onChangeText={setWeight}
        error={showValidation ? weightError : null}
        keyboardType="decimal-pad"
        autoFocus
        editable={!addWeight.isPending}
      />
      <TextField
        label={t('weight.date')}
        placeholder={t('cats.form.birthDatePlaceholder')}
        value={date}
        onChangeText={(text) => setDate(maskBirthDateInput(text))}
        error={showValidation ? dateError : null}
        keyboardType="number-pad"
        maxLength={10}
        editable={!addWeight.isPending}
      />
      <TextField
        label={t('weight.note')}
        placeholder={t('weight.notePlaceholder')}
        value={note}
        onChangeText={setNote}
        maxLength={200}
        editable={!addWeight.isPending}
      />
      {addWeight.isError && <ErrorBanner message={t('weight.saveError')} />}
      <View style={{ gap: spacing.sm }}>
        <Button
          title={addWeight.isPending ? t('weight.saving') : t('weight.save')}
          disabled={addWeight.isPending}
          onPress={submit}
        />
        <Button
          title={t('deleteAccount.cancel')}
          variant="ghost"
          disabled={addWeight.isPending}
          onPress={onDone}
        />
      </View>
    </Card>
  );
}

// Таблиця записів — доступний відповідник графіка (кожне значення читається без нього).
function History({
  catId,
  weights,
  formatDate,
}: {
  catId: string;
  weights: WeightEntry[];
  formatDate: (time: number) => string;
}) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const [showAll, setShowAll] = useState(false);
  const rows = [...weights].reverse();
  const visible = showAll ? rows : rows.slice(0, HISTORY_PREVIEW);

  return (
    <Card style={{ gap: spacing.md }}>
      <Text variant="heading">{t('weight.history')}</Text>
      {visible.map((entry) => (
        <HistoryRow key={entry.id} catId={catId} entry={entry} formatDate={formatDate} />
      ))}
      {!showAll && rows.length > HISTORY_PREVIEW && (
        <Button
          title={t('weight.showAll', { count: rows.length })}
          variant="ghost"
          onPress={() => setShowAll(true)}
        />
      )}
    </Card>
  );
}

function HistoryRow({
  catId,
  entry,
  formatDate,
}: {
  catId: string;
  entry: WeightEntry;
  formatDate: (time: number) => string;
}) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const fmt = useWeightFormat();
  const deleteWeight = useDeleteWeight(catId);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text>{formatDate(Date.parse(entry.measured_at))}</Text>
        {entry.note ? (
          <Text variant="caption" tone="muted" numberOfLines={2}>
            {entry.note}
          </Text>
        ) : null}
      </View>
      <Text variant="bodyStrong" style={{ fontVariant: ['tabular-nums'] }}>
        {fmt.format(entry.weight_grams)}
      </Text>
      <ConfirmDeleteButton
        label={t('weight.delete')}
        confirmLabel={t('weight.deleteConfirm')}
        onConfirm={() => deleteWeight.mutate(entry.id)}
      />
    </View>
  );
}
