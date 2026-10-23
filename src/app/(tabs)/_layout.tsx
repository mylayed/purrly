import { Tabs } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BellIcon,
  GalleryThumbnailsIcon,
  HomeIcon,
  UserIcon,
  type IconProps,
} from '@/components/icons';
import { useApplyProfilePreferences } from '@/features/profile/preferences';
import { fonts, useTheme } from '@/theme';

// Вміст таб-бару: вкладка (5 відступ + 28 іконка + 16 підпис + 5 відступ) і рамка 1.
// Стандартних 49 замало для Nunito: у web підпис обрізався знизу.
const LABEL_LINE_HEIGHT = 16;
const TAB_BAR_HEIGHT = 5 + 28 + LABEL_LINE_HEIGHT + 5 + 1;

// Анімація грає, коли вкладка стає активною (у web-оригіналі — на hover).
function tabIcon(IconComponent: (props: IconProps) => ReactNode) {
  function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return (
      <IconComponent
        size={24}
        color={String(color)}
        strokeWidth={focused ? 2.25 : 1.75}
        trigger={focused ? 'focused' : 'blurred'}
      />
    );
  }
  return TabIcon;
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  useApplyProfilePreferences();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentText,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: fonts.semibold,
          fontSize: 12,
          lineHeight: LABEL_LINE_HEIGHT,
        },
        // Повітря над іконками: висоту задаємо явно (вміст + відступ + безпечна зона),
        // інакше відступ стиснув би іконки й підписи.
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingTop: spacing.sm,
          height: TAB_BAR_HEIGHT + spacing.sm + insets.bottom,
        },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t('tabs.home'), tabBarIcon: tabIcon(HomeIcon) }}
      />
      <Tabs.Screen
        name="feed"
        options={{ title: t('tabs.feed'), tabBarIcon: tabIcon(GalleryThumbnailsIcon) }}
      />
      <Tabs.Screen
        name="reminders"
        options={{ title: t('tabs.reminders'), tabBarIcon: tabIcon(BellIcon) }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: t('tabs.account'), tabBarIcon: tabIcon(UserIcon) }}
      />
    </Tabs>
  );
}
