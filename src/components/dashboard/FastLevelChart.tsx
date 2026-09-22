import { useAppStore } from "@/stores/appStore";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
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

const FastLevelItem = ({
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

  const percentage = useMemo(() => {
    if (maxCount === 0) return 0;
    return count / maxCount;
  }, [count, maxCount]);

  useEffect(() => {
    progress.value = 0;

    progress.value = withDelay(
      index * 90,
      withTiming(percentage, {
        duration: 700,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [percentage]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: trackWidth * progress.value,
  }));

  return (
    <View className="mb-4">
      {/* Header */}
      <View
        style={{ opacity: count ? 1 : 0.5 }}
        className="mb-1 flex-row items-center justify-between"
      >
        <View className="flex-row items-center">
          <View
            style={{ backgroundColor: colors[0] }}
            className="mr-2 h-3 w-3 rounded-full"
          />

          <ThemedText size="sm" weight="bold" color="text">
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

        <View className="flex-row items-center">
          <ThemedText size="sm" weight="semibold" color="text">
            {count}
            <ThemedText
              size="xs"
              weight="regular"
              color="text"
              opacity="medium"
            >
              {" "}
              times
            </ThemedText>
          </ThemedText>

          <ThemedText
            size="xs"
            color="text"
            opacity="medium"
            style={{ marginLeft: 8, width: 32, textAlign: "center" }}
          >
            {allCount > 0 ? Math.round((count / allCount) * 100) : 0}%
          </ThemedText>
        </View>
      </View>

      {/* Track */}
      <View
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width - 4)}
        className="h-4 overflow-hidden rounded-full bg-background2 p-0.5"
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
              colors={[theme.primary + "AA", theme.primary]}
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
};

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
  const allCount = levels.reduce((sum, item) => sum + item.count, 0);

  const total = levels.reduce((sum, item) => sum + item.count, 0);

  return (
    <View className="mt-5">
      {/* Header */}
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-1 mr-3">
          <ThemedText size="md" weight="bold" color="text">
            Fast Distribution
          </ThemedText>

          <ThemedText
            size="xs"
            color="text"
            opacity="medium"
            style={{ marginTop: 4 }}
          >
            Distribution of your fasting sessions
          </ThemedText>
        </View>

        <View
          className="rounded-xl px-3 py-1 items-center"
          style={{
            backgroundColor: theme.primary + "18",
          }}
        >
          <ThemedText size="lg" weight="bold" color="primary">
            {total}
          </ThemedText>

          <ThemedText size="xxs" color="text" opacity="medium">
            Total
          </ThemedText>
        </View>
      </View>

      {/* Card */}
      <View
        className="rounded-3xl p-5"
        style={{
          backgroundColor: theme.background2 + "B3",
          borderWidth: 1,
          borderColor: theme.text + "12",
        }}
      >
        {levels.map((item, index) => (
          <FastLevelItem
            key={item.label}
            index={index}
            label={item.label}
            count={item.count}
            maxCount={maxCount}
            allCount={allCount}
            // badge={item?.badge}
            colors={LEVEL_COLORS[index]}
          />
        ))}
      </View>
    </View>
  );
};
