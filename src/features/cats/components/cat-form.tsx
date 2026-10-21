import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { pickSquareImage } from '@/api/storage';
import { Avatar, Button, ErrorBanner, SegmentedControl, Text, TextField } from '@/components/ui';
import { formatBirthDate, maskBirthDateInput, parseBirthDate } from '@/lib/cat-age';
import { isMissingNativeModuleError } from '@/lib/native-module';
import { useTheme } from '@/theme';

import { MAX_CAT_NAME_LENGTH, useCatPhotoUrl, type Cat, type CatInput, type CatSex } from '../api';

type Sterilized = 'yes' | 'no' | 'unknown';
const CHIP_PATTERN = /^[0-9A-Za-z]{1,20}$/;

function toSterilized(value: boolean | null | undefined): Sterilized {
  return value === true ? 'yes' : value === false ? 'no' : 'unknown';
}

type CatFormProps = {
  cat?: Cat;
  submitLabel: string;
  pending: boolean;
  error: unknown;
  onSubmit: (input: CatInput, photoUri: string | null) => void;
};

export function CatForm({ cat, submitLabel, pending, error, onSubmit }: CatFormProps) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const { data: currentPhotoUrl } = useCatPhotoUrl(cat?.photo_path);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [pickerError, setPickerError] = useState<unknown>(null);
  const [name, setName] = useState(cat?.name ?? '');
  const [sex, setSex] = useState<CatSex>(cat?.sex ?? 'unknown');
  const [birthDate, setBirthDate] = useState(
    cat?.birth_date ? formatBirthDate(cat.birth_date) : '',
  );
  const [breed, setBreed] = useState(cat?.breed ?? '');
  const [sterilized, setSterilized] = useState<Sterilized>(toSterilized(cat?.sterilized));
  const [chip, setChip] = useState(cat?.chip_number ?? '');
  const [showValidation, setShowValidation] = useState(false);

  const trimmedName = name.trim();
  const nameError = !trimmedName
    ? t('cats.form.nameRequired')
    : trimmedName.length > MAX_CAT_NAME_LENGTH
      ? t('cats.form.nameTooLong', { count: MAX_CAT_NAME_LENGTH })
      : null;
  const birthIso = birthDate.trim() ? parseBirthDate(birthDate) : null;
  const birthError = birthDate.trim() && !birthIso ? t('cats.form.birthDateInvalid') : null;
  const chipValue = chip.replace(/\s/g, '');
  const chipError = chipValue && !CHIP_PATTERN.test(chipValue) ? t('cats.form.chipInvalid') : null;

  async function pickPhoto() {
    setPickerError(null);
    try {
      const uri = await pickSquareImage();
      if (uri) setPhotoUri(uri);
    } catch (e) {
      console.warn('Image picker failed', e);
      setPickerError(e);
    }
  }

  function submit() {
    setShowValidation(true);
    if (nameError || birthError || chipError || pending) return;
    onSubmit(
      {
        name: trimmedName,
        sex,
        birth_date: birthIso,
        breed: breed.trim() || null,
        sterilized: sterilized === 'unknown' ? null : sterilized === 'yes',
        chip_number: chipValue || null,
      },
      photoUri,
    );
  }

  const yesNoUnknown = [
    { value: 'yes' as const, label: t('cats.form.yes') },
    { value: 'no' as const, label: t('cats.form.no') },
    { value: 'unknown' as const, label: t('cats.form.unknown') },
  ];

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ alignItems: 'center', gap: spacing.sm }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            currentPhotoUrl || photoUri ? t('cats.form.changePhoto') : t('cats.form.addPhoto')
          }
          onPress={pickPhoto}
          disabled={pending}
        >
          <Avatar uri={photoUri ?? currentPhotoUrl} name={trimmedName} size={96} />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={pickPhoto} disabled={pending} hitSlop={8}>
          <Text variant="label" tone="accent">
            {currentPhotoUrl || photoUri ? t('cats.form.changePhoto') : t('cats.form.addPhoto')}
          </Text>
        </Pressable>
        {pickerError ? (
          <ErrorBanner
            message={t(
              isMissingNativeModuleError(pickerError)
                ? 'account.needsUpdate'
                : 'account.photoError',
            )}
          />
        ) : null}
      </View>

      <TextField
        label={t('cats.form.name')}
        placeholder={t('cats.form.namePlaceholder')}
        value={name}
        onChangeText={setName}
        error={showValidation ? nameError : null}
        autoCapitalize="words"
        maxLength={MAX_CAT_NAME_LENGTH + 10}
        editable={!pending}
      />

      <View style={{ gap: spacing.sm }}>
        <Text variant="label">{t('cats.form.sex')}</Text>
        <SegmentedControl
          options={[
            { value: 'female', label: t('cats.form.sexFemale') },
            { value: 'male', label: t('cats.form.sexMale') },
            { value: 'unknown', label: t('cats.form.sexUnknown') },
          ]}
          value={sex}
          onChange={setSex}
        />
      </View>

      <TextField
        label={t('cats.form.birthDate')}
        placeholder={t('cats.form.birthDatePlaceholder')}
        value={birthDate}
        onChangeText={(text) => setBirthDate(maskBirthDateInput(text))}
        error={birthError}
        hint={t('cats.form.birthDateHint')}
        keyboardType="number-pad"
        maxLength={10}
        editable={!pending}
      />

      <TextField
        label={t('cats.form.breed')}
        placeholder={t('cats.form.breedPlaceholder')}
        value={breed}
        onChangeText={setBreed}
        autoCapitalize="sentences"
        maxLength={60}
        editable={!pending}
      />

      <View style={{ gap: spacing.sm }}>
        <Text variant="label">{t('cats.form.sterilized')}</Text>
        <SegmentedControl options={yesNoUnknown} value={sterilized} onChange={setSterilized} />
      </View>

      <TextField
        label={t('cats.form.chip')}
        placeholder={t('cats.form.chipPlaceholder')}
        value={chip}
        onChangeText={setChip}
        error={chipError}
        autoCapitalize="characters"
        autoCorrect={false}
        keyboardType="default"
        maxLength={24}
        editable={!pending}
      />

      {error ? (
        <ErrorBanner
          message={t(
            isMissingNativeModuleError(error) ? 'account.needsUpdate' : 'cats.form.saveError',
          )}
        />
      ) : null}

      <Button
        title={pending ? t('cats.form.saving') : submitLabel}
        disabled={pending}
        onPress={submit}
      />
    </View>
  );
}
