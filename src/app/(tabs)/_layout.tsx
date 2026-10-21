import { Tabs } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColorValue } from 'react-native';

import {
  BellIcon,
  GalleryThumbnailsIcon,
  HomeIcon,
  UserIcon,
  type IconProps,
} from '@/components/icons';
import { useApplyProfilePreferences } from '@/features/profile/preferences';
import { fonts, useTheme } from '@/theme';

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
  const { colors } = useTheme();
  useApplyProfilePreferences();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentText,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 12 },
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
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
