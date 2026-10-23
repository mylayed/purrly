import { View } from 'react-native';

import { useTheme } from '@/theme';

// Крапки «виконано / заплановано». Декоративні: те саме число завжди є текстом поруч.
export function SlotDots({ done, total }: { done: number; total: number }) {
  const { colors, spacing } = useTheme();
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}
    >
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            borderWidth: 1.5,
            borderColor: colors.accent,
            backgroundColor: i < done ? colors.accent : 'transparent',
          }}
        />
      ))}
    </View>
  );
}
