import { Pressable, type PressableProps } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Text } from '@/components/ui';
import { fonts, useTheme } from '@/theme';

// Кольори з правил оформлення Google Sign-In: кнопка має бути нейтральною,
// а не в кольорах застосунку. https://developers.google.com/identity/branding-guidelines
const googleButtonColors = {
  light: { bg: '#FFFFFF', pressed: '#F2F2F2', border: '#747775', text: '#1F1F1F' },
  dark: { bg: '#131314', pressed: '#202124', border: '#8E918F', text: '#E3E3E3' },
} as const;

function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <Path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <Path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <Path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </Svg>
  );
}

type GoogleSignInButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
};

export function GoogleSignInButton({ title, disabled, ...rest }: GoogleSignInButtonProps) {
  const { scheme, radii, spacing } = useTheme();
  const c = googleButtonColors[scheme];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      style={({ pressed }) => ({
        minHeight: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: c.border,
        backgroundColor: pressed ? c.pressed : c.bg,
        opacity: disabled ? 0.5 : 1,
      })}
      {...rest}
    >
      <GoogleLogo />
      <Text variant="label" style={{ color: c.text, fontFamily: fonts.semibold }}>
        {title}
      </Text>
    </Pressable>
  );
}
