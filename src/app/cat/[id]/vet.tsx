import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { StethoscopeIcon } from '@/components/icons';
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
  useDeleteVetEvent,
  useSaveVetEvent,
  useVetEvents,
  type VetEvent,
  type VetEventType,
} from '@/features/vet/api';
import { DueBadge } from '@/features/vet/components/due-badge';
import { useVetFormat } from '@/features/vet/use-vet-format';
import { maskBirthDateInput } from '@/lib/cat-age';
import {
  addMonths,
  DEFAULT_INTERVAL_MONTHS,
  formatDateInput,
  parseDateInput,
  todayIso,
  upcomingDue,
  VET_TYPES,
} from '@/lib/vet';
import { useTheme } from '@/theme';

const HISTORY_PREVIEW = 10;
// Швидкий вибір наступної дати: місяці від дати запису.
const NEXT_DUE_PRESETS = [1, 3, 6, 12] as const;

export default function CatVet() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: cat } = useCat(id);
  const { data: events, isPending, isError, refetch } = useVetEvents(id);
  // null — форма закрита, 'new' — новий запис, інакше id запису, що редагується.
  const [editing, setEditing] = useState<string | null>(null);
  const [filter, setFilter] = useState<VetEventType | 'all'>('all');

  const title = cat ? `${t('vet.title')} · ${cat.name}` : t('vet.title');
  const upcoming = upcomingDue(events ?? []);
  const types = VET_TYPES.filter((type) => (events ?? []).some((e) => e.type === type));
  const visible = (events ?? []).filter((e) => filter === 'all' || e.type === filter);

  return (
    <Screen scroll header={<ScreenHeader title={title} backLabel={t('cats.back')} />}>
      {isPending ? (
        <ActivityIndicator color={colors.accent} />
      ) : isError ? (
        <>
          <ErrorBanner message={t('vet.loadError')} />
          <Button title={t('cats.retry')} variant="secondary" onPress={() => refetch()} />
        </>
      ) : events.length === 0 && !editing ? (
        <View style={{ minHeight: 360 }}>
          <EmptyState
            icon={<StethoscopeIcon size={22} color={colors.accent} strokeWidth={2} />}
            title={t('vet.emptyTitle')}
            body={t('vet.emptyBody')}
            action={<Button title={t('vet.add')} onPress={() => setEditing('new')} />}
          />
        </View>
      ) : (
        <>
          {upcoming.length > 0 && (
            <Card style={{ gap: spacing.md }}>
              <Text variant="heading">{t('vet.upcoming')}</Text>
              {upcoming.map(({ event, days, status }) => (
                <UpcomingRow key={event.id} event={event} days={days} status={status} />
              ))}
            </Card>
          )}

          {editing === 'new' ? (
            <VetForm catId={id} onDone={() => setEditing(null)} />
          ) : (
            <AddButton title={t('vet.add')} onPress={() => setEditing('new')} />
          )}

          {events.length > 0 && (
            <Card style={{ gap: spacing.md }}>
              <Text variant="heading">{t('vet.history')}</Text>
              {types.length > 1 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  <Chip
                    label={t('vet.all')}
                    selected={filter === 'all'}
                    onPress={() => setFilter('all')}
                  />
                  {types.map((type) => (
                    <Chip
                      key={type}
                      label={t(`vet.typesShort.${type}`)}
                      selected={filter === type}
                      onPress={() => setFilter(type)}
                    />
                  ))}
                </View>
              )}
              <History
                catId={id}
                events={visible}
                editing={editing}
                onEdit={setEditing}
                onDoneEditing={() => setEditing(null)}
              />
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}

function UpcomingRow({ event, days, status }: ReturnType<typeof upcomingDue<VetEvent>>[number]) {
  const { spacing } = useTheme();
  const fmt = useVetFormat();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyStrong" numberOfLines={2}>
          {fmt.title(event)}
        </Text>
        <DueBadge days={days} status={status} />
      </View>
      <Text tone="muted" style={{ textAlign: 'right' }}>
        {fmt.date(event.next_due_on)}
      </Text>
    </View>
  );
}

function History({
  catId,
  events,
  editing,
  onEdit,
  onDoneEditing,
}: {
  catId: string;
  events: VetEvent[];
  editing: string | null;
  onEdit: (id: string) => void;
  onDoneEditing: () => void;
}) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? events : events.slice(0, HISTORY_PREVIEW);

  return (
    <View style={{ gap: spacing.lg }}>
      {visible.map((event) =>
        editing === event.id ? (
          <VetForm key={event.id} catId={catId} event={event} onDone={onDoneEditing} />
        ) : (
          <HistoryRow key={event.id} catId={catId} event={event} onEdit={() => onEdit(event.id)} />
        ),
      )}
      {!showAll && events.length > HISTORY_PREVIEW && (
        <Button
          title={t('vet.showAll', { count: events.length })}
          variant="ghost"
          onPress={() => setShowAll(true)}
        />
      )}
    </View>
  );
}

function HistoryRow({
  catId,
  event,
  onEdit,
}: {
  catId: string;
  event: VetEvent;
  onEdit: () => void;
}) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const fmt = useVetFormat();
  const deleteEvent = useDeleteVetEvent(catId);
  const details = [
    event.clinic,
    event.next_due_on ? t('vet.nextOn', { date: fmt.date(event.next_due_on) }) : null,
  ].filter(Boolean);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('vet.editA11y', { title: fmt.title(event) })}
        onPress={onEdit}
        style={({ pressed }) => ({ flex: 1, gap: 2, opacity: pressed ? 0.6 : 1 })}
      >
        <Text variant="caption" tone="muted">
          {fmt.date(event.occurred_on)}
        </Text>
        <Text variant="bodyStrong">{fmt.title(event)}</Text>
        {details.length > 0 && (
          <Text variant="caption" tone="muted">
            {details.join(' · ')}
          </Text>
        )}
        {event.note ? (
          <Text variant="caption" tone="muted" numberOfLines={3}>
            {event.note}
          </Text>
        ) : null}
      </Pressable>
      <ConfirmDeleteButton
        label={t('vet.delete')}
        confirmLabel={t('vet.deleteConfirm')}
        onConfirm={() => deleteEvent.mutate(event.id)}
      />
    </View>
  );
}

