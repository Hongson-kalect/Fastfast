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

  /**

* true:
* Sweep toàn bộ timeline 24h.
*
* false:
* Hiển thị ngay lập tức.
  */
  animated?: boolean;

  /**

* Tổng thời gian animation cho toàn bộ 24h sweep.
*
* Ví dụ:
* 2400ms
*
* 0h  -> 0ms
* 6h  -> 600ms
* 12h -> 1200ms
* 18h -> 1800ms
* 24h -> 2400ms
  */
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

/* ================================================================
DEFAULTS
================================================================ */

const DEFAULT_SIZE = 260;
const DEFAULT_STROKE_WIDTH = 12;

/**

* Tạm thời dùng màu khác nhau để debug.
*
* Sau khi geometry ổn định có thể bỏ và dùng
* một màu duy nhất.
  */
export const DEBUG_COLORS = [
  "#34D399", // emerald
  "#60A5FA", // blue
  "#F59E0B", // amber
  "#F472B6", // pink
  "#A78BFA", // violet
  "#FB7185", // rose
];

/**

* Khoảng hở giữa các segment.
*
* Đây là GAP MỖI PHÍA.
*
* Ví dụ:
*
* 20 -> 24
*
* sẽ thực tế render:
*
* 20 + GAP -> 24 - GAP
*
* Và:
*
* 0 -> 16
*
* sẽ render:
*
* 0 + GAP -> 16 - GAP
*
* Vì vậy tại boundary 24/0 sẽ luôn có khoảng hở.
  */
const ARC_GAP_DEG = 5.5;

/* ================================================================
UTILS
================================================================ */

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

/**

* Tạo một SVG Arc độc lập.
*
* Không dùng Circle + strokeDasharray cho geometry nữa.
*
* Điều này rất quan trọng vì mỗi fasting session
* thực sự là một path riêng biệt:
*
* (=========)
*
* thay vì một Circle bị cắt dash.
  */

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

/* ================================================================
SEGMENT COMPONENT
================================================================ */

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
    /**
     * ------------------------------------------------------------
     * ANGLES
     * ------------------------------------------------------------
     */
    const { theme } = useAppStore();
    const colors = [theme.primary, theme.warning];

    const rawStartAngle = segment.startAngle;

    const rawEndAngle = segment.endAngle;

    const rawSegmentAngle = rawEndAngle - rawStartAngle;

    /**
     * Segment quá ngắn thì không đủ chỗ cho
     * gap ở cả hai đầu.
     */
    if (rawSegmentAngle <= ARC_GAP_DEG * 2) {
      return null;
    }

    /**
     * ------------------------------------------------------------
     * GAP
     * ------------------------------------------------------------
     *
     * Mỗi segment bị inset vào hai đầu.
     *
     * Ví dụ:
     *
     * raw:
     * 20 ---------------------- 24
     *
     * render:
     *       20 + gap ------ 24 - gap
     *
     * Nhờ vậy round cap không thể chạm
     * segment bên cạnh.
     */
    const startAngle = rawStartAngle + ARC_GAP_DEG;

    const endAngle = rawEndAngle - ARC_GAP_DEG;

    const arcAngle = endAngle - startAngle;

    if (arcAngle <= 0) {
      return null;
    }

    /**
     * ------------------------------------------------------------
     * ARC GEOMETRY
     * ------------------------------------------------------------
     */

    const circumference = 2 * Math.PI * ringRadius;

    const arcLength = (arcAngle / 360) * circumference;

    const path = describeArcPath(
      center,
      center,
      ringRadius,
      startAngle,
      endAngle,
    );

    /**
     * ------------------------------------------------------------
     * 24H SWEEP ANIMATION
     * ------------------------------------------------------------
     *
     * animationDuration đại diện cho toàn bộ:
     *
     * 0h ----------------------------> 24h
     *
     * Ví dụ animationDuration = 2400ms:
     *
     * startHour = 0
     *   delay = 0ms
     *
     * startHour = 6
     *   delay = 600ms
     *
     * startHour = 12
     *   delay = 1200ms
     *
     * startHour = 18
     *   delay = 1800ms
     *
     * duration quyết định arc xuất hiện trong bao lâu.
     *
     * duration = 16h
     *   16 / 24 * 2400 = 1600ms
     *
     * duration = 4h
     *   4 / 24 * 2400 = 400ms
     */
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

      /**
       * Segment xuất hiện đúng thời điểm
       * sweep đi tới startHour.
       *
       * Sau đó nó draw trong thời gian
       * tương ứng với duration của session.
       */
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

    /**
     * ------------------------------------------------------------
     * DASH ANIMATION
     * ------------------------------------------------------------
     *
     * Chỉ có đúng một dash = arcLength.
     *
     * Không dùng:
     *
     *   arcLength + circumference
     *
     * như implementation cũ.
     *
     * Điều này tránh dash pattern wrap qua 0/24.
     */
    const animatedProps = useAnimatedProps(() => {
      return {
        strokeDashoffset: arcLength * (1 - animationProgress.value),
      };
    });

    const color = DEBUG_COLORS[index % colors.length];

    return (
      <AnimatedPath
        d={path}
        fill="none"
        stroke={color ?? segment.color ?? "#34D399"}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        /**
         * Dash = đúng chiều dài arc.
         *
         * Gap = đúng chiều dài arc.
         *
         * Nhờ vậy chỉ có một segment duy nhất
         * được render trên path.
         */
        strokeDasharray={[arcLength, arcLength]}
        animatedProps={animatedProps}
      />
    );
  },
);

