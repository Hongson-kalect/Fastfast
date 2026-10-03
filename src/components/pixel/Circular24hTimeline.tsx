import { useAppStore } from "@/stores/appStore";
import React, { useEffect, useMemo } from "react";
import { ActivityIndicator, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, G, Line, Path, Text as SvgText } from "react-native-svg";

const AnimatedPath = Animated.createAnimatedComponent(Path);

export type CircularTimelineSegment = {
  id: string;
  startHour: number;
  duration: number;
  color?: string;
};

type Props = {
  segments: CircularTimelineSegment[];
  totalDuration?: number;
  size?: number;
  strokeWidth?: number;
  animated?: boolean;
  animationDuration?: number;

  isLoading?: boolean;
};

type NormalizedSegment = CircularTimelineSegment & {
  startAngle: number;
  endAngle: number;
};

type SegmentItemProps = {
  index: number;
  segment: NormalizedSegment;
  center: number;
  ringRadius: number;
  strokeWidth: number;
  animationDuration: number;
  animated: boolean;
};

const DEFAULT_SIZE = 260;
const DEFAULT_STROKE_WIDTH = 12;

export const DEBUG_COLORS = [
  "#34D399", // emerald
  "#60A5FA", // blue
  "#F59E0B", // amber
  "#F472B6", // pink
  "#A78BFA", // violet
  "#FB7185", // rose
];

const ARC_GAP_DEG = 5.5;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const polarToCartesian = (
  cx: number,
  cy: number,
  radius: number,
  angleInDegrees: number,
) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;

  return {
    x: cx + radius * Math.cos(angleInRadians),

    y: cy + radius * Math.sin(angleInRadians),
  };
};

