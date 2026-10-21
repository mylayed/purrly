import { useCallback, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Path, Rect } from 'react-native-svg';

import {
  AnimatedCircle,
  AnimatedPath,
  DEFAULT_SIZE,
  DEFAULT_STROKE,
  IconSvg,
  useIconAnimation,
  type IconProps,
} from './base';

const easeInOut = Easing.inOut(Easing.ease);

// ── home: двері «малюються» знову (pathLength 0→1, opacity 0→1, 0.6 s) ─────────
const HOME_DOOR_LENGTH = 23.2;

export function HomeIcon({
  size = DEFAULT_SIZE,
  color,
  strokeWidth = DEFAULT_STROKE,
  trigger,
  autoPlay = false,
}: IconProps) {
  const progress = useSharedValue(1);
  const opacity = useSharedValue(1);

  useIconAnimation(trigger, autoPlay, () => {
    progress.value = 0;
    opacity.value = 0;
    progress.value = withTiming(1, { duration: 600 });
    opacity.value = withTiming(1, { duration: 200 });
  });

  const doorProps = useAnimatedProps(() => ({
    strokeDashoffset: HOME_DOOR_LENGTH * (1 - progress.value),
    opacity: opacity.value,
  }));

  return (
    <IconSvg size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <AnimatedPath
        d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"
        strokeDasharray={HOME_DOOR_LENGTH}
        animatedProps={doorProps}
      />
    </IconSvg>
  );
}

// ── gallery-thumbnails: мініатюри з'являються по черзі (кожна 0.2 s, крок 0.15 s) ──
const THUMBNAILS = ['M4 21h1', 'M9 21h1', 'M14 21h1', 'M19 21h1'];

function Thumbnail({ d, index, run }: { d: string; index: number; run: number }) {
  const opacity = useSharedValue(1);

  useIconAnimation(run, false, () => {
    opacity.value = 0;
    opacity.value = withDelay((index + 1) * 150, withTiming(1, { duration: 200 }));
  });

  const props = useAnimatedProps(() => ({ opacity: opacity.value }));
  return <AnimatedPath d={d} animatedProps={props} />;
}

export function GalleryThumbnailsIcon({
  size = DEFAULT_SIZE,
  color,
  strokeWidth = DEFAULT_STROKE,
  trigger,
  autoPlay = false,
}: IconProps) {
  const run = useSharedRunCounter(trigger, autoPlay);
  return (
    <IconSvg size={size} color={color} strokeWidth={strokeWidth}>
      <Rect x={3} y={3} width={18} height={14} rx={2} />
      {THUMBNAILS.map((d, index) => (
        <Thumbnail key={d} d={d} index={index} run={run} />
      ))}
    </IconSvg>
  );
}

// ── bell: хитання −10° / 10° / −10° (0.5 s) ─────────────────────────────────────
export function BellIcon({
  size = DEFAULT_SIZE,
  color,
  strokeWidth = DEFAULT_STROKE,
  trigger,
  autoPlay = false,
}: IconProps) {
  const rotate = useSharedValue(0);

  useIconAnimation(trigger, autoPlay, () => {
    const step = { duration: 125, easing: easeInOut };
    rotate.value = withSequence(
      withTiming(-10, step),
      withTiming(10, step),
      withTiming(-10, step),
      withTiming(0, step),
    );
  });

  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotate.value}deg` }] }));

  return (
    <Animated.View style={style}>
      <IconSvg size={size} color={color} strokeWidth={strokeWidth}>
        <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </IconSvg>
    </Animated.View>
  );
}

// ── user: голова виростає й малюється, потім плечі (0.4 s із затримкою 0.2 s) ──────
const USER_HEAD_LENGTH = 31.5; // 2π · 5
const USER_BODY_LENGTH = 25.2; // π · 8

export function UserIcon({
  size = DEFAULT_SIZE,
  color,
  strokeWidth = DEFAULT_STROKE,
  trigger,
  autoPlay = false,
}: IconProps) {
  const head = useSharedValue(1);
  const body = useSharedValue(1);

  useIconAnimation(trigger, autoPlay, () => {
    head.value = 0;
    body.value = 0;
    head.value = withTiming(1, { duration: 300 });
    body.value = withDelay(200, withTiming(1, { duration: 400 }));
  });

  const headProps = useAnimatedProps(() => ({
    strokeDashoffset: USER_HEAD_LENGTH * (1 - head.value),
    // Масштаб 0.5→1 навколо центру голови (12, 8).
    r: 5 * (0.5 + 0.5 * head.value),
  }));
  const bodyProps = useAnimatedProps(() => ({
    strokeDashoffset: USER_BODY_LENGTH * (1 - body.value),
    opacity: body.value,
  }));

  return (
    <IconSvg size={size} color={color} strokeWidth={strokeWidth}>
      <AnimatedCircle
        cx={12}
        cy={8}
        r={5}
        strokeDasharray={USER_HEAD_LENGTH}
        animatedProps={headProps}
      />
      <AnimatedPath
        d="M20 21a8 8 0 0 0-16 0"
        strokeDasharray={USER_BODY_LENGTH}
        animatedProps={bodyProps}
      />
    </IconSvg>
  );
}

// ── plus: оберт на 180° пружиною ────────────────────────────────────────────────
export function PlusIcon({
  size = DEFAULT_SIZE,
  color,
  strokeWidth = DEFAULT_STROKE,
  trigger,
  autoPlay = false,
}: IconProps) {
  const rotate = useSharedValue(0);

  // Плюс, повернутий на 180°, виглядає так само, тож після оберту тихо скидаємо кут.
  useIconAnimation(trigger, autoPlay, () => {
    rotate.value = 0;
    rotate.value = withSpring(180, { stiffness: 100, damping: 15 }, (finished) => {
      if (finished) rotate.value = 0;
    });
  });

  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotate.value}deg` }] }));

  return (
    <Animated.View style={style}>
      <IconSvg size={size} color={color} strokeWidth={strokeWidth}>
        <Path d="M5 12h14" />
        <Path d="M12 5v14" />
      </IconSvg>
    </Animated.View>
  );
}

