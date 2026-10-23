import { Image } from 'expo-image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { pickImage } from '@/api/storage';
import { CameraIcon } from '@/components/icons';
import {
  Button,
  Card,
  Chip,
  ErrorBanner,
  SegmentedControl,
  Text,
  TextField,
} from '@/components/ui';
import type { Cat } from '@/features/cats/api';
import { isMissingNativeModuleError } from '@/lib/native-module';
import { useTheme } from '@/theme';

import { useAddPhoto, useSaveNote } from '../api';

const MAX_NOTE_LENGTH = 5000;
const MAX_CAPTION_LENGTH = 300;

type Mode = 'photo' | 'note';

// Новий запис у стрічку: фото з підписом або нотатка, для вибраного кота.
export function Composer({
  cats,
  defaultCatId,
  onDone,
}: {
  cats: Cat[];
  defaultCatId: string;
  // firstPhotoId — перше фото користувача: стрічка одразу покаже його AI-настрій.
  onDone: (firstPhotoId?: string) => void;
}) {
  const { t } = useTranslation();
  const { colors, radii, spacing } = useTheme();
  const addPhoto = useAddPhoto();
  const saveNote = useSaveNote();

  const [mode, setMode] = useState<Mode>('photo');
  const [catId, setCatId] = useState(defaultCatId);
  const [uri, setUri] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [pickerError, setPickerError] = useState<unknown>(null);
  const [showValidation, setShowValidation] = useState(false);
  const pending = addPhoto.isPending || saveNote.isPending;

  const validationError =
    mode === 'photo'
      ? uri
        ? null
        : t('feed.photoRequired')
      : text.trim()
        ? null
        : t('feed.noteRequired');

  async function choose() {
    setPickerError(null);
    try {
      const picked = await pickImage();
      if (picked) setUri(picked);
    } catch (error) {
      console.warn('Image picker failed', error);
      setPickerError(error);
    }
  }

  function submit() {
    setShowValidation(true);
    if (validationError || pending) return;
    if (mode === 'photo') {
      addPhoto.mutate(
        { catId, uri: uri!, caption: text.trim() || null },
        { onSuccess: ({ id, isFirst }) => onDone(isFirst ? id : undefined) },
      );
    } else {
      saveNote.mutate({ catId, body: text.trim() }, { onSuccess: () => onDone() });
    }
  }

  return (
    <Card style={{ gap: spacing.md }}>
      <SegmentedControl
        options={[
          { value: 'photo', label: t('feed.photo') },
          { value: 'note', label: t('feed.note') },
        ]}
        value={mode}
        onChange={(value) => {
          setMode(value);
          setShowValidation(false);
        }}
      />

      {cats.length > 1 && (
        <View style={{ gap: spacing.sm }}>
          <Text variant="label">{t('feed.whichCat')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {cats.map((cat) => (
              <Chip
                key={cat.id}
                label={cat.name}
                selected={cat.id === catId}
                disabled={pending}
                onPress={() => setCatId(cat.id)}
              />
            ))}
          </View>
        </View>
      )}

      {mode === 'photo' && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={uri ? t('feed.changePhoto') : t('feed.choosePhoto')}
          onPress={choose}
          disabled={pending}
          style={({ pressed }) => ({
            aspectRatio: 4 / 3,
            borderRadius: radii.md,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            backgroundColor: pressed ? colors.border : colors.accentSoft,
          })}
        >
          {uri ? (
            <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          ) : (
            <>
              <CameraIcon size={32} color={colors.accentText} strokeWidth={1.75} />
              <Text variant="label" tone="accent">
                {t('feed.choosePhoto')}
              </Text>
            </>
          )}
        </Pressable>
      )}
      {pickerError ? (
        <ErrorBanner
          message={t(
            isMissingNativeModuleError(pickerError) ? 'account.needsUpdate' : 'feed.pickerError',
          )}
        />
      ) : null}

      <TextField
        label={mode === 'photo' ? t('feed.caption') : t('feed.note')}
        placeholder={mode === 'photo' ? t('feed.captionPlaceholder') : t('feed.notePlaceholder')}
        value={text}
        onChangeText={setText}
        error={showValidation && mode === 'note' ? validationError : null}
        multiline
        maxLength={mode === 'photo' ? MAX_CAPTION_LENGTH : MAX_NOTE_LENGTH}
        editable={!pending}
      />
      {showValidation && mode === 'photo' && validationError && (
        <Text variant="caption" tone="danger">
          {validationError}
        </Text>
      )}

      {(addPhoto.isError || saveNote.isError) && <ErrorBanner message={t('feed.saveError')} />}
      <View style={{ gap: spacing.sm }}>
        <Button
          title={pending ? t('feed.saving') : t('feed.publish')}
          disabled={pending}
          onPress={submit}
        />
        <Button
          title={t('deleteAccount.cancel')}
          variant="ghost"
          disabled={pending}
          onPress={() => onDone()}
        />
      </View>
    </Card>
  );
}
