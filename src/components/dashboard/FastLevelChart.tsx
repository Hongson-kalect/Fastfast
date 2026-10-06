import { useAppStore } from "@/stores/appStore";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { ThemedText } from "../themed-text";

interface FastCount {
  above_16: number;
  above_20: number;
  above_24: number;
  above_36: number;
  above_48: number;
  above_72: number;
}

interface Props {
  fastStatistics: FastCount;
}

const LEVEL_COLORS = [
  ["#60A5FA", "#3B82F6"],
  ["#34D399", "#10B981"],
  ["#FBBF24", "#F59E0B"],
  ["#FB923C", "#F97316"],
  ["#F87171", "#EF4444"],
  ["#A78BFA", "#8B5CF6"],
] as const;

const FastLevelItem = React.memo(
  ({
    label,
    count,
    maxCount,
    allCount,
    badge,
    colors,
    index,
  }: {
    label: string;
    count: number;
    maxCount: number;
    allCount: number;
    badge?: string;
    colors: readonly [string, string];
    index: number;
  }) => {
    const [trackWidth, setTrackWidth] = useState(0);
    const { theme } = useAppStore();

    const progress = useSharedValue(0);

    const percentage = maxCount === 0 ? 0 : count / maxCount;
    useEffect(() => {
      progress.value = 0;

      progress.value = withDelay(
        index * 90,
        withTiming(percentage, {
          duration: 700,
          easing: Easing.out(Easing.cubic),
        }),
      );
    }, [percentage, index]);

    const animatedStyle = useAnimatedStyle(() => ({
      width: trackWidth * progress.value,
    }));

    return (
      <View className="mb-4">
        <View
          style={{ opacity: count ? 1 : 0.6 }}
          className="mb-1.5 flex-row items-center justify-between"
        >
          <View className="min-w-0 flex-1 flex-row items-center">
            <View
              className="mr-2 h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: colors[0] }}
            />

            <ThemedText
              size="sm"
              weight="semibold"
              color="text"
              numberOfLines={1}
            >
              {label}
            </ThemedText>

            {badge && (
              <View className="ml-2 rounded-full bg-text-base/10 px-2 py-0.5">
                <ThemedText size="xxs" color="text" opacity="medium">
                  {badge}
                </ThemedText>
              </View>
            )}
          </View>

          <View className="ml-3 flex-row items-center">
            <ThemedText size="sm" weight="bold" color="title">
              {count}
            </ThemedText>

            <ThemedText
              size="xxs"
              color="text"
              opacity="low"
              className="mx-1.5"
            >
              ·
            </ThemedText>

            <ThemedText
              size="xxs"
              weight="semibold"
              color="text"
              opacity="medium"
            >
              {allCount > 0 ? Math.round((count / allCount) * 100) : 0}%
            </ThemedText>
          </View>
        </View>

        <View
          onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
          className="h-2 overflow-hidden rounded-full bg-text-base/10"
        >
          {trackWidth > 0 && (
            <Animated.View
              style={[
                animatedStyle,
                {
                  height: "100%",
                  overflow: "hidden",
                  borderRadius: 999,
                },
              ]}
            >
              <LinearGradient
                colors={[theme.primary + "70", theme.primary]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{
                  flex: 1,
                  borderRadius: 999,
                }}
              />
            </Animated.View>
          )}
        </View>
      </View>
    );
  },
);

export const FastLevelBarChart = ({ fastStatistics }: Props) => {
  const { theme } = useAppStore();
  const levels = [
    {
      label: "16-20 hrs",
      count: fastStatistics.above_16,
    },
    {
      label: "20-24 hrs",
      count: fastStatistics.above_20,
    },
    {
      label: "24-36 hrs",
      count: fastStatistics.above_24,
      //   badge: "🔥",
    },
    {
      label: "36-48 hrs",
      count: fastStatistics.above_36,
      //   badge: "⚡",
    },
    {
      label: "48-72 hrs",
      count: fastStatistics.above_48,
      //   badge: "👑",
    },
    {
      label: "72+ hrs",
      count: fastStatistics.above_72,
      //   badge: "🏆",
    },
  ];

  const maxCount = Math.max(...levels.map((i) => i.count), 1);

  const total = levels.reduce((sum, item) => sum + item.count, 0);

  return (
    <View className="mt-5">
      {/* Header */}
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-1">
          <ThemedText size="md" weight="bold" color="title">
            Fast Distribution
          </ThemedText>

          <ThemedText size="xxs" color="text" opacity="low" className="mt-0.5">
            Distribution of your fasting sessions
          </ThemedText>
        </View>

        <View className="ml-3 flex-row items-baseline gap-1">
          <ThemedText size="xl" weight="bold" color="primary">
            {total}
          </ThemedText>

          <ThemedText size="xxs" color="text" opacity="half">
            fasts
          </ThemedText>
        </View>
      </View>

      <View className="gap-1">
        {levels.map((item, index) => (
          <FastLevelItem
            key={item.label}
            index={index}
            label={item.label}
            count={item.count}
            maxCount={maxCount}
            allCount={total}
            colors={LEVEL_COLORS[index]}
          />
        ))}
      </View>
    </View>
  );
};
