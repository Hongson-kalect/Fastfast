import { StreakCheckResult } from "@/interfaces/home.type";
import useModalStore from "@/stores/modalStore";
import { useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInUp, ZoomIn } from "react-native-reanimated";

interface Props {
  data: StreakCheckResult | null;
}

const MODAL_THEME = {
  STREAK_MAINTAINED: {
    icon: "🔥",
    title: "Streak Maintained!",
    bgColor: "from-orange-500/20 to-amber-500/10",
    borderColor: "border-orange-500/30",
    btnBg: "bg-orange-500",
    btnText: "text-black",
  },
  SHIELD_USED: {
    icon: "🛡️",
    title: "Shield Saved Your Streak!",
    bgColor: "from-indigo-500/20 to-blue-500/10",
    borderColor: "border-indigo-500/30",
    btnBg: "bg-indigo-500",
    btnText: "text-white",
  },
  STREAK_LOST: {
    icon: "💔",
    title: "Streak Reset",
    bgColor: "from-red-500/20 to-zinc-900",
    borderColor: "border-red-500/30",
    btnBg: "bg-zinc-800",
    btnText: "text-white",
  },
};

export const StreakCheckModal = ({ data }: Props) => {
  if (!data || data.status === "ALREADY_CHECKED") return null;
  const { setGlobalModal } = useModalStore();
  const onClose = () => setGlobalModal(null);
  const status = useMemo<keyof typeof MODAL_THEME>(() => {
    if (data.streak.current <= data.streak.previous) return "STREAK_LOST";
    if (data.shield.current <= data.shield.previous) return "SHIELD_USED";
    return "STREAK_MAINTAINED";
  }, []);

  const config = MODAL_THEME[status] || MODAL_THEME.STREAK_MAINTAINED;

  return (
    <View>
      {/* Header Icon */}
      <Animated.View entering={ZoomIn.delay(100)} className="items-center">
        <View className="mb-3 h-20 w-20 items-center justify-center rounded-3xl bg-zinc-800/80 border border-white/10 shadow-inner">
          <Text className="text-4xl">{config.icon}</Text>
        </View>

        <Text className="text-center text-xl font-black text-white">
          {config.title}
        </Text>
        <Text className="mt-1 text-center text-xs text-zinc-400 px-2">
          {data.message?.subtitle}
        </Text>
      </Animated.View>

      {/* Dynamic Content Details */}
      <Animated.View entering={FadeInUp.delay(200)} className="mt-5 space-y-2">
        {/* STREAK COUNTER DISPLAY */}
        <View className="flex-row items-center justify-between rounded-2xl bg-zinc-950/70 p-4 border border-zinc-800/80">
          <View className="flex-row items-center">
            <Text className="mr-2 text-lg">🔥</Text>
            <Text className="text-xs font-semibold text-zinc-400">
              Current Streak
            </Text>
          </View>
          <View className="flex-row items-baseline">
            <Text className="text-2xl font-black text-orange-400">
              {data.streak.current}
            </Text>
            <Text className="ml-1 text-xs text-zinc-500">days</Text>
          </View>
        </View>

        {/* SHIELD STATUS (Neu dung Shield) */}
        {status === "SHIELD_USED" && (
          <View className="rounded-2xl bg-indigo-500/10 p-3.5 border border-indigo-500/20 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Text className="mr-2 text-base">🛡️</Text>
              <Text className="text-xs text-indigo-200">Shield Consumed</Text>
            </View>
            <Text className="text-xs font-bold text-indigo-300">
              {data.shield.previous} ➔ {data.shield.current} left
            </Text>
          </View>
        )}

        {/* STREAK LOST / RETAIN PENALTY (Neu mat Streak) */}
        {status === "STREAK_LOST" && (
          <View className="rounded-2xl bg-red-500/10 p-3.5 border border-red-500/20">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-red-300">Retain Circle Lost</Text>
              <Text className="text-xs font-bold text-red-400">
                -{data.retain.previous - data.retain.current}
              </Text>
            </View>
            <Text className="mt-1 text-[10px] text-zinc-500">
              Don't worry! Start a new fast today to rebuild your habit.
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Action Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onClose}
        className={`mt-6 rounded-2xl ${config.btnBg} py-3.5 items-center justify-center shadow-lg`}
      >
        <Text className={`text-sm font-bold ${config.btnText}`}>
          {status === "STREAK_LOST" ? "Keep Going" : "Awesome!"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