function VetForm({
  catId,
  event,
  onDone,
}: {
  catId: string;
  event?: VetEvent;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const saveEvent = useSaveVetEvent(catId);

  const [type, setType] = useState<VetEventType>(event?.type ?? 'vaccination');
  const [title, setTitle] = useState(event?.title ?? '');
  const [date, setDate] = useState(formatDateInput(event?.occurred_on ?? todayIso()));
  // Поки наступну дату не змінювали вручну, вона йде за типом і датою запису.
  const [nextDue, setNextDue] = useState(
    event
      ? event.next_due_on
        ? formatDateInput(event.next_due_on)
        : ''
      : defaultNextDue(type, todayIso()),
  );
  const [nextDueTouched, setNextDueTouched] = useState(!!event);
  const [clinic, setClinic] = useState(event?.clinic ?? '');
  const [note, setNote] = useState(event?.note ?? '');
  const [showValidation, setShowValidation] = useState(false);

  const occurredOn = parseDateInput(date, 'deny');
  const nextDueOn = nextDue.trim() ? parseDateInput(nextDue, 'allow') : null;
  const dateError = occurredOn ? null : t('vet.dateInvalid');
  const nextDueError =
    nextDue.trim() && !nextDueOn
      ? t('vet.nextDueInvalid')
      : nextDueOn && occurredOn && nextDueOn <= occurredOn
        ? t('vet.nextDueBeforeDate')
        : null;

  function changeType(value: VetEventType) {
    setType(value);
    if (!nextDueTouched) setNextDue(defaultNextDue(value, occurredOn ?? todayIso()));
  }

  function changeDate(text: string) {
    const masked = maskBirthDateInput(text);
    setDate(masked);
    const iso = parseDateInput(masked, 'deny');
    if (iso && !nextDueTouched) setNextDue(defaultNextDue(type, iso));
  }

  function pickPreset(months: number | null) {
    setNextDueTouched(true);
    setNextDue(months === null ? '' : formatDateInput(addMonths(occurredOn ?? todayIso(), months)));
  }

  function submit() {
    setShowValidation(true);
    if (!occurredOn || nextDueError || saveEvent.isPending) return;
    saveEvent.mutate(
      {
        id: event?.id,
        input: {
          type,
          title: title.trim() || null,
          occurredOn,
          nextDueOn,
          clinic: clinic.trim() || null,
          note: note.trim() || null,
        },
      },
      { onSuccess: onDone },
    );
  }

  return (
    <Card style={{ gap: spacing.md, padding: event ? 0 : spacing.lg }}>
      <Text variant="heading">{event ? t('vet.editTitle') : t('vet.add')}</Text>
      <View style={{ gap: spacing.sm }}>
        <Text variant="label">{t('vet.type')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {VET_TYPES.map((value) => (
            <Chip
              key={value}
              label={t(`vet.types.${value}`)}
              selected={type === value}
              disabled={saveEvent.isPending}
              onPress={() => changeType(value)}
            />
          ))}
        </View>
      </View>
      <TextField
        label={t('vet.name')}
        placeholder={t(`vet.namePlaceholder.${type}`)}
        value={title}
        onChangeText={setTitle}
        maxLength={80}
        editable={!saveEvent.isPending}
      />
      <TextField
        label={t('vet.date')}
        placeholder={t('cats.form.birthDatePlaceholder')}
        value={date}
        onChangeText={changeDate}
        error={showValidation ? dateError : null}
        keyboardType="number-pad"
        maxLength={10}
        editable={!saveEvent.isPending}
      />
      <View style={{ gap: spacing.sm }}>
        <TextField
          label={t('vet.nextDue')}
          placeholder={t('cats.form.birthDatePlaceholder')}
          hint={t('vet.nextDueHint')}
          value={nextDue}
          onChangeText={(text) => {
            setNextDueTouched(true);
            setNextDue(maskBirthDateInput(text));
          }}
          error={showValidation ? nextDueError : null}
          keyboardType="number-pad"
          maxLength={10}
          editable={!saveEvent.isPending}
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {NEXT_DUE_PRESETS.map((months) => (
            <Chip
              key={months}
              label={t('vet.inMonths', { count: months })}
              accessibilityRole="button"
              disabled={saveEvent.isPending}
              onPress={() => pickPreset(months)}
            />
          ))}
          <Chip
            label={t('vet.noNextDue')}
            accessibilityRole="button"
            disabled={saveEvent.isPending}
            onPress={() => pickPreset(null)}
          />
        </View>
      </View>
      <TextField
        label={t('vet.clinic')}
        placeholder={t('vet.clinicPlaceholder')}
        value={clinic}
        onChangeText={setClinic}
        maxLength={80}
        editable={!saveEvent.isPending}
      />
      <TextField
        label={t('vet.note')}
        placeholder={t('vet.notePlaceholder')}
        value={note}
        onChangeText={setNote}
        maxLength={500}
        multiline
        editable={!saveEvent.isPending}
      />
      {saveEvent.isError && <ErrorBanner message={t('vet.saveError')} />}
      <View style={{ gap: spacing.sm }}>
        <Button
          title={saveEvent.isPending ? t('vet.saving') : t('vet.save')}
          disabled={saveEvent.isPending}
          onPress={submit}
        />
        <Button
          title={t('deleteAccount.cancel')}
          variant="ghost"
          disabled={saveEvent.isPending}
          onPress={onDone}
        />
      </View>
    </Card>
  );
}

function defaultNextDue(type: VetEventType, occurredOn: string) {
  const months = DEFAULT_INTERVAL_MONTHS[type];
  return months === null ? '' : formatDateInput(addMonths(occurredOn, months));
}
