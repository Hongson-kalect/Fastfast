import { useAppStore } from "@/stores/appStore";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import Animated, {
    Easing,
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from "react-native-reanimated";

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
    <Animated.View
      entering={FadeInDown.delay(index * 70).springify()}
      className="mb-4 last:mb-0"
    >
      {/* Header */}
      <View
        style={{ opacity: count ? 1 : 0.5 }}
        className="mb-1 flex-row items-center justify-between"
      >
        <View className="flex-row items-center">
          <View
            style={{
              backgroundColor: colors[0],
            }}
            className="mr-2 h-3 w-3 rounded-full"
          />

          <Text className="text-white text-sm font-bold">{label}</Text>

          {badge && (
            <View className="ml-2 rounded-full bg-white/10 px-2 py-0.5">
              <Text className="text-[10px]">{badge}</Text>
            </View>
          )}
        </View>

        <View className="flex-row items-center">
          <Text className="text-white font-semibold text-sm">
            {count}
            <Text className="text-zinc-500 text-xs font-normal"> times</Text>
          </Text>

          <Text className="ml-2 w-8 text-center text-xs text-zinc-400">
            {Math.round((count / allCount) * 100)}%
          </Text>
        </View>
      </View>

      {/* Track */}
      <View
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width - 4)}
        className="h-4 overflow-hidden rounded-full bg-zinc-800 p-0.5"
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
              colors={[theme.primary + "aa", theme.primary]}
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
    </Animated.View>
  );
};

export const FastLevelBarChart = ({ fastStatistics }: Props) => {
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
        <View>
          <Text className="font-bold text-base! text-white">
            Fast Distribution
          </Text>

          <Text className="mt-1 text-xs! text-zinc-400">
            Distribution of your fasting sessions
          </Text>
        </View>

        <View className="rounded-xl bg-indigo-500/15 px-3 py-1">
          <Text className="text-center text-lg font-bold text-indigo-400">
            {total}
          </Text>
          <Text className="text-[11px] text-zinc-400">Total</Text>
        </View>
      </View>

      {/* Card */}
      <View className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
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
