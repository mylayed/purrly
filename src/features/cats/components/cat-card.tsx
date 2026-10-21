import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { ChevronRightIcon } from '@/components/icons';
import { Avatar, Text } from '@/components/ui';
import { useTheme } from '@/theme';

import { useCatPhotoUrl, type Cat } from '../api';
import { useFormatCatAge } from '../use-cat-age';

export function CatCard({ cat }: { cat: Cat }) {
  const { colors, radii, spacing } = useTheme();
  const { data: photoUrl } = useCatPhotoUrl(cat.photo_path);
  const age = useFormatCatAge()(cat.birth_date);
  const [presses, setPresses] = useState(0);
  const subtitle = [age?.text, cat.breed].filter(Boolean).join(' · ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={cat.name}
      onPressIn={() => setPresses((n) => n + 1)}
      onPress={() => router.push({ pathname: '/cat/[id]', params: { id: cat.id } })}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,
        padding: spacing.lg,
        borderRadius: radii.lg,
        backgroundColor: pressed ? colors.accentSoft : colors.card,
        opacity: cat.archived_at ? 0.7 : 1,
      })}
    >
      <Avatar uri={photoUrl} name={cat.name} size={56} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="heading" numberOfLines={1}>
          {cat.name}
        </Text>
        {subtitle ? (
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <ChevronRightIcon size={20} color={colors.textMuted} trigger={presses} />
    </Pressable>
  );
}
