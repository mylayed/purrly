import type { TextStyle } from 'react-native';

import { fonts } from './fonts';

// Крок 4 px.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

// Картки 16–20 px, кнопки-пілюлі.
export const radii = {
  sm: 10,
  md: 16,
  lg: 20,
  pill: 999,
} as const;

export const typography = {
  display: { fontFamily: fonts.extrabold, fontSize: 32, lineHeight: 40 },
  title: { fontFamily: fonts.extrabold, fontSize: 24, lineHeight: 32 },
  heading: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 24 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 20 },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
