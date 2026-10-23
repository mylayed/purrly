import { useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { isMissingNativeModuleError } from '@/lib/native-module';
import { shareCardImage, type ShareOutcome } from '@/lib/share-image';
import { useTheme } from '@/theme';

import { Button } from './button';
import { ErrorBanner } from './error-banner';
import { STORY_CARD_WIDTH, StoryCard } from './story-card';
import { Text } from './text';

type ShareSheetProps = {
  visible: boolean;
  onClose: () => void;
  // Текст поруч із картинкою (у web — замість неї).
  text: string;
  children: ReactNode;
};

// Попередній перегляд картки для сторіз і кнопка «Поділитися».
export function ShareSheet({ visible, onClose, text, children }: ShareSheetProps) {
  const { t } = useTranslation();
  const { colors, radii, spacing } = useTheme();
  const cardRef = useRef<ComponentRef<typeof View>>(null);
  const [pending, setPending] = useState(false);
  const [outcome, setOutcome] = useState<ShareOutcome | null>(null);
  const [error, setError] = useState<unknown>(null);

  async function share() {
    if (!cardRef.current || pending) return;
    setPending(true);
    setError(null);
    try {
      setOutcome(await shareCardImage(cardRef.current, text));
    } catch (e) {
      // Користувач закрив системне вікно — це не помилка.
      if (!(e instanceof Error && e.name === 'AbortError')) {
        console.warn('Share failed', e);
        setError(e);
      }
    } finally {
      setPending(false);
    }
  }

  function close() {
    setOutcome(null);
    setError(null);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <ScrollView
        style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.lg,
        }}
      >
        {/* Тло закриває вікно. Це окремий шар позаду, а не обгортка:
            у web кнопка не може містити інші кнопки. Читачі екрана мають «Закрити» нижче. */}
        <Pressable
          aria-hidden
          tabIndex={-1}
          onPress={close}
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        />
        <View
          style={{
            alignItems: 'center',
            gap: spacing.lg,
            padding: spacing.lg,
            borderRadius: radii.lg,
            backgroundColor: colors.card,
          }}
        >
          <StoryCard ref={cardRef}>{children}</StoryCard>
          <View style={{ alignSelf: 'stretch', gap: spacing.sm }}>
            {outcome === 'copied' && (
              <Text tone="secondary" style={{ textAlign: 'center' }}>
                {t('share.copied')}
              </Text>
            )}
            {outcome === 'manual' && (
              <View style={{ gap: spacing.xs, maxWidth: STORY_CARD_WIDTH }}>
                <Text variant="caption" tone="muted">
                  {t('share.copyManually')}
                </Text>
                <Text selectable>{text}</Text>
              </View>
            )}
            {error ? (
              <ErrorBanner
                message={t(
                  isMissingNativeModuleError(error) ? 'account.needsUpdate' : 'share.error',
                )}
              />
            ) : null}
            <Button
              title={pending ? t('share.preparing') : t('share.share')}
              disabled={pending}
              onPress={share}
            />
            <Button title={t('share.close')} variant="ghost" onPress={close} />
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
}
