import { Image } from 'expo-image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Button, Card, ConfirmDeleteButton, ErrorBanner, Text, TextField } from '@/components/ui';
import { useTheme } from '@/theme';

import { useDeleteFeedItem, useSaveNote, type FeedItem } from '../api';

// Картка стрічки: фото з підписом або нотатка. Ім'я кота — коли в стрічці кілька котів.
export function FeedCard({ item, catName }: { item: FeedItem; catName: string | null }) {
  const { t, i18n } = useTranslation();
  const { colors, radii, spacing } = useTheme();
  const deleteItem = useDeleteFeedItem();
  const [editing, setEditing] = useState(false);

  const time = new Intl.DateTimeFormat(i18n.language, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(item.at));
  const meta = [catName, time].filter(Boolean).join(' · ');

  return (
    <Card style={{ gap: spacing.md }}>
      {item.kind === 'photo' && (
        <View
          style={{
            aspectRatio: 4 / 3,
            marginHorizontal: -spacing.lg,
            marginTop: -spacing.lg,
            borderTopLeftRadius: radii.lg,
            borderTopRightRadius: radii.lg,
            overflow: 'hidden',
            backgroundColor: colors.accentSoft,
          }}
        >
          {item.url && (
            <Image
              // Кеш за шляхом, а не за підписаним посиланням, яке змінюється щогодини.
              source={{ uri: item.url, cacheKey: item.photo.storage_path }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              transition={150}
              accessibilityLabel={item.photo.caption ?? t('feed.photoA11y', { cat: catName ?? '' })}
            />
          )}
        </View>
      )}

      {item.kind === 'note' && editing ? (
        <EditNote item={item} onDone={() => setEditing(false)} />
      ) : (
        <>
          {item.kind === 'photo' && item.photo.caption ? <Text>{item.photo.caption}</Text> : null}
          {item.kind === 'note' && (
            <Pressable
              accessibilityRole="button"
              accessibilityHint={t('feed.editHint')}
              onPress={() => setEditing(true)}
            >
              <Text selectable>{item.note.body}</Text>
            </Pressable>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Text variant="caption" tone="muted" style={{ flex: 1 }}>
              {meta}
            </Text>
            <ConfirmDeleteButton
              label={item.kind === 'photo' ? t('feed.deletePhoto') : t('feed.deleteNote')}
              confirmLabel={t('vet.deleteConfirm')}
              onConfirm={() => deleteItem.mutate(item)}
            />
          </View>
          {deleteItem.isError && <ErrorBanner message={t('feed.deleteError')} />}
        </>
      )}
    </Card>
  );
}

function EditNote({
  item,
  onDone,
}: {
  item: Extract<FeedItem, { kind: 'note' }>;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const saveNote = useSaveNote();
  const [body, setBody] = useState(item.note.body);

  return (
    <View style={{ gap: spacing.sm }}>
      <TextField
        label={t('feed.note')}
        value={body}
        onChangeText={setBody}
        multiline
        maxLength={5000}
        autoFocus
        editable={!saveNote.isPending}
      />
      {saveNote.isError && <ErrorBanner message={t('feed.saveError')} />}
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Button
          title={saveNote.isPending ? t('feed.saving') : t('feed.save')}
          disabled={!body.trim() || saveNote.isPending}
          onPress={() =>
            saveNote.mutate(
              { id: item.id, catId: item.catId, body: body.trim() },
              { onSuccess: onDone },
            )
          }
          style={{ flex: 1 }}
        />
        <Button
          title={t('deleteAccount.cancel')}
          variant="ghost"
          disabled={saveNote.isPending}
          onPress={onDone}
        />
      </View>
    </View>
  );
}
