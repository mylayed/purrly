import type { ComponentRef, ReactNode, Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useTheme } from '@/theme';

import { Text } from './text';

export const STORY_CARD_WIDTH = 288;
// Пропорції сторіз Instagram / Telegram — 9:16.
export const STORY_CARD_HEIGHT = (STORY_CARD_WIDTH * 16) / 9;

// Рамка картки для сторіз: тепле тло, вміст і підпис Purrly внизу.
// ref — для знімка картки (react-native-view-shot).
export function StoryCard({
  children,
  ref,
}: {
  children: ReactNode;
  ref?: Ref<ComponentRef<typeof View>>;
}) {
  const { t } = useTranslation();
  const { colors, radii, spacing } = useTheme();

  return (
    <View
      ref={ref}
      // Без цього Android може «сплющити» вид і знімок вийде порожнім.
      collapsable={false}
      style={{
        width: STORY_CARD_WIDTH,
        height: STORY_CARD_HEIGHT,
        borderRadius: radii.lg,
        overflow: 'hidden',
        padding: spacing.xl,
        gap: spacing.lg,
        justifyContent: 'space-between',
        backgroundColor: colors.accentSoft,
      }}
    >
      <View style={{ flex: 1, justifyContent: 'center', gap: spacing.lg }}>{children}</View>
      <Text variant="label" tone="accent" style={{ textAlign: 'center' }}>
        🐾 {t('app.name')} · {t('app.tagline')}
      </Text>
    </View>
  );
}
