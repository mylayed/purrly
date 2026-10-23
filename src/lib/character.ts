// Квіз «Познайомся з котом»: 5 питань → тип характеру. Тексти — у перекладах
// (onboarding.questions.<id>), тут лише структура й бали.

export const CHARACTER_TYPES = [
  'royal',
  'cuddler',
  'explorer',
  'hunter',
  'philosopher',
  'chaos',
] as const;
export type CharacterType = (typeof CHARACTER_TYPES)[number];

export const CHARACTER_EMOJI: Record<CharacterType, string> = {
  royal: '👑',
  cuddler: '🤗',
  explorer: '🧭',
  hunter: '🐾',
  philosopher: '🧐',
  chaos: '🌪️',
};

type Option = { id: string; emoji: string; points: Partial<Record<CharacterType, number>> };
export type Question = { id: string; emoji: string; options: Option[] };

export const QUESTIONS: Question[] = [
  {
    id: 'greeting',
    emoji: '🚪',
    options: [
      { id: 'runs', emoji: '🏃', points: { cuddler: 2 } },
      { id: 'sofa', emoji: '🛋️', points: { royal: 2 } },
      { id: 'ambush', emoji: '🫣', points: { hunter: 2, chaos: 1 } },
      { id: 'bags', emoji: '🛍️', points: { explorer: 2 } },
    ],
  },
  {
    id: 'spot',
    emoji: '🏠',
    options: [
      { id: 'top', emoji: '🗄️', points: { royal: 1, explorer: 1 } },
      { id: 'lap', emoji: '🫶', points: { cuddler: 2 } },
      { id: 'box', emoji: '📦', points: { philosopher: 2 } },
      { id: 'everywhere', emoji: '🔀', points: { chaos: 2 } },
    ],
  },
  {
    id: 'night',
    emoji: '🌙',
    options: [
      { id: 'zoomies', emoji: '💨', points: { chaos: 2 } },
      { id: 'hunts', emoji: '🦟', points: { hunter: 2 } },
      { id: 'stares', emoji: '👁️', points: { philosopher: 2 } },
      { id: 'face', emoji: '😴', points: { cuddler: 1, royal: 1 } },
    ],
  },
  {
    id: 'newThing',
    emoji: '🎁',
    options: [
      { id: 'inspects', emoji: '🔍', points: { explorer: 2 } },
      { id: 'pushes', emoji: '👇', points: { chaos: 2 } },
      { id: 'ignores', emoji: '🙄', points: { royal: 2 } },
      { id: 'watches', emoji: '⏳', points: { philosopher: 1, hunter: 1 } },
    ],
  },
  {
    id: 'toy',
    emoji: '🧶',
    options: [
      { id: 'mouse', emoji: '🐭', points: { hunter: 2 } },
      { id: 'boxOfToy', emoji: '📦', points: { philosopher: 1, explorer: 1 } },
      { id: 'hands', emoji: '✋', points: { chaos: 1, cuddler: 1 } },
      { id: 'beneath', emoji: '💅', points: { royal: 2 } },
    ],
  },
];

// Тип із найбільшою сумою балів; нічия — за порядком у CHARACTER_TYPES.
export function characterOf(answers: Record<string, string>): CharacterType {
  const score = Object.fromEntries(CHARACTER_TYPES.map((t) => [t, 0])) as Record<
    CharacterType,
    number
  >;
  for (const question of QUESTIONS) {
    const option = question.options.find((o) => o.id === answers[question.id]);
    for (const [type, points] of Object.entries(option?.points ?? {})) {
      score[type as CharacterType] += points;
    }
  }
  return CHARACTER_TYPES.reduce((best, type) => (score[type] > score[best] ? type : best));
}
