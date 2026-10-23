import { BottomTabBarHeightContext } from 'expo-router/tabs';
import { useContext, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  // Закріплена шапка (ScreenHeader): лишається на місці, поки вміст прокручується.
  header?: ReactNode;
};

export function Screen({ children, scroll = false, contentStyle, header }: ScreenProps) {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  // Нижню безпечну зону не резервуємо: вміст іде до краю екрана, а відступ під
  // home-індикатор додаємо в кінці вмісту. У вкладках цю зону вже займає таб-бар.
  const inTabs = useContext(BottomTabBarHeightContext) !== undefined;
  const padding = {
    padding: spacing.lg,
    paddingTop: header ? spacing.sm : spacing.lg,
    paddingBottom: spacing.lg + (inTabs ? 0 : insets.bottom),
    gap: spacing.lg,
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.root, { backgroundColor: colors.bg }]}
    >
      {header && (
        <View
          style={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.lg,
            paddingBottom: spacing.sm,
          }}
        >
          {header}
        </View>
      )}
      {/* Щоб поля вводу не ховалися під клавіатурою. */}
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView
            contentContainerStyle={[padding, contentStyle]}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.root, padding, contentStyle]}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
