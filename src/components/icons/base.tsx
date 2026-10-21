// Анімовані іконки lucide-animated (https://lucide-animated.com, MIT),
// перенесені з motion/react (web) на react-native-svg + Reanimated.
// Шляхи — з Lucide (https://lucide.dev, ISC). Анімації відтворюють оригінал:
// у web вони грають на hover, у нас — коли змінюється `trigger`
// (вкладка стала активною, кнопку натиснули) або одразу (`autoPlay`).
import { useEffect, useEffectEvent, useRef, type ReactNode } from 'react';
import Animated from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

export type IconProps = {
  size?: number;
  color: string;
  strokeWidth?: number;
  // Будь-яке значення: коли воно змінюється, іконка програє анімацію.
  trigger?: unknown;
  // Програти анімацію одразу після появи (порожні стани тощо).
  autoPlay?: boolean;
};

export const AnimatedPath = Animated.createAnimatedComponent(Path);
export const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Викликає play() при зміні trigger; першу появу пропускає, якщо не autoPlay.
export function useIconAnimation(trigger: unknown, autoPlay: boolean, play: () => void) {
  const first = useRef(true);
  const onPlay = useEffectEvent(play);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      if (!autoPlay) return;
    }
    onPlay();
  }, [trigger, autoPlay]);
}

type IconSvgProps = {
  size: number;
  color: string;
  strokeWidth: number;
  children: ReactNode;
};

// Спільні атрибути Lucide: сітка 24×24, лише обведення, круглі кінці.
export function IconSvg({ size, color, strokeWidth, children }: IconSvgProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Svg>
  );
}

export const DEFAULT_SIZE = 24;
export const DEFAULT_STROKE = 2;
