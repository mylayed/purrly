import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { ChevronLeftIcon } from '@/components/icons';
import { useTheme } from '@/theme';

import { Text } from './text';

type ScreenHeaderProps = {
  title: string;
  backLabel: string;
  // Куди йти, якщо історії немає (наприклад, екран відкрили посиланням).
  fallbackHref?: Parameters<typeof router.replace>[0];
  right?: ReactNode;
};

export function ScreenHeader({ title, backLabel, fallbackHref = '/', right }: ScreenHeaderProps) {
  const { colors, radii, spacing } = useTheme();
  const [presses, setPresses] = useState(0);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        hitSlop={8}
        onPressIn={() => setPresses((n) => n + 1)}
        onPress={() => (router.canGoBack() ? router.back() : router.replace(fallbackHref))}
        style={({ pressed }) => ({
          width: 40,
          height: 40,
          borderRadius: radii.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed ? colors.accentSoft : colors.card,
        })}
      >
        <ChevronLeftIcon size={22} color={colors.text} strokeWidth={2.25} trigger={presses} />
      </Pressable>
      <Text variant="title" style={{ flex: 1 }} numberOfLines={1}>
        {title}
      </Text>
      {right}
    </View>
  );
}
