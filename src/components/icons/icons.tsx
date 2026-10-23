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
import { Circle, Path, Rect } from 'react-native-svg';

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

// ── chart-line: лінія графіка «малюється» (0.3 s із затримкою 0.15 s) ────────────
const CHART_LINE_LENGTH = 17.2;

export function ChartLineIcon({
  size = DEFAULT_SIZE,
  color,
  strokeWidth = DEFAULT_STROKE,
  trigger,
  autoPlay = false,
}: IconProps) {
  const progress = useSharedValue(1);

  useIconAnimation(trigger, autoPlay, () => {
    progress.value = 0;
    progress.value = withDelay(150, withTiming(1, { duration: 300 }));
  });

  const lineProps = useAnimatedProps(() => ({
    strokeDashoffset: CHART_LINE_LENGTH * (1 - progress.value),
    opacity: Math.min(1, progress.value * 3),
  }));

  return (
    <IconSvg size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <AnimatedPath
        d="m7 13 3-3 4 4 5-5"
        strokeDasharray={CHART_LINE_LENGTH}
        animatedProps={lineProps}
      />
    </IconSvg>
  );
}

// ── delete: кришка підскакує, кошик трохи осідає (пружина) ───────────────────────
export function DeleteIcon({
  size = DEFAULT_SIZE,
  color,
  strokeWidth = DEFAULT_STROKE,
  trigger,
  autoPlay = false,
}: IconProps) {
  const lid = useSharedValue(0);
  const body = useSharedValue(0);
  const unit = size / 24;
  const spring = { stiffness: 500, damping: 30 };

  // В оригіналі стан тримається, поки курсор над іконкою; на дотик — коротке «туди й назад».
  useIconAnimation(trigger, autoPlay, () => {
    lid.value = withSequence(withSpring(-1.1 * unit, spring), withSpring(0, spring));
    body.value = withSequence(withSpring(0.5 * unit, spring), withSpring(0, spring));
  });

  const lidStyle = useAnimatedStyle(() => ({ transform: [{ translateY: lid.value }] }));
  const bodyStyle = useAnimatedStyle(() => ({ transform: [{ translateY: body.value }] }));
  const layer = { position: 'absolute' as const, top: 0, left: 0 };

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={[layer, bodyStyle]}>
        <IconSvg size={size} color={color} strokeWidth={strokeWidth}>
          <Path d="M19 8v12c0 1-1 2-2 2H7c-1 0-2-1-2-2V8" />
          <Path d="M10 11v6" />
          <Path d="M14 11v6" />
        </IconSvg>
      </Animated.View>
      <Animated.View style={[layer, lidStyle]}>
        <IconSvg size={size} color={color} strokeWidth={strokeWidth}>
          <Path d="M3 6h18" />
          <Path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </IconSvg>
      </Animated.View>
    </View>
  );
}

// ── badge-alert: значок підстрибує й хитається (0.5 s) ────────────────────────────
export function BadgeAlertIcon({
  size = DEFAULT_SIZE,
  color,
  strokeWidth = DEFAULT_STROKE,
  trigger,
  autoPlay = false,
}: IconProps) {
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  useIconAnimation(trigger, autoPlay, () => {
    // Оригінал: scale [1, 1.1, 1.1, 1.1, 1], rotate [0, -3, 3, -2, 2, 0] за 0.5 s.
    scale.value = withSequence(
      withTiming(1.1, { duration: 100 }),
      withDelay(200, withTiming(1, { duration: 200 })),
    );
    const step = { duration: 100, easing: easeInOut };
    rotate.value = withSequence(
      withTiming(-3, step),
      withTiming(3, step),
      withTiming(-2, step),
      withTiming(2, step),
      withTiming(0, step),
    );
  });

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  return (
    <Animated.View style={style}>
      <IconSvg size={size} color={color} strokeWidth={strokeWidth}>
        <Path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
        <Path d="M12 8v4" />
        <Path d="M12 16h.01" />
      </IconSvg>
    </Animated.View>
  );
}

// ── utensils: у lucide-animated немає — статична іконка Lucide того ж стилю ──────
export function UtensilsIcon({
  size = DEFAULT_SIZE,
  color,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <IconSvg size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <Path d="M7 2v20" />
      <Path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </IconSvg>
  );
}

// ── check: галочка «малюється» (pathLength 0→1, opacity 0→1, 0.4 s) ───────────────
const CHECK_LENGTH = 22.7;

export function CheckIcon({
  size = DEFAULT_SIZE,
  color,
  strokeWidth = DEFAULT_STROKE,
  trigger,
  autoPlay = false,
}: IconProps) {
  const progress = useSharedValue(1);

  useIconAnimation(trigger, autoPlay, () => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 400, easing: easeInOut });
  });

  const props = useAnimatedProps(() => ({
    strokeDashoffset: CHECK_LENGTH * (1 - progress.value),
    opacity: Math.min(1, progress.value * 4),
  }));

  return (
    <IconSvg size={size} color={color} strokeWidth={strokeWidth}>
      <AnimatedPath d="M20 6 9 17l-5-5" strokeDasharray={CHECK_LENGTH} animatedProps={props} />
    </IconSvg>
  );
}

// ── Статичні іконки Lucide того ж стилю (у lucide-animated їх немає) ──────────────
export function StethoscopeIcon({
  size = DEFAULT_SIZE,
  color,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <IconSvg size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M11 2v2" />
      <Path d="M5 2v2" />
      <Path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1" />
      <Path d="M8 15a6 6 0 0 0 12 0v-3" />
      <Circle cx="20" cy="10" r="2" />
    </IconSvg>
  );
}

export function PawPrintIcon({
  size = DEFAULT_SIZE,
  color,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <IconSvg size={size} color={color} strokeWidth={strokeWidth}>
      <Circle cx="11" cy="4" r="2" />
      <Circle cx="18" cy="8" r="2" />
      <Circle cx="20" cy="16" r="2" />
      <Path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" />
    </IconSvg>
  );
}

export function StickyNoteIcon({
  size = DEFAULT_SIZE,
  color,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <IconSvg size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z" />
      <Path d="M15 3v4a2 2 0 0 0 2 2h4" />
    </IconSvg>
  );
}

export function CameraIcon({
  size = DEFAULT_SIZE,
  color,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <IconSvg size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <Circle cx="12" cy="13" r="3" />
    </IconSvg>
  );
}

export function PillIcon({ size = DEFAULT_SIZE, color, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return (
    <IconSvg size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
      <Path d="m8.5 8.5 7 7" />
    </IconSvg>
  );
}
