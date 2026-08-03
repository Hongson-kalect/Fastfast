import { useAppStore } from "@/stores/appStore";
import React, { useEffect } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { ThemedText } from "./themed-text";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface CircularProgressProps {
  /**
   * Outer size of the circle
   * @default 160
   */
  size?: number;

  /**
   * Radius of circle.
   * If provided, size will be ignored.
   */
  radius?: number;

  /**
   * Progress (0-100)
   */
  value: number;

  /**
   * Active stroke
   * @default "#3B82F6"
   */
  strokeColor?: string;

  /**
   * @default 12
   */
  strokeWidth?: number;

  /**
   * Inactive stroke
   * @default "#E5E7EB"
   */
  inactiveStrokeColor?: string;

  /**
   * @default strokeWidth
   */
  inactiveStrokeWidth?: number;

  /**
   * Text above value
   */
  title?: React.ReactNode;

  /**
   * Text below value
   */
  prefix?: React.ReactNode;

  /**
   * Replace the whole center content
   */
  renderCenter?: (value: number, animatedValue: number) => React.ReactNode;

  /**
   * Enable animation
   * @default true
   */
  animation?: boolean;

  /**
   * Animation duration
   * @default 600
   */
  duration?: number;

  style?: StyleProp<ViewStyle>;
}

export default function CircularProgress({
  size = 44,
  radius,
  value,

  strokeColor,
  strokeWidth = 5,

  inactiveStrokeColor = "#FFFFFF22",
  inactiveStrokeWidth,

  title,
  prefix,
  renderCenter,

  animation = true,
  duration = 600,

  style,
}: CircularProgressProps) {
  const { theme } = useAppStore();
  const r = radius ?? (size - strokeWidth) / 2;
  const actualSize = radius ? radius * 2 + strokeWidth : size;

  const circumference = 2 * Math.PI * r;

  const progress = useSharedValue(0);

  const [displayValue, setDisplayValue] = React.useState(0);

  useEffect(() => {
    const target = Math.min(100, Math.max(0, value));

    if (!animation) {
      progress.value = target;
      setDisplayValue(target);
      return;
    }

    progress.value = withTiming(target, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [value]);

  useAnimatedReaction(
    () => Math.round(progress.value),
    (v) => {
      runOnJS(setDisplayValue)(v);
    },
  );

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value / 100),
  }));

  return (
    <View
      style={[
        {
          width: actualSize,
          height: actualSize,
        },
        style,
      ]}
    >
      <Svg width={actualSize} height={actualSize}>
        <Defs>
          <LinearGradient
            id="progressGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <Stop
              offset="0%"
              stopColor={strokeColor || theme.primary}
              stopOpacity={1}
            />
            <Stop
              offset="100%"
              stopColor={strokeColor || theme.primary}
              stopOpacity={1}
            />
          </LinearGradient>
        </Defs>

        <Circle
          cx={actualSize / 2}
          cy={actualSize / 2}
          r={r}
          stroke={inactiveStrokeColor}
          strokeWidth={inactiveStrokeWidth || strokeWidth - 1}
          fill="none"
        />

        <AnimatedCircle
          cx={actualSize / 2}
          cy={actualSize / 2}
          r={r}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${actualSize / 2},${actualSize / 2}`}
        />
      </Svg>

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.center}>
          {renderCenter ? (
            renderCenter(value, displayValue)
          ) : (
            <>
              {title ? (
                <ThemedText style={styles.title}>{title}</ThemedText>
              ) : null}

              <ThemedText style={styles.value}>{displayValue}</ThemedText>

              {prefix ? (
                <ThemedText style={styles.prefix}>{prefix}</ThemedText>
              ) : null}
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 14,
    marginBottom: 4,
  },

  value: {
    fontSize: 16,
    fontWeight: "600",
  },

  prefix: {
    marginTop: 4,
    fontSize: 14,
  },
});