// ── chevron-left / chevron-right: короткий «кивок» у бік стрілки (0.5 s) ───────────
function useNudge(trigger: unknown, autoPlay: boolean, direction: -1 | 1, size: number) {
  const x = useSharedValue(0);
  // Зсув 2 одиниці з 24 — переводимо у пікселі розміру іконки.
  const distance = (2 / 24) * size * direction;

  useIconAnimation(trigger, autoPlay, () => {
    x.value = withSequence(
      withTiming(distance, { duration: 200, easing: easeInOut }),
      withTiming(0, { duration: 300, easing: easeInOut }),
    );
  });

  return useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
}

export function ChevronLeftIcon({
  size = DEFAULT_SIZE,
  color,
  strokeWidth = DEFAULT_STROKE,
  trigger,
  autoPlay = false,
}: IconProps) {
  const style = useNudge(trigger, autoPlay, -1, size);
  return (
    <Animated.View style={style}>
      <IconSvg size={size} color={color} strokeWidth={strokeWidth}>
        <Path d="m15 18-6-6 6-6" />
      </IconSvg>
    </Animated.View>
  );
}

export function ChevronRightIcon({
  size = DEFAULT_SIZE,
  color,
  strokeWidth = DEFAULT_STROKE,
  trigger,
  autoPlay = false,
}: IconProps) {
  const style = useNudge(trigger, autoPlay, 1, size);
  return (
    <Animated.View style={style}>
      <IconSvg size={size} color={color} strokeWidth={strokeWidth}>
        <Path d="m9 18 6-6-6-6" />
      </IconSvg>
    </Animated.View>
  );
}

// ── square-pen: олівець «пише» — легкі зсуви та нахил ───────────────────────────
export function SquarePenIcon({
  size = DEFAULT_SIZE,
  color,
  strokeWidth = DEFAULT_STROKE,
  trigger,
  autoPlay = false,
}: IconProps) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const rotate = useSharedValue(0);
  const unit = size / 24;

  useIconAnimation(trigger, autoPlay, () => {
    const step = { duration: 170, easing: easeInOut };
    x.value = withSequence(
      withTiming(-1 * unit, step),
      withTiming(1.5 * unit, step),
      withTiming(0, step),
    );
    y.value = withSequence(
      withTiming(1.5 * unit, step),
      withTiming(-1 * unit, step),
      withTiming(0, step),
    );
    rotate.value = withSequence(withTiming(-0.5, step), withTiming(0.5, step), withTiming(0, step));
  });

  const penStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { rotate: `${rotate.value}deg` }],
  }));

  // Квадрат статичний, олівець — окремий шар поверх нього з тією самою сіткою.
  return (
    <View style={{ width: size, height: size }}>
      <IconSvg size={size} color={color} strokeWidth={strokeWidth}>
        <Path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      </IconSvg>
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0 }, penStyle]}>
        <IconSvg size={size} color={color} strokeWidth={strokeWidth}>
          <Path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />
        </IconSvg>
      </Animated.View>
    </View>
  );
}

// ── cat: у lucide-animated кота немає — статична іконка Lucide того ж стилю ──────
export function CatIcon({ size = DEFAULT_SIZE, color, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return (
    <IconSvg size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5Z" />
      <Path d="M8 14v.5" />
      <Path d="M16 14v.5" />
      <Path d="M11.25 16.25h1.5L12 17l-.75-.75Z" />
    </IconSvg>
  );
}

// Лічильник запусків: анімацію галереї ведуть дочірні шляхи, тож батько лише
// збільшує число, а кожна мініатюра реагує на його зміну.
function useSharedRunCounter(trigger: unknown, autoPlay: boolean) {
  const [run, setRun] = useState(0);
  const bump = useCallback(() => setRun((value) => value + 1), []);
  useIconAnimation(trigger, autoPlay, bump);
  return run;
}
