import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Linking, Pressable, View } from 'react-native';

import { BellIcon, PillIcon } from '@/components/icons';
import {
  AddButton,
  Button,
  Card,
  Chip,
  ConfirmDeleteButton,
  EmptyState,
  ErrorBanner,
  SegmentedControl,
  Screen,
  Text,
  TextField,
  Toggle,
} from '@/components/ui';
import { useCats, type Cat } from '@/features/cats/api';
import {
  useDeleteReminder,
  useReminders,
  useSaveReminder,
  type Reminder,
  type ReminderType,
} from '@/features/reminders/api';
import {
  getPermission,
  notificationsSupported,
  requestPermission,
} from '@/features/reminders/notifications';
import { useReminderSyncState } from '@/features/reminders/use-reminder-sync';
import { maskBirthDateInput } from '@/lib/cat-age';
import { maskTimeInput, mealDate, nowTimeInput, parseTimeInput } from '@/lib/feeding';
import { isMissingNativeModuleError } from '@/lib/native-module';
import { repeatOf, repeatRule, VET_REMINDER_HOUR, type ReminderRepeat } from '@/lib/reminders';
import { formatDateInput, parseDateInput, todayIso } from '@/lib/vet';
import { useReminderSettingsStore } from '@/stores/reminder-settings-store';
import { useTheme } from '@/theme';

// Годування й ветеринарію нагадуємо автоматично; вручну — ліки та інше.
const REMINDER_TYPES = ['medication', 'custom'] as const satisfies ReminderType[];
type FormReminderType = (typeof REMINDER_TYPES)[number];
const permissionKey = ['notification-permission'] as const;

export default function Reminders() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const { data: cats, isPending: catsPending } = useCats();
  const reminders = useReminders();
  const [editing, setEditing] = useState<string | null>(null);
  const scheduled = useReminderSyncState((s) => s.scheduled);

  const activeCats = (cats ?? []).filter((c) => !c.archived_at);
  const catNames = new Map((cats ?? []).map((c) => [c.id, c.name]));

  if (!catsPending && activeCats.length === 0) {
    return (
      <Screen>
        <Text variant="title">{t('tabs.reminders')}</Text>
        <EmptyState
          icon={<BellIcon size={22} color={colors.accent} strokeWidth={2} autoPlay />}
          title={t('reminders.emptyTitle')}
          body={t('reminders.emptyBody')}
          action={<Button title={t('cats.add')} onPress={() => router.push('/cat/new')} />}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Text variant="title">{t('tabs.reminders')}</Text>

      <PermissionCard />
      <AutoCard />

      <Card style={{ gap: spacing.md }}>
        <Text variant="heading">{t('reminders.mine')}</Text>
        {reminders.isPending ? (
          <ActivityIndicator color={colors.accent} />
        ) : reminders.isError ? (
          <ErrorBanner message={t('reminders.loadError')} />
        ) : reminders.data.length === 0 && editing !== 'new' ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <PillIcon size={28} color={colors.accent} strokeWidth={1.75} />
            <Text tone="muted" style={{ flex: 1 }}>
              {t('reminders.mineEmpty')}
            </Text>
          </View>
        ) : (
          reminders.data.map((reminder) =>
            editing === reminder.id ? (
              <ReminderForm
                key={reminder.id}
                cats={activeCats}
                reminder={reminder}
                onDone={() => setEditing(null)}
              />
            ) : (
              <ReminderRow
                key={reminder.id}
                reminder={reminder}
                catName={activeCats.length > 1 ? (catNames.get(reminder.cat_id) ?? null) : null}
                onEdit={() => setEditing(reminder.id)}
              />
            ),
          )
        )}
        {editing === 'new' ? (
          <ReminderForm cats={activeCats} onDone={() => setEditing(null)} />
        ) : (
          activeCats.length > 0 && (
            <AddButton title={t('reminders.add')} onPress={() => setEditing('new')} />
          )
        )}
      </Card>

      {notificationsSupported && scheduled !== null && (
        <Text variant="caption" tone="muted" style={{ textAlign: 'center' }}>
          {t('reminders.scheduled', { count: scheduled })}
        </Text>
      )}
    </Screen>
  );
}

