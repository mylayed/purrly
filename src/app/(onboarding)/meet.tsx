import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Button, Card, Screen, ScreenHeader, ShareSheet, Text, TextField } from '@/components/ui';
import {
  CHARACTER_EMOJI,
  characterOf,
  QUESTIONS,
  type CharacterType,
  type Question,
} from '@/lib/character';
import { useSessionStore } from '@/stores/session-store';
import { useTheme } from '@/theme';

const MAX_NAME_LENGTH = 50;

// Квіз «Познайомся з котом»: ім'я → 5 питань → тип характеру й картка для сторіз.
export default function MeetYourCat() {
  const { t } = useTranslation();
  const signedIn = useSessionStore((s) => s.session !== null);
  const [name, setName] = useState('');
  // -1 — крок з ім'ям, далі індекс питання; QUESTIONS.length — результат.
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const restart = () => {
    setAnswers({});
    setStep(-1);
  };

  return (
    <Screen
      scroll
      header={
        <ScreenHeader
          title={t('onboarding.title')}
          backLabel={t('cats.back')}
          fallbackHref={signedIn ? '/' : '/sign-in'}
        />
      }
    >
      {step === -1 ? (
        <NameStep name={name} onChange={setName} onNext={() => setStep(0)} />
      ) : step < QUESTIONS.length ? (
        <QuestionStep
          question={QUESTIONS[step]!}
          index={step}
          selected={answers[QUESTIONS[step]!.id]}
          onAnswer={(optionId) => {
            setAnswers((a) => ({ ...a, [QUESTIONS[step]!.id]: optionId }));
            setStep(step + 1);
          }}
          onBack={() => setStep(step - 1)}
        />
      ) : (
        <Result
          name={name.trim()}
          type={characterOf(answers)}
          signedIn={signedIn}
          onRestart={restart}
        />
      )}
    </Screen>
  );
}

function NameStep({
  name,
  onChange,
  onNext,
}: {
  name: string;
  onChange: (name: string) => void;
  onNext: () => void;
}) {
  const { t } = useTranslation();
  const { spacing } = useTheme();

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ alignItems: 'center', gap: spacing.sm }}>
        <Text style={{ fontSize: 56, lineHeight: 68 }}>🐱</Text>
        <Text variant="title" style={{ textAlign: 'center' }}>
          {t('onboarding.introTitle')}
        </Text>
        <Text tone="muted" style={{ textAlign: 'center' }}>
          {t('onboarding.introBody')}
        </Text>
      </View>
      <TextField
        label={t('onboarding.nameLabel')}
        placeholder={t('cats.form.namePlaceholder')}
        hint={t('onboarding.nameHint')}
        value={name}
        onChangeText={onChange}
        onSubmitEditing={onNext}
        maxLength={MAX_NAME_LENGTH}
      />
      <Button title={t('onboarding.start')} onPress={onNext} />
    </View>
  );
}

function QuestionStep({
  question,
  index,
  selected,
  onAnswer,
  onBack,
}: {
  question: Question;
  index: number;
  selected: string | undefined;
  onAnswer: (optionId: string) => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const { colors, radii, spacing } = useTheme();

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.sm }}>
        <Text variant="caption" tone="muted">
          {t('onboarding.progress', { current: index + 1, total: QUESTIONS.length })}
        </Text>
        {/* Смужка прогресу: лише підсилює текст над нею. */}
        <View
          aria-hidden
          style={{ height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' }}
        >
          <View
            style={{
              width: `${((index + 1) / QUESTIONS.length) * 100}%`,
              height: '100%',
              backgroundColor: colors.accent,
            }}
          />
        </View>
      </View>
      <View style={{ alignItems: 'center', gap: spacing.sm }}>
        <Text style={{ fontSize: 56, lineHeight: 68 }} aria-hidden>
          {question.emoji}
        </Text>
        <Text variant="title" style={{ textAlign: 'center' }}>
          {t(`onboarding.questions.${question.id}.title` as 'onboarding.questions.greeting.title')}
        </Text>
      </View>
      <View style={{ gap: spacing.sm }}>
        {question.options.map((option) => {
          const label = t(
            `onboarding.questions.${question.id}.${option.id}` as 'onboarding.questions.greeting.runs',
          );
          const isSelected = selected === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: isSelected }}
              onPress={() => onAnswer(option.id)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                minHeight: 64,
                padding: spacing.md,
                borderRadius: radii.lg,
                borderWidth: 2,
                borderColor: isSelected ? colors.accent : 'transparent',
                backgroundColor: pressed ? colors.accentSoft : colors.card,
              })}
            >
              <Text style={{ fontSize: 32, lineHeight: 40 }} aria-hidden>
                {option.emoji}
              </Text>
              <Text variant="bodyStrong" style={{ flex: 1 }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Button title={t('onboarding.back')} variant="ghost" onPress={onBack} />
    </View>
  );
}

function Result({
  name,
  type,
  signedIn,
  onRestart,
}: {
  name: string;
  type: CharacterType;
  signedIn: boolean;
  onRestart: () => void;
}) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const [sharing, setSharing] = useState(false);

  const typeName = t(`onboarding.types.${type}.name`);
  const description = t(`onboarding.types.${type}.description`);
  const headline = name ? t('onboarding.resultFor', { name }) : t('onboarding.result');

  const card = (
    <View style={{ alignItems: 'center', gap: spacing.md }}>
      <Text style={{ fontSize: 72, lineHeight: 88 }}>{CHARACTER_EMOJI[type]}</Text>
      <Text variant="label" tone="muted" style={{ textAlign: 'center' }}>
        {headline}
      </Text>
      <Text variant="display" tone="accent" style={{ textAlign: 'center' }}>
        {typeName}
      </Text>
      <Text style={{ textAlign: 'center' }}>{description}</Text>
    </View>
  );

  return (
    <View style={{ gap: spacing.lg }}>
      <Card style={{ paddingVertical: spacing.xl }}>{card}</Card>
      <Button title={t('share.share')} onPress={() => setSharing(true)} />
      {signedIn ? (
        <Button
          title={t('onboarding.toHome')}
          variant="secondary"
          onPress={() => router.replace('/')}
        />
      ) : (
        <Card style={{ gap: spacing.md }}>
          <Text tone="muted">{t('onboarding.signUpPitch')}</Text>
          <Button
            title={t('onboarding.signUp')}
            variant="secondary"
            onPress={() => router.replace('/sign-in')}
          />
        </Card>
      )}
      <Button title={t('onboarding.again')} variant="ghost" onPress={onRestart} />
      <ShareSheet
        visible={sharing}
        onClose={() => setSharing(false)}
        text={`${CHARACTER_EMOJI[type]} ${headline} ${typeName}. ${description}`}
      >
        {card}
      </ShareSheet>
    </View>
  );
}
