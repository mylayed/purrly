import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
};

export function Screen({ children, scroll = false, contentStyle }: ScreenProps) {
  const { colors, spacing } = useTheme();
  const padding = { padding: spacing.lg, gap: spacing.lg };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]}>
      {scroll ? (
        <ScrollView contentContainerStyle={[padding, contentStyle]}>{children}</ScrollView>
      ) : (
        <View style={[styles.root, padding, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
