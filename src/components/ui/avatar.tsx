import { Image } from 'expo-image';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { fonts, useTheme } from '@/theme';

import { Text } from './text';

type AvatarProps = {
  uri?: string | null;
  name?: string | null;
  size?: number;
};

function initials(name: string | null | undefined) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

// Кругла аватарка з котячими вушками — дозована «котяча деталь» з дизайн-системи.
export function Avatar({ uri, name, size = 72 }: AvatarProps) {
  const { colors } = useTheme();
  const ear = size * 0.32;

  return (
    <View style={{ width: size, height: size + ear * 0.45 }}>
      <Svg
        width={size}
        height={ear}
        viewBox="0 0 100 32"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <Path d="M10 32 L18 0 L40 26 Z" fill={colors.accent} />
        <Path d="M90 32 L82 0 L60 26 Z" fill={colors.accent} />
      </Svg>
      <View
        style={{
          position: 'absolute',
          top: ear * 0.45,
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
          backgroundColor: colors.accentSoft,
          borderWidth: 3,
          borderColor: colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {uri ? (
          <Image
            source={{ uri }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={150}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <Text
            style={{ fontFamily: fonts.extrabold, fontSize: size * 0.36, lineHeight: size * 0.44 }}
            tone="accent"
          >
            {initials(name) || '🐾'}
          </Text>
        )}
      </View>
    </View>
  );
}
