import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { CheckIcon } from '@/components/icons';
import { BlinkingCat, Button, Card, Screen, ScreenHeader, Text } from '@/components/ui';
import { purchasesAvailable, useIsPlus, type PaywallReason } from '@/features/subscription/api';
import {
  currencyFor,
  PLAN_ORDER,
  planPrice,
  TRIAL_DAYS,
  yearlySavingsPercent,
  type PlanId,
} from '@/lib/plans';
import { useTheme } from '@/theme';

const BENEFITS = ['unlimitedCats', 'unlimitedAi', 'support'] as const;

// Purrly Plus. Відкривається лише за дією, якій потрібен Plus (другий кіт, AI-ліміт),
// або з кабінету — ніколи на першому екрані.
export default function Paywall() {
  const { t, i18n } = useTranslation();
  const { colors, radii, spacing } = useTheme();
  const { reason } = useLocalSearchParams<{ reason?: PaywallReason }>();
  const { isPlus } = useIsPlus();
  const [plan, setPlan] = useState<PlanId>('yearly');

  const currency = currencyFor(i18n.language);
  const price = (id: PlanId) =>
    new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'UAH' ? 0 : 2,
    }).format(planPrice(id, currency));
  const savings = yearlySavingsPercent(currency);
  const headline =
    reason === 'cats'
      ? t('paywall.reasons.cats')
      : reason === 'ai'
        ? t('paywall.reasons.ai')
        : t('paywall.title');

  return (
    <Screen scroll header={<ScreenHeader title="" backLabel={t('paywall.close')} />}>
      <View style={{ alignItems: 'center', gap: spacing.sm }}>
        <BlinkingCat size={96} />
        <Text variant="title" style={{ textAlign: 'center' }}>
          {headline}
        </Text>
        <Text tone="muted" style={{ textAlign: 'center' }}>
          {t('paywall.subtitle')}
        </Text>
      </View>

      {isPlus ? (
        <Card style={{ gap: spacing.xs, backgroundColor: colors.secondaryBg }}>
          <Text variant="bodyStrong" tone="secondary">
            {t('paywall.alreadyPlus')}
          </Text>
        </Card>
      ) : null}

      <Card style={{ gap: spacing.md }}>
        {BENEFITS.map((benefit) => (
          <View
            key={benefit}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
          >
            <CheckIcon size={20} color={colors.secondaryText} strokeWidth={2.5} />
            <Text style={{ flex: 1 }}>{t(`paywall.benefits.${benefit}`)}</Text>
          </View>
        ))}
        <Text variant="caption" tone="muted">
          {t('paywall.freeForever')}
        </Text>
      </Card>

      <View accessibilityRole="radiogroup" style={{ gap: spacing.sm }}>
        {PLAN_ORDER.map((id) => {
          const selected = id === plan;
          return (
            <Pressable
              key={id}
              accessibilityRole="radio"
              accessibilityLabel={`${t(`paywall.plans.${id}`)}, ${price(id)}`}
              accessibilityState={{ checked: selected }}
              onPress={() => setPlan(id)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                padding: spacing.lg,
                borderRadius: radii.lg,
                borderWidth: 2,
                borderColor: selected ? colors.accent : colors.border,
                backgroundColor: pressed ? colors.accentSoft : colors.card,
              })}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Text variant="bodyStrong">{t(`paywall.plans.${id}`)}</Text>
                  {id === 'yearly' && savings > 0 && (
                    <View
                      style={{
                        paddingHorizontal: spacing.sm,
                        paddingVertical: 2,
                        borderRadius: radii.pill,
                        backgroundColor: colors.accent,
                      }}
                    >
                      <Text variant="caption" tone="onAccent">
                        −{savings}%
                      </Text>
                    </View>
                  )}
                </View>
                <Text variant="caption" tone="muted">
                  {id === 'yearly'
                    ? t('paywall.trial', { count: TRIAL_DAYS })
                    : t(`paywall.planNotes.${id}`)}
                </Text>
              </View>
              <Text variant="bodyStrong" style={{ fontVariant: ['tabular-nums'] }}>
                {price(id)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {purchasesAvailable ? (
        <Button
          title={
            plan === 'yearly'
              ? t('paywall.startTrial', { count: TRIAL_DAYS })
              : t('paywall.subscribe')
          }
          onPress={() => {}}
        />
      ) : (
        <Card style={{ gap: spacing.xs, backgroundColor: colors.warningBg }}>
          <Text tone="warning">{t('paywall.comingSoon')}</Text>
        </Card>
      )}
      <Text variant="caption" tone="muted" style={{ textAlign: 'center' }}>
        {t('paywall.priceNote')}
      </Text>
    </Screen>
  );
}
