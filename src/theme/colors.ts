// Палітра «затишний і теплий» — див. PLAN.md, розділ 3.
export type ColorScheme = 'light' | 'dark';

export type ThemeColors = {
  bg: string;
  card: string;
  border: string;
  accent: string;
  accentPressed: string;
  accentSoft: string;
  accentText: string;
  onAccent: string;
  secondary: string;
  secondaryBg: string;
  secondaryText: string;
  text: string;
  textMuted: string;
  warning: string;
  warningBg: string;
  warningText: string;
  danger: string;
  dangerBg: string;
  dangerText: string;
  // Лінія графіка: перевірено валідатором dataviz (контраст ≥ 3:1 до картки, діапазон світлоти).
  chartLine: string;
};

export const colors: Record<ColorScheme, ThemeColors> = {
  light: {
    bg: '#FBF7F2',
    card: '#FFFFFF',
    border: '#EFE6DC',
    accent: '#E8875B',
    accentPressed: '#D9764A',
    accentSoft: '#FBE4D7',
    // Персиковий текст на світлому фоні має контраст лише 2.6:1, тому темніший відтінок.
    accentText: '#B4532A',
    // Білий на персиковому замало контрастний, тому темний текст.
    onAccent: '#2A1408',
    secondary: '#7FB59A',
    secondaryBg: '#DCEFE4',
    secondaryText: '#2F6B4F',
    text: '#2B2522',
    textMuted: '#6F655E',
    warning: '#E9B949',
    warningBg: '#FBF0D2',
    warningText: '#7A5A0C',
    danger: '#C9625B',
    dangerBg: '#F8E0DD',
    dangerText: '#8C2F28',
    chartLine: '#B4532A',
  },
  dark: {
    bg: '#17151A',
    card: '#252129',
    border: '#332D38',
    accent: '#F09A6E',
    accentPressed: '#E0885C',
    accentSoft: '#3B2A25',
    accentText: '#F09A6E',
    onAccent: '#2A1408',
    secondary: '#8CC7A9',
    secondaryBg: '#1F3A2E',
    secondaryText: '#A8DDBF',
    text: '#F3EEE8',
    textMuted: '#A69EAB',
    warning: '#E9C46A',
    warningBg: '#3A3220',
    warningText: '#F2D98C',
    danger: '#E27D74',
    dangerBg: '#3F2423',
    dangerText: '#F4B2AB',
    chartLine: '#D27245',
  },
};
