import { useState } from 'react';
import { View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { Text } from '@/components/ui';
import { formatWeightNumber, gramsToUnit, niceTicks, type WeightUnit } from '@/lib/weight';
import { useTheme } from '@/theme';

export type ChartPoint = { time: number; grams: number };

type WeightChartProps = {
  points: ChartPoint[]; // від старих до нових
  unit: WeightUnit;
  unitLabel: string;
  locale: string;
  accessibilityLabel: string;
  height?: number;
};

const Y_AXIS_WIDTH = 40;
const X_AXIS_HEIGHT = 22;
const TOP_PAD = 28; // місце для підпису останньої точки й підказки
const RIGHT_PAD = 12;
const DOT_R = 4;
const RING = 2;

function formatDate(time: number, locale: string, withYear: boolean) {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
  }).format(new Date(time));
}

// Лінійний графік однієї серії за правилами dataviz: лінія 2 px, заливка ~10 %,
// тонка суцільна сітка, підпис лише на останній точці, перехрестя з підказкою.
export function WeightChart({
  points,
  unit,
  unitLabel,
  locale,
  accessibilityLabel,
  height = 200,
}: WeightChartProps) {
  const { colors, radii, spacing } = useTheme();
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  const plotW = Math.max(0, width - Y_AXIS_WIDTH - RIGHT_PAD);
  const plotH = height - TOP_PAD - X_AXIS_HEIGHT;

  const values = points.map((p) => gramsToUnit(p.grams, unit));
  const { ticks, min, max } = niceTicks(Math.min(...values), Math.max(...values));
  const t0 = points[0]?.time ?? 0;
  const t1 = points[points.length - 1]?.time ?? 0;
  const spanMs = t1 - t0;

  const x = (time: number) =>
    Y_AXIS_WIDTH + (spanMs === 0 ? plotW / 2 : ((time - t0) / spanMs) * plotW);
  const y = (value: number) => TOP_PAD + plotH - ((value - min) / (max - min)) * plotH;

  const coords = points.map((p, i) => ({ x: x(p.time), y: y(values[i]!) }));
  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x},${c.y}`).join(' ');
  const baseline = TOP_PAD + plotH;
  const areaPath =
    coords.length > 1
      ? `${linePath} L${coords[coords.length - 1]!.x},${baseline} L${coords[0]!.x},${baseline} Z`
      : '';

  const last = coords[coords.length - 1];
  const showYear = new Date(t0).getFullYear() !== new Date().getFullYear();
  const xLabels = points.length === 1 || spanMs === 0 ? [t0] : [t0, t1];

  function pick(event: GestureResponderEvent) {
    if (coords.length === 0) return;
    const px = event.nativeEvent.locationX;
    let nearest = 0;
    coords.forEach((c, i) => {
      if (Math.abs(c.x - px) < Math.abs(coords[nearest]!.x - px)) nearest = i;
    });
    setActive(nearest);
  }

  const activePoint = active !== null ? points[active] : null;
  const activeCoord = active !== null ? coords[active] : null;
  const tooltipW = 112;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      style={{ height }}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={pick}
      onResponderMove={pick}
      onResponderRelease={() => setActive(null)}
      onResponderTerminate={() => setActive(null)}
    >
      {/* Дочірні елементи не ловлять дотик: locationX завжди від самого графіка. */}
      {width > 0 && (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <Svg width={width} height={height}>
            {ticks.map((tick) => (
              <Line
                key={tick}
                x1={Y_AXIS_WIDTH}
                x2={width - RIGHT_PAD}
                y1={y(tick)}
                y2={y(tick)}
                stroke={colors.border}
                strokeWidth={1}
              />
            ))}
            {areaPath ? <Path d={areaPath} fill={colors.chartLine} fillOpacity={0.1} /> : null}
            {coords.length > 1 && (
              <Path
                d={linePath}
                fill="none"
                stroke={colors.chartLine}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {activeCoord && (
              <Line
                x1={activeCoord.x}
                x2={activeCoord.x}
                y1={TOP_PAD}
                y2={baseline}
                stroke={colors.textMuted}
                strokeWidth={1}
              />
            )}
            {(activeCoord ?? last) && (
              <Circle
                cx={(activeCoord ?? last)!.x}
                cy={(activeCoord ?? last)!.y}
                r={DOT_R + RING / 2}
                fill={colors.chartLine}
                stroke={colors.card}
                strokeWidth={RING}
              />
            )}
          </Svg>

          {/* Підписи — звичайним текстом, у кольорах тексту, не серії. */}
          {ticks.map((tick) => (
            <Text
              key={tick}
              variant="caption"
              tone="muted"
              style={{
                position: 'absolute',
                left: 0,
                width: Y_AXIS_WIDTH - 6,
                textAlign: 'right',
                top: y(tick) - 9,
                fontVariant: ['tabular-nums'],
              }}
            >
              {new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(tick)}
            </Text>
          ))}
          {xLabels.map((time, i) => (
            <Text
              key={`${time}-${i}`}
              variant="caption"
              tone="muted"
              style={{
                position: 'absolute',
                top: baseline + 4,
                ...(i === 0 && xLabels.length > 1
                  ? { left: Y_AXIS_WIDTH }
                  : xLabels.length === 1
                    ? { left: Y_AXIS_WIDTH, width: plotW, textAlign: 'center' }
                    : { right: RIGHT_PAD }),
              }}
            >
              {formatDate(time, locale, showYear)}
            </Text>
          ))}

          {/* Підпис останньої точки — у вільній смузі над графіком, вирівняний по точці:
              так його не перетинає лінія за будь-якого тренду. */}
          {!activePoint && last && (
            <Text
              variant="label"
              style={{
                position: 'absolute',
                top: 2,
                right: Math.max(0, width - last.x - DOT_R - RING),
              }}
            >
              {formatWeightNumber(points[points.length - 1]!.grams, unit, locale)} {unitLabel}
            </Text>
          )}

          {activePoint && activeCoord && (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 0,
                left: Math.min(Math.max(0, activeCoord.x - tooltipW / 2), width - tooltipW),
                width: tooltipW,
                paddingVertical: spacing.xs,
                paddingHorizontal: spacing.sm,
                borderRadius: radii.sm,
                backgroundColor: colors.bg,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
              }}
            >
              <Text variant="label">
                {formatWeightNumber(activePoint.grams, unit, locale)} {unitLabel}
              </Text>
              <Text variant="caption" tone="muted">
                {formatDate(activePoint.time, locale, true)}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// Мініграфік для плитки: без осей, лінія в приглушеному кольорі, остання точка — акцент.
export function WeightSparkline({
  points,
  height = 36,
}: {
  points: ChartPoint[];
  height?: number;
}) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  if (points.length < 2) return null;

  const pad = DOT_R + RING;
  const minG = Math.min(...points.map((p) => p.grams));
  const maxG = Math.max(...points.map((p) => p.grams));
  const t0 = points[0]!.time;
  const span = points[points.length - 1]!.time - t0 || 1;
  const range = maxG - minG || 1;
  const coords = points.map((p) => ({
    x: pad + ((p.time - t0) / span) * (width - pad * 2),
    y: pad + (1 - (p.grams - minG) / range) * (height - pad * 2),
  }));
  const last = coords[coords.length - 1]!;

  return (
    <View
      style={{ height }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {width > 0 && (
        <Svg width={width} height={height}>
          <Path
            d={coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x},${c.y}`).join(' ')}
            fill="none"
            stroke={colors.textMuted}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle
            cx={last.x}
            cy={last.y}
            r={DOT_R}
            fill={colors.chartLine}
            stroke={colors.card}
            strokeWidth={RING}
          />
        </Svg>
      )}
    </View>
  );
}
