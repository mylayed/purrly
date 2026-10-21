import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Card, Screen, SegmentedControl, Text } from '@/components/ui';
import { languageNames, supportedLanguages } from '@/i18n';
import { useLanguageStore, type LanguagePreference } from '@/stores/language-store';
import type { ThemePreference } from '@/stores/theme-store';
import { useTheme } from '@/theme';

// Тимчасовий екран-вітрина дизайн-системи.
const themePreferences: ThemePreference[] = ['system', 'light', 'dark'];

export default function Index() {
  const { t } = useTranslation();
  const { colors, radii, spacing, preference, setPreference } = useTheme();
  const language = useLanguageStore((s) => s.preference);
  const setLanguage = useLanguageStore((s) => s.setPreference);

  const themeOptions = themePreferences.map((value) => ({
    value,
    label: t(`settings.theme.${value}`),
  }));
  const languageOptions: { value: LanguagePreference; label: string }[] = [
    { value: 'system', label: t('settings.language.system') },
    ...supportedLanguages.map((value) => ({ value, label: languageNames[value] })),
  ];

  const statuses = [
    { bg: 'secondaryBg', tone: 'secondary', label: t('showcase.vaccinated') },
    { bg: 'warningBg', tone: 'warning', label: t('showcase.dewormingSoon', { count: 3 }) },
    { bg: 'dangerBg', tone: 'danger', label: t('showcase.weightDropped', { percent: 10 }) },
  ] as const;

  return (
    <Screen scroll>
      <Text variant="display">{t('app.name')}</Text>
      <Text tone="muted">{t('app.tagline')}</Text>

      <Card style={{ gap: spacing.md }}>
        <Text variant="heading">{t('settings.theme.title')}</Text>
        <SegmentedControl options={themeOptions} value={preference} onChange={setPreference} />
      </Card>

      <Card style={{ gap: spacing.md }}>
        <Text variant="heading">{t('settings.language.title')}</Text>
        <SegmentedControl options={languageOptions} value={language} onChange={setLanguage} />
      </Card>

      <Card style={{ gap: spacing.md }}>
        <Text variant="heading">{t('showcase.buttons')}</Text>
        <Button title={t('showcase.addCat')} />
        <Button title={t('showcase.logWeight')} variant="secondary" />
        <Button title={t('showcase.later')} variant="ghost" />
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <Text variant="heading">{t('showcase.statuses')}</Text>
        {statuses.map(({ bg, tone, label }) => (
          <View
            key={bg}
            style={{ backgroundColor: colors[bg], borderRadius: radii.md, padding: spacing.md }}
          >
            <Text variant="bodyStrong" tone={tone}>
              {label}
            </Text>
          </View>
        ))}
      </Card>
    </Screen>
  );
}