// Дозвіл на сповіщення: просимо лише кнопкою, не на старті застосунку.
function PermissionCard() {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const queryClient = useQueryClient();
  const permission = useQuery({
    queryKey: permissionKey,
    queryFn: getPermission,
    enabled: notificationsSupported,
  });
  const [requestError, setRequestError] = useState<unknown>(null);

  if (!notificationsSupported) {
    return (
      <Card style={{ gap: spacing.xs }}>
        <Text tone="muted">{t('reminders.webNote')}</Text>
      </Card>
    );
  }
  if (permission.isError) {
    return (
      <ErrorBanner
        message={t(
          isMissingNativeModuleError(permission.error)
            ? 'account.needsUpdate'
            : 'reminders.permissionError',
        )}
      />
    );
  }
  if (permission.data === undefined || permission.data === 'granted') return null;

  async function enable() {
    setRequestError(null);
    try {
      queryClient.setQueryData(permissionKey, await requestPermission());
    } catch (error) {
      setRequestError(error);
    }
  }

  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ gap: spacing.xs }}>
        <Text variant="heading">{t('reminders.permissionTitle')}</Text>
        <Text tone="muted">
          {permission.data === 'denied'
            ? t('reminders.permissionDenied')
            : t('reminders.permissionBody')}
        </Text>
      </View>
      {permission.data === 'denied' ? (
        <Button
          title={t('reminders.openSettings')}
          variant="secondary"
          onPress={() => Linking.openSettings()}
        />
      ) : (
        <Button title={t('reminders.enable')} onPress={enable} />
      )}
      {requestError ? <ErrorBanner message={t('reminders.permissionError')} /> : null}
    </Card>
  );
}

function AutoCard() {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const { feeding, vet, setFeeding, setVet } = useReminderSettingsStore();

  const rows = [
    {
      title: t('reminders.autoFeeding'),
      body: t('reminders.autoFeedingBody'),
      value: feeding,
      onChange: setFeeding,
    },
    {
      title: t('reminders.autoVet'),
      body: t('reminders.autoVetBody', { hour: `${VET_REMINDER_HOUR}:00` }),
      value: vet,
      onChange: setVet,
    },
  ];

  return (
    <Card style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.xs }}>
        <Text variant="heading">{t('reminders.auto')}</Text>
        <Text variant="caption" tone="muted">
          {t('reminders.autoHint')}
        </Text>
      </View>
      {rows.map((row) => (
        <View
          key={row.title}
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyStrong">{row.title}</Text>
            <Text variant="caption" tone="muted">
              {row.body}
            </Text>
          </View>
          <Toggle accessibilityLabel={row.title} value={row.value} onValueChange={row.onChange} />
        </View>
      ))}
    </Card>
  );
}

function ReminderRow({
  reminder,
  catName,
  onEdit,
}: {
  reminder: Reminder;
  catName: string | null;
  onEdit: () => void;
}) {
  const { t, i18n } = useTranslation();
  const { spacing } = useTheme();
  const saveReminder = useSaveReminder();
  const deleteReminder = useDeleteReminder();

  const start = new Date(reminder.starts_at);
  const time = new Intl.DateTimeFormat(i18n.language, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(start);
  const repeat = repeatOf(reminder.repeat_rule);
  const when =
    repeat === 'daily'
      ? t('reminders.whenDaily', { time })
      : repeat === 'weekly'
        ? t('reminders.whenWeekly', {
            day: new Intl.DateTimeFormat(i18n.language, { weekday: 'long' }).format(start),
            time,
          })
        : new Intl.DateTimeFormat(i18n.language, {
            day: 'numeric',
            month: 'long',
            hour: 'numeric',
            minute: '2-digit',
          }).format(start);
  const meta = [t(`reminders.types.${reminder.type}`), catName, when].filter(Boolean).join(' · ');

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('reminders.editA11y', { title: reminder.title ?? '' })}
        onPress={onEdit}
        style={({ pressed }) => ({ flex: 1, gap: 2, opacity: pressed ? 0.6 : 1 })}
      >
        <Text variant="bodyStrong" tone={reminder.enabled ? 'default' : 'muted'}>
          {reminder.title}
        </Text>
        <Text variant="caption" tone="muted">
          {reminder.enabled ? meta : t('reminders.paused')}
        </Text>
      </Pressable>
      <Toggle
        accessibilityLabel={t('reminders.enabledA11y', { title: reminder.title ?? '' })}
        value={reminder.enabled}
        disabled={saveReminder.isPending}
        onValueChange={(enabled) =>
          saveReminder.mutate({
            id: reminder.id,
            input: {
              catId: reminder.cat_id,
              type: reminder.type,
              title: reminder.title ?? '',
              startsAt: reminder.starts_at,
              repeatRule: reminder.repeat_rule,
              enabled,
            },
          })
        }
      />
      <ConfirmDeleteButton
        label={t('reminders.delete')}
        confirmLabel={t('vet.deleteConfirm')}
        onConfirm={() => deleteReminder.mutate(reminder.id)}
      />
    </View>
  );
}