const describeArcPath = (
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) => {
  const start = polarToCartesian(cx, cy, radius, startAngle);

  const end = polarToCartesian(cx, cy, radius, endAngle);

  const angle = endAngle - startAngle;

  const largeArcFlag = angle > 180 ? 1 : 0;

  return [
    `M ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
  ].join(" ");
};

const TimelineSegmentItem = React.memo(
  ({
    index,
    segment,
    center,
    ringRadius,
    strokeWidth,
    animationDuration,
    animated,
  }: SegmentItemProps) => {
    const { theme } = useAppStore();
    const colors = [theme.primary, theme.warning];

    const rawStartAngle = segment.startAngle;

    const rawEndAngle = segment.endAngle;

    const rawSegmentAngle = rawEndAngle - rawStartAngle;

    if (rawSegmentAngle <= ARC_GAP_DEG * 2) {
      return null;
    }
    const startAngle = rawStartAngle + ARC_GAP_DEG;

    const endAngle = rawEndAngle - ARC_GAP_DEG;

    const arcAngle = endAngle - startAngle;

    if (arcAngle <= 0) {
      return null;
    }
    const circumference = 2 * Math.PI * ringRadius;

    const arcLength = (arcAngle / 360) * circumference;

    const path = describeArcPath(
      center,
      center,
      ringRadius,
      startAngle,
      endAngle,
    );

    const animationProgress = useSharedValue(animated ? 0 : 1);

    useEffect(() => {
      if (!animated) {
        animationProgress.value = 1;
        return;
      }

      const delay = (segment.startHour / 24) * animationDuration;

      const duration = (segment.duration / 24) * animationDuration;

      /**
       * Reset trước mỗi lần data thay đổi.
       */
      animationProgress.value = 0;
      animationProgress.value = withDelay(
        delay,
        withTiming(1, {
          duration: Math.max(1, duration),
          easing: Easing.linear,
        }),
      );
    }, [
      animated,
      animationDuration,
      segment.startHour,
      segment.duration,
      animationProgress,
    ]);

    const animatedProps = useAnimatedProps(() => {
      return {
        strokeDashoffset: arcLength * (1 - animationProgress.value),
      };
    });

    const color = index % 2 === 0 ? theme.success : theme.success + "CC";

    return (
      <AnimatedPath
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={[arcLength, arcLength]}
        animatedProps={animatedProps}
      />
    );
  },
);

TimelineSegmentItem.displayName = "TimelineSegmentItem";

export default function Circular24hTimeline({
  segments,
  totalDuration = 0,
  size = DEFAULT_SIZE,
  strokeWidth = DEFAULT_STROKE_WIDTH,
  animated = true,
  animationDuration = 1000,
  isLoading = false,
}: Props) {
  const { theme } = useAppStore();

  const center = size / 2;
  const anchorRadius = size * 0.4;
  const ringRadius = size * 0.31;

  const normalizedSegments = useMemo(() => {
    return segments
      .map((segment) => {
        const start = clamp(segment.startHour, 0, 24);
        const duration = clamp(segment.duration, 0, 24 - start);

        return {
          ...segment,
          startHour: start,
          duration,
          startAngle: (start / 24) * 360,
          endAngle: ((start + duration) / 24) * 360,
          color: segment.color ?? theme.primary,
        };
      })
      .filter((segment) => segment.duration > 0);
  }, [segments, theme.primary]);

  const anchors = [
    { hour: 0, label: "24 - 00" },
    { hour: 6, label: "06" },
    { hour: 12, label: "12" },
    { hour: 18, label: "18" },
  ];

  const boundaryOuter = polarToCartesian(
    center,
    center,
    ringRadius + strokeWidth / 2 + 2,
    0,
  );

  const boundaryInner = polarToCartesian(
    center,
    center,
    ringRadius - strokeWidth / 2 - 2,
    0,
  );

  return (
    <View
      style={{
        width: size,
        height: size,
        alignSelf: "center",
      }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Outer guide */}
        <Circle
          cx={center}
          cy={center}
          r={anchorRadius}
          fill="none"
          stroke={theme.text + "20"}
          strokeWidth={1}
        />

        {/* Time anchors */}
        {anchors.map((anchor) => {
          const angle = (anchor.hour / 24) * 360;

          const outer = polarToCartesian(
            center,
            center,
            anchorRadius,
            angle,
          );

          const inner = polarToCartesian(
            center,
            center,
            anchorRadius - 6,
            angle,
          );

          const labelPos = polarToCartesian(
            center,
            center,
            anchorRadius + 8,
            angle,
          );

          return (
            <G key={anchor.hour}>
              <Line
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke={theme.text + "50"}
                strokeWidth={2}
                strokeLinecap="round"
              />

              <SvgText
                x={labelPos.x}
                y={labelPos.y}
                fill={theme.text + "80"}
                fontSize={10}
                fontWeight="600"
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {anchor.label}
              </SvgText>
            </G>
          );
        })}

        {/* Timeline background */}
        <Circle
          cx={center}
          cy={center}
          r={ringRadius}
          fill="none"
          stroke={theme.text + "12"}
          strokeWidth={strokeWidth}
        />

        {/* Fast segments */}
        {normalizedSegments.map((segment, index) => (
          <TimelineSegmentItem
            key={segment.id}
            index={index}
            segment={segment}
            center={center}
            ringRadius={ringRadius}
            strokeWidth={strokeWidth}
            animationDuration={animationDuration}
            animated={animated}
          />
        ))}

        {/* 0H / 24H boundary */}
        <Line
          x1={boundaryInner.x}
          y1={boundaryInner.y}
          x2={boundaryOuter.x}
          y2={boundaryOuter.y}
          stroke={theme.error + "AA"}
          strokeWidth={4}
          strokeLinecap="round"
        />

        <Circle
          cx={boundaryOuter.x}
          cy={boundaryOuter.y}
          r={2.5}
          fill={theme.error}
        />

        {/* Total */}
        <SvgText
          x={center}
          y={center - 8}
          fill={theme.title}
          fontSize={30}
          fontWeight="700"
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {totalDuration.toFixed(1)}
        </SvgText>

        <SvgText
          x={center}
          y={center + 18}
          fill={theme.text + "70"}
          fontSize={9}
          fontWeight="600"
          letterSpacing={1.2}
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          HOURS FASTED
        </SvgText>
      </Svg>

      {isLoading && (
        <View className="absolute inset-0 items-center justify-center">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-background/90">
            <ActivityIndicator
              size="small"
              color={theme.primary}
            />
          </View>
        </View>
      )}
    </View>
  );
}