import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { hourFormat } from "@/util/timer";
import { FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInUp, ZoomIn } from "react-native-reanimated";

export type FastResultStatus = "COMPLETED" | "ENDED_EARLY" | "OVERACHIEVED";

export interface FastResultData {
  fastingTime: number;
  targetHours: number | null;
  habitPercent: number; // VD: 92
  habitDiff: number; // VD: 3.4
  shields: {
    current: number;
    max: number;
    gained: number; // VD: 1 hoặc 0
  };
  retainCount: number;
  retainDiff: number;
  note?: string; // VD: "Gain 2 shields for 72 hours fast"
}

const testData: FastResultData = {
  fastingTime: (18 * 3600 + 45 * 60) * 1000,
  targetHours: 18,
  habitPercent: 92,
  habitDiff: 3.4,
  retainDiff: 1,
  shields: {
    current: 1,
    max: 2,
    gained: 1,
  },
  retainCount: 1,
};

interface Props {
  data?: FastResultData;
}

const STATUS_CONFIG = {
  COMPLETED: {
    title: "Fast Completed!",
    subtitle: "Great job maintaining your discipline!",
    badgeBg: "bg-emerald-500/15 border-emerald-500/30",
    badgeText: "text-emerald-400",
    icon: "🎉",
    barColor: ["#34D399", "#10B981"] as const,
  },
  ENDED_EARLY: {
    title: "Fast Ended Early",
    subtitle: "Every hour counts! Progress has been saved.",
    badgeBg: "bg-amber-500/15 border-amber-500/30",
    badgeText: "text-amber-400",
    icon: "⚡",
    barColor: ["#FBBF24", "#F59E0B"] as const,
  },
  OVERACHIEVED: {
    title: "Extended Fast Completed!",
    subtitle: "Outstanding endurance! Extra rewards unlocked.",
    badgeBg: "bg-purple-500/15 border-purple-500/30",
    badgeText: "text-purple-400",
    icon: "🏆",
    barColor: ["#A78BFA", "#8B5CF6"] as const,
  },
};

export const ResultModal = ({ data = testData }: Props) => {
  //   if (!data) return null;

  const { setGlobalModal } = useModalStore();

  const { fastingTime, status } = useMemo<{
    fastingTime: string;
    status: FastResultStatus;
  }>(() => {
    const returnData: { fastingTime: string; status: FastResultStatus } = {
      fastingTime: hourFormat(data.fastingTime),
      status: "COMPLETED",
    };
    const fastingHour = data.fastingTime / 3600;
    if (!data.targetHours || fastingHour > data.targetHours) {
      returnData.status = "COMPLETED";
    } else returnData.status = "ENDED_EARLY";
    return returnData;
  }, [data]);

  const config = STATUS_CONFIG[status];
  const progressRatio = data.targetHours
    ? Math.min(1, data.fastingTime / 3600 / data.targetHours)
    : 1;
  const { theme } = useAppStore();

  return (
    <View>
      {/* Header Icon */}
      <Animated.View
        entering={ZoomIn.delay(100)}
        className="align-center items-center"
      >
        <View className="mb-3 h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/80 border border-white/10">
          <Text className="text-3xl">{config.icon}</Text>
        </View>

        <Text className="text-center text-xl font-bold text-white">
          {config.title}
        </Text>
        <Text className="mt-1 text-center text-xs text-zinc-400">
          {config.subtitle}
        </Text>
      </Animated.View>

      {/* Fasting Time & Progress */}
      <Animated.View
        entering={FadeInUp.delay(200)}
        className="mt-5 rounded-2xl bg-zinc-950/60 p-4 border border-zinc-800/60"
      >
        <View className="flex-row items-baseline justify-between mb-2">
          <Text className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Fasting Time
          </Text>
          <Text className="text-2xl font-black text-white">{fastingTime}</Text>
        </View>

        {/* Progress Bar */}
        <View className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
          <LinearGradient
            colors={config.barColor}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{
              width: `${progressRatio * 100}%`,
              height: "100%",
              borderRadius: 999,
            }}
          />
        </View>
        {data.targetHours && (
          <Text className="mt-1.5 text-right text-[11px] text-zinc-500">
            Target: {data.targetHours}h ({Math.floor(progressRatio * 100)}%)
          </Text>
        )}
      </Animated.View>

      {/* Metrics Grid */}
      <Animated.View
        entering={FadeInUp.delay(300)}
        className="mt-4 flex-row gap-2"
      >
        {/* Habit Score */}
        <View className="flex-1 rounded-2xl bg-zinc-950/60 p-3 border border-zinc-800/60 items-center">
          <Text className="text-[11px] text-zinc-400">Habit</Text>
          <Text className="mt-1 text-base font-bold text-white">
            {data.habitPercent.toFixed(1)}%
          </Text>
          {data.habitDiff > 0 && (
            <Text className="text-[10px] text-success font-semibold">
              +{data.habitDiff.toFixed(1)}%
            </Text>
          )}
        </View>

        {/* Shield */}
        <View className="flex-1 rounded-2xl bg-zinc-950/60 p-3 border border-zinc-800/60 items-center">
          <Text className="text-[11px] text-zinc-400">Shield</Text>
          <Text className="mt-1 text-base font-bold text-white">
            <FontAwesome5 name="shield-alt" size={14} color={theme.primary} />{" "}
            {data.shields.current}/{data.shields.max}
          </Text>
          {data.shields.gained > 0 ? (
            <Text className="text-[10px] text-success font-semibold">
              +{data.shields.gained}
            </Text>
          ) : null}
        </View>

        {/* Retain */}
        <View className="flex-1 rounded-2xl bg-zinc-950/60 p-3 border border-zinc-800/60 items-center">
          <Text className="text-[11px] text-zinc-400">Retain</Text>
          <Text className="mt-1 text-base font-bold text-white">0</Text>
          {data.retainDiff > 0 && (
            <Text className="text-[10px] text-success font-semibold">
              +{data.retainDiff}%
            </Text>
          )}
        </View>
      </Animated.View>

      {/* Note / Reward Banner */}
      {data.note && (
        <Animated.View
          entering={FadeInUp.delay(400)}
          className="mt-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-3 py-2 flex-row items-center"
        >
          <Text className="mr-2 text-xs">💡</Text>
          <Text className="flex-1 text-xs text-indigo-300 font-medium">
            {data.note}
          </Text>
        </Animated.View>
      )}

      {/* Confirm Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setGlobalModal(null)}
        className="mt-6 rounded-2xl bg-primary py-3.5 items-center justify-center"
      >
        <Text className="font-bold text-white">OK</Text>
      </TouchableOpacity>
    </View>
  );
};
