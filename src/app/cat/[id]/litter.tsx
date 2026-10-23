import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import {
  Button,
  Card,
  ConfirmDeleteButton,
  ErrorBanner,
  Screen,
  ScreenHeader,
  Text,
} from '@/components/ui';
import { useCat } from '@/features/cats/api';
import { useDeleteLitter, useLitterEvents, type LitterEvent } from '@/features/litter/api';
import { LitterButtons } from '@/features/litter/components/litter-buttons';
import { useLitterFormat } from '@/features/litter/use-litter-format';
import { lastOf, LITTER_DAYS, litterDays } from '@/lib/litter';
import { localDayKey } from '@/lib/feeding';
import { useTheme } from '@/theme';

export default function CatLitter() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: cat } = useCat(id);
  const { data: events, isPending, isError, refetch } = useLitterEvents(id);
  const fmt = useLitterFormat();

  const title = cat ? `${t('litter.title')} · ${cat.name}` : t('litter.title');
  const days = litterDays(events ?? []);
  const lastPee = lastOf(events ?? [], 'pee');
  const lastPoop = lastOf(events ?? [], 'poop');
  const todayKey = localDayKey(new Date());
  const todayEvents = (events ?? []).filter(
    (e) => localDayKey(new Date(e.occurred_at)) === todayKey,
  );

  return (
    <Screen scroll header={<ScreenHeader title={title} backLabel={t('cats.back')} />}>
      {isPending ? (
        <ActivityIndicator color={colors.accent} />
      ) : isError ? (
        <>
          <ErrorBanner message={t('litter.loadError')} />
          <Button title={t('cats.retry')} variant="secondary" onPress={() => refetch()} />
        </>
      ) : (
        <>
          <Card style={{ gap: spacing.md }}>
            <Text tone="muted">{t('litter.hint')}</Text>
            <LitterButtons catId={id} />
          </Card>

          <Card style={{ gap: spacing.sm }}>
            <Text variant="heading">{t('litter.last')}</Text>
            <Row
              label={t('litter.kinds.pee')}
              value={lastPee ? fmt.ago(lastPee.occurred_at) : t('litter.never')}
            />
            <Row
              label={t('litter.kinds.poop')}
              value={lastPoop ? fmt.ago(lastPoop.occurred_at) : t('litter.never')}
            />
          </Card>

          {/* Таблиця, а не графік: кілька чисел на день легше прочитати рядком. */}
          <Card style={{ gap: spacing.sm }}>
            <Text variant="heading">{t('litter.week', { count: LITTER_DAYS })}</Text>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <Text variant="caption" tone="muted" style={{ flex: 1 }}>
                {t('litter.day')}
              </Text>
              <Text variant="caption" tone="muted" style={{ width: 64, textAlign: 'right' }}>
                {t('litter.kinds.pee')}
              </Text>
              <Text variant="caption" tone="muted" style={{ width: 64, textAlign: 'right' }}>
                {t('litter.kinds.poop')}
              </Text>
            </View>
            {days.map((day) => (
              <View
                key={day.dayKey}
                accessible
                accessibilityLabel={t('litter.dayA11y', {
                  day: fmt.dayLabel(day.dayKey),
                  pee: day.pee,
                  poop: day.poop,
                })}
                style={{ flexDirection: 'row', gap: spacing.md }}
              >
                <Text style={{ flex: 1 }}>{fmt.dayLabel(day.dayKey)}</Text>
                <Count value={day.pee} />
                <Count value={day.poop} />
              </View>
            ))}
          </Card>

          {todayEvents.length > 0 && (
            <Card style={{ gap: spacing.md }}>
              <Text variant="heading">{t('litter.todayMarks')}</Text>
              {todayEvents.map((event) => (
                <MarkRow key={event.id} catId={id} event={event} />
              ))}
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.md }}>
      <Text tone="muted" style={{ flex: 1 }}>
        {label}
      </Text>
      <Text>{value}</Text>
    </View>
  );
}

function Count({ value }: { value: number }) {
  return (
    <Text
      tone={value === 0 ? 'muted' : 'default'}
      style={{ width: 64, textAlign: 'right', fontVariant: ['tabular-nums'] }}
    >
      {value === 0 ? '—' : value}
    </Text>
  );
}

function MarkRow({ catId, event }: { catId: string; event: LitterEvent }) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const fmt = useLitterFormat();
  const deleteLitter = useDeleteLitter(catId);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <Text tone="muted" style={{ width: 64, fontVariant: ['tabular-nums'] }}>
        {fmt.clock(event.occurred_at)}
      </Text>
      <Text style={{ flex: 1 }}>{t(`litter.kinds.${event.kind}`)}</Text>
      <ConfirmDeleteButton
        label={t('litter.delete')}
        confirmLabel={t('vet.deleteConfirm')}
        onConfirm={() => deleteLitter.mutate(event.id)}
      />
    </View>
  );
}
