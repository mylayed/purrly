import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import { ChartLineIcon } from '@/components/icons';
import { Button, ProfileTile, StatusBanner, Text } from '@/components/ui';
import { weightChange } from '@/lib/weight';
import { useTheme } from '@/theme';

import { useWeights } from '../api';
import { useWeightFormat } from '../use-weight-format';
import { WeightSparkline } from './weight-chart';

const SPARKLINE_POINTS = 12;

// Плитка на профілі кота: поточна вага, зміна за місяць, мініграфік.
export function WeightTile({ catId }: { catId: string }) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const { data: weights, isPending } = useWeights(catId);
  const fmt = useWeightFormat();

  const open = () => router.push({ pathname: '/cat/[id]/weight', params: { id: catId } });
  const latest = weights?.[weights.length - 1];
  const change = weights
    ? weightChange(weights.map((w) => ({ measuredAt: w.measured_at, grams: w.weight_grams })))
    : null;
  const alert = change ? fmt.alert(change) : null;
  // Порожня плитка має власну кнопку, тож сама не натискається.
  const isEmpty = !isPending && !latest;

  return (
    <ProfileTile title={t('weight.title')} onPress={isEmpty ? undefined : open}>
      {isPending ? (
        <ActivityIndicator color={colors.accent} />
      ) : latest ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.lg }}>
            <View style={{ gap: 2 }}>
              <Text variant="title">{fmt.format(latest.weight_grams)}</Text>
              {change && (
                <Text variant="caption" tone="muted">
                  {fmt.change(change)}
                </Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <WeightSparkline
                points={weights!
                  .slice(-SPARKLINE_POINTS)
                  .map((w) => ({ time: Date.parse(w.measured_at), grams: w.weight_grams }))}
              />
            </View>
          </View>
          {alert && <StatusBanner tone={alert.tone} message={alert.message} />}
        </>
      ) : (
        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <ChartLineIcon size={28} color={colors.accent} strokeWidth={1.75} autoPlay />
            <Text tone="muted" style={{ flex: 1 }}>
              {t('weight.emptyBody')}
            </Text>
          </View>
          <Button title={t('weight.add')} variant="secondary" onPress={open} />
        </View>
      )}
    </ProfileTile>
  );
}