TimelineSegmentItem.displayName = "TimelineSegmentItem";

/* ================================================================
MAIN COMPONENT
================================================================ */

export default function Circular24hTimeline({
  segments,
  totalDuration = 0,
  size = DEFAULT_SIZE,
  strokeWidth = DEFAULT_STROKE_WIDTH,
  animated = true,
  animationDuration = 1000,
  isLoading = false,
}: Props) {
  const center = size / 2;

  /**

* ---
* RADII
* ---

*/

  /**

* Vòng ngoài chứa anchor.
  */
  const anchorRadius = size * 0.4;

  /**

* Ring fasting.
  */
  const ringRadius = size * 0.31;

  /**

* ---
* NORMALIZE SEGMENTS
* ---

*/
  const normalizedSegments = useMemo(() => {
    return segments
      .map((segment, index) => {
        const start = clamp(segment.startHour, 0, 24);

        const duration = clamp(segment.duration, 0, 24 - start);

        return {
          ...segment,

          startHour: start,

          duration,

          /**
           * 0h  = 0°
           * 6h  = 90°
           * 12h = 180°
           * 18h = 270°
           * 24h = 360°
           */
          startAngle: (start / 24) * 360,

          endAngle: ((start + duration) / 24) * 360,

          /**
           * DEBUG:
           *
           * Nếu caller không truyền màu,
           * mỗi session có màu khác nhau.
           */
          color: segment.color ?? DEBUG_COLORS[index % DEBUG_COLORS.length],
        };
      })
      .filter((segment) => segment.duration > 0);
  }, [segments]);

  /**

* ---
* TIME ANCHORS
* ---

*/

  const anchors = [
    {
      hour: 0,
      label: "24 | 00",
    },
    {
      hour: 6,
      label: "06",
    },
    {
      hour: 12,
      label: "12",
    },
    {
      hour: 18,
      label: "18",
    },
  ];

  /**

* ---
* 0H / 24H BOUNDARY
* ---
*
* Đây là đường cắt vật lý của vòng.
*
* Nó giúp:
*
* 20 → 24
*
* không visually merge với:
*
* 0 → 16
  */
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

  /**

* ---
* RENDER
* ---

*/
  const { theme } = useAppStore();

  return (
    <View
      style={{
        width: size,
        height: size,
        alignSelf: "center",
      }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={center}
          cy={center}
          r={anchorRadius}
          fill="none"
          stroke="#181D1A"
          strokeWidth={1}
        />
        {/* =====================================================
        TIME ANCHORS
    ===================================================== */}
        {anchors.map((anchor) => {
          const angle = (anchor.hour / 24) * 360;

          const outer = polarToCartesian(center, center, anchorRadius, angle);

          const inner = polarToCartesian(
            center,
            center,
            anchorRadius - 6,
            angle,
          );

          /**
           * Label nằm hơi bên ngoài tick,
           * nhưng vẫn nằm trong SVG viewport.
           */
          const labelPos = polarToCartesian(
            center,
            center,
            anchorRadius + 8,
            angle,
          );

          return (
            <G key={anchor.hour}>
              {/* Tick */}
              <Line
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke="#4B554F"
                strokeWidth={2}
                strokeLinecap="round"
              />

              {/* Label */}
              <SvgText
                x={labelPos.x}
                y={labelPos.y}
                fill="#7B847F"
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
        {/* =====================================================
        FASTING BASE TRACK
    ===================================================== */}
        <Circle
          cx={center}
          cy={center}
          r={ringRadius}
          fill="none"
          stroke="#19201C"
          strokeWidth={strokeWidth}
        />
        {/* =====================================================
        FASTING SEGMENTS
    ===================================================== */}
        {normalizedSegments.map((segment, index) => (
          <TimelineSegmentItem
            index={index}
            key={segment.id}
            segment={segment}
            center={center}
            ringRadius={ringRadius}
            strokeWidth={strokeWidth}
            animationDuration={animationDuration}
            animated={animated}
          />
        ))}
        {/* =====================================================
        0H / 24H CUT
    ===================================================== */}
        {/**
         * Vạch cắt được đặt TRÊN arc.
         *
         * Điều này cực kỳ quan trọng:
         *
         * Nếu đặt dưới arc thì segment 20→24
         * vẫn có thể visually merge với 0→16.
         */}
        <Line
          x1={boundaryInner.x}
          y1={boundaryInner.y}
          x2={boundaryOuter.x}
          y2={boundaryOuter.y}
          stroke="#ff0000aa"
          strokeWidth={4}
          strokeLinecap="round"
        />
        {/* Boundary dot */}
        <Circle
          cx={boundaryOuter.x}
          cy={boundaryOuter.y}
          r={2.5}
          fill="#ff0000"
        />
        {/* =====================================================
        CENTER VALUE
    ===================================================== */}
        <SvgText
          x={center}
          y={center - 8}
          fill="#FFFFFF"
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
          fill="#717873"
          fontSize={9}
          fontWeight="600"
          letterSpacing={1.2}
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          HOURS FASTED
        </SvgText>
      </Svg>

      {/* =======================================================
      LOADING
  ======================================================= */}
      {isLoading && (
        <View className="absolute inset-0 items-center justify-center">
          <View className="w-10 h-10 rounded-full bg-zinc-900/90 items-center justify-center">
            <ActivityIndicator size="small" color="#34D399" />
          </View>
        </View>
      )}
    </View>
  );
}
