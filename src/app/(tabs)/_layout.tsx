import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { Bell, House, Images, UserCircle, type Icon } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';

import { useApplyProfilePreferences } from '@/features/profile/preferences';
import { fonts, useTheme } from '@/theme';

function tabIcon(IconComponent: Icon) {
  function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <IconComponent size={26} color={String(color)} weight={focused ? 'fill' : 'regular'} />;
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
      <Tabs.Screen name="index" options={{ title: t('tabs.home'), tabBarIcon: tabIcon(House) }} />
      <Tabs.Screen name="feed" options={{ title: t('tabs.feed'), tabBarIcon: tabIcon(Images) }} />
      <Tabs.Screen
        name="reminders"
        options={{ title: t('tabs.reminders'), tabBarIcon: tabIcon(Bell) }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: t('tabs.account'), tabBarIcon: tabIcon(UserCircle) }}
      />
    </Tabs>
  );
}
