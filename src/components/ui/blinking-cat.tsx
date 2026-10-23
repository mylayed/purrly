import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Ellipse, Path } from 'react-native-svg';

import { useTheme } from '@/theme';

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

const EYE_RY = 7;
const WIDTH = 120;
const HEIGHT = 104;

// Котяча мордочка для порожніх станів: раз на кілька секунд моргає, інколи двічі.
// Декоративна — сенс несуть заголовок і текст поруч, тож читачам екрана її не показуємо.
export function BlinkingCat({ size = 120 }: { size?: number }) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const open = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    const close = withTiming(0.08, { duration: 90 });
    const reopen = withTiming(1, { duration: 120 });
    open.value = withRepeat(
      withSequence(
        withDelay(2600, close),
        reopen,
        withDelay(3400, close),
        reopen,
        withDelay(140, close),
        reopen,
      ),
      -1,
    );
  }, [open, reduceMotion]);

  const eyeProps = useAnimatedProps(() => ({ ry: EYE_RY * open.value }));
  const stroke = { stroke: colors.accent, strokeWidth: 2.5, strokeLinejoin: 'round' as const };

  return (
    // Приховуємо на View: Svg у web передав би атрибут у DOM як є.
    <View aria-hidden>
      <Svg width={size} height={(size * HEIGHT) / WIDTH} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        {/* Вушка під головою, щоб основа ховалась за нею. */}
        <Path d="M22 50 L28 10 L54 34 Z" fill={colors.accentSoft} {...stroke} />
        <Path d="M98 50 L92 10 L66 34 Z" fill={colors.accentSoft} {...stroke} />
        <Path d="M31 38 L34 20 L45 31 Z" fill={colors.accent} opacity={0.35} />
        <Path d="M89 38 L86 20 L75 31 Z" fill={colors.accent} opacity={0.35} />
        <Ellipse cx={60} cy={64} rx={42} ry={34} fill={colors.accentSoft} {...stroke} />

        <AnimatedEllipse cx={44} cy={60} rx={5} fill={colors.text} animatedProps={eyeProps} />
        <AnimatedEllipse cx={76} cy={60} rx={5} fill={colors.text} animatedProps={eyeProps} />

        <Path d="M56.5 72 H63.5 L60 76 Z" fill={colors.accent} />
        <Path
          d="M60 76 Q57 81 52.5 79 M60 76 Q63 81 67.5 79"
          fill="none"
          stroke={colors.text}
          strokeWidth={1.75}
          strokeLinecap="round"
        />
        <Path
          d="M30 70 L12 66 M30 76 L12 78 M90 70 L108 66 M90 76 L108 78"
          stroke={colors.textMuted}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}