function ReminderForm({
  cats,
  reminder,
  onDone,
}: {
  cats: Cat[];
  reminder?: Reminder;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const saveReminder = useSaveReminder();
  const start = reminder ? new Date(reminder.starts_at) : null;

  const [catId, setCatId] = useState(reminder?.cat_id ?? cats[0]!.id);
  const [type, setType] = useState<FormReminderType>(
    reminder && reminder.type !== 'medication' ? 'custom' : 'medication',
  );
  const [title, setTitle] = useState(reminder?.title ?? '');
  const [repeat, setRepeat] = useState<ReminderRepeat>(repeatOf(reminder?.repeat_rule ?? null));
  const [date, setDate] = useState(formatDateInput(todayIso(start ?? new Date())));
  const [time, setTime] = useState(start ? nowTimeInput(start) : '09:00');
  const [showValidation, setShowValidation] = useState(false);
  const [future, setFuture] = useState(false);

  const titleError = title.trim() ? null : t('reminders.titleRequired');
  const parsedTime = parseTimeInput(time);
  const parsedDate = parseDateInput(date, 'allow');
  const timeError = parsedTime ? null : t('feeding.timeInvalid');
  const dateError = parsedDate
    ? future
      ? t('reminders.pastOnce')
      : null
    : t('vet.nextDueInvalid');

  function submit() {
    setShowValidation(true);
    if (titleError || !parsedTime || !parsedDate || saveReminder.isPending) return;
    const [y, m, d] = parsedDate.split('-').map(Number) as [number, number, number];
    const startsAt = mealDate(0, parsedTime, new Date(y, m - 1, d));
    if (repeat === 'once' && startsAt <= new Date()) {
      setFuture(true);
      return;
    }
    saveReminder.mutate(
      {
        id: reminder?.id,
        input: {
          catId,
          type,
          title: title.trim(),
          startsAt: startsAt.toISOString(),
          repeatRule: repeatRule(repeat),
          enabled: reminder?.enabled ?? true,
        },
      },
      { onSuccess: onDone },
    );
  }

  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="heading">{reminder ? t('reminders.editTitle') : t('reminders.add')}</Text>
      {cats.length > 1 && (
        <View style={{ gap: spacing.sm }}>
          <Text variant="label">{t('feed.whichCat')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {cats.map((cat) => (
              <Chip
                key={cat.id}
                label={cat.name}
                selected={cat.id === catId}
                onPress={() => setCatId(cat.id)}
              />
            ))}
          </View>
        </View>
      )}
      <View style={{ gap: spacing.sm }}>
        <Text variant="label">{t('vet.type')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {REMINDER_TYPES.map((value) => (
            <Chip
              key={value}
              label={t(`reminders.types.${value}`)}
              selected={type === value}
              onPress={() => setType(value)}
            />
          ))}
        </View>
      </View>
      <TextField
        label={t('reminders.title')}
        placeholder={t(`reminders.titlePlaceholder.${type}`)}
        value={title}
        onChangeText={setTitle}
        error={showValidation ? titleError : null}
        maxLength={100}
        editable={!saveReminder.isPending}
      />
      <View style={{ gap: spacing.xs }}>
        <Text variant="label">{t('reminders.repeat')}</Text>
        <SegmentedControl
          options={(['once', 'daily', 'weekly'] as const).map((value) => ({
            value,
            label: t(`reminders.repeats.${value}`),
          }))}
          value={repeat}
          onChange={(value) => {
            setRepeat(value);
            setFuture(false);
          }}
        />
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 3 }}>
          <TextField
            label={repeat === 'once' ? t('vet.date') : t('reminders.from')}
            placeholder={t('cats.form.birthDatePlaceholder')}
            value={date}
            onChangeText={(text) => {
              setDate(maskBirthDateInput(text));
              setFuture(false);
            }}
            error={showValidation ? dateError : null}
            keyboardType="number-pad"
            maxLength={10}
            editable={!saveReminder.isPending}
          />
        </View>
        <View style={{ flex: 2 }}>
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
            editable={!saveReminder.isPending}
          />
        </View>
      </View>
      {saveReminder.isError && <ErrorBanner message={t('reminders.saveError')} />}
      <View style={{ gap: spacing.sm }}>
        <Button
          title={saveReminder.isPending ? t('vet.saving') : t('vet.save')}
          disabled={saveReminder.isPending}
          onPress={submit}
        />
        <Button
          title={t('deleteAccount.cancel')}
          variant="ghost"
          disabled={saveReminder.isPending}
          onPress={onDone}
        />
      </View>
    </View>
  );
}
