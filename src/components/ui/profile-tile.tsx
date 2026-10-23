import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { ChevronRightIcon } from '@/components/icons';
import { useTheme } from '@/theme';

import { Text } from './text';

type ProfileTileProps = {
  title: string;
  // Без onPress плитка — звичайна картка: так у ній можна тримати власну кнопку
  // (у web <button> не може містити інший <button>).
  onPress?: () => void;
  children: ReactNode;
};

// Плитка розділу на профілі кота: заголовок, стрілка й короткий підсумок.
export function ProfileTile({ title, onPress, children }: ProfileTileProps) {
  const { colors, radii, spacing } = useTheme();
  const [presses, setPresses] = useState(0);

  const card = { gap: spacing.md, padding: spacing.lg, borderRadius: radii.lg };
  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text variant="heading" style={{ flex: 1 }}>
        {title}
      </Text>
      {onPress && <ChevronRightIcon size={20} color={colors.textMuted} trigger={presses} />}
    </View>
  );

  if (!onPress) {
    return (
      <View style={{ ...card, backgroundColor: colors.card }}>
        {header}
        {children}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPressIn={() => setPresses((n) => n + 1)}
      onPress={onPress}
      style={({ pressed }) => ({
        ...card,
        backgroundColor: pressed ? colors.accentSoft : colors.card,
      })}
    >
      {header}
      {children}
    </Pressable>
  );
}
