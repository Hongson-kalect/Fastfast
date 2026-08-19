import { StreakCheckResult } from "@/interfaces/home.type";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import {
  AntDesign,
  Feather,
  FontAwesome5,
  Foundation,
} from "@expo/vector-icons";
import { useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInUp, ZoomIn } from "react-native-reanimated";

interface Props {
  data: StreakCheckResult | null;
}

export const MILESTONES = [3, 7, 14, 21, 30, 60, 90, 100, 180, 365];

const MODAL_THEME = {
  STREAK_MILESTONE: {
    icon: "🎉",
    title: "Streak Milestone Hit!",
    subtitle: "You're building an unstoppable fasting habit!",
    bgColor: "from-orange-500/20 to-amber-500/10",
    borderColor: "border-orange-500/30",
    btnText: "Keep It Up! 🔥",
  },
  SHIELD_USED: {
    icon: "🛡️",
    title: "Rest Day Active!",
    subtitle: "Recovery is part of the journey. Your streak stays strong!",
    bgColor: "from-indigo-500/20 to-blue-500/10",
    borderColor: "border-indigo-500/30",
    btnText: "Keep going! 🌿",
  },
  STREAK_LOST: {
    icon: "💪",
    title: "Fresh Start Ahead",
    subtitle: "Every master failed before succeeding. Let's rebuild today!",
    bgColor: "from-red-500/20 to-zinc-900",
    borderColor: "border-red-500/30",
    btnText: "Start Fresh Now 🚀",
  },
};
export const StreakCheckModal = ({ data }: Props) => {
  if (!data) return null;
  const { theme } = useAppStore();
  const { setGlobalModal } = useModalStore();

  const onClose = () => setGlobalModal(null);

  // 1. Xác định Status chính xác
  const status = useMemo<keyof typeof MODAL_THEME>(() => {
    if (data.streak.current < data.streak.previous) {
      return "STREAK_LOST";
    }
    if (data.shield.current < data.shield.previous) {
      return "SHIELD_USED";
    }
    return "STREAK_MILESTONE";
  }, [data]);

  const milestone = useMemo(()=>{
    return MILESTONES.find((milestone) => data.streak.previous<milestone && milestone<=data.streak.current);
  },[data])

  // 2. Check phá kỷ lục
  const isBestRecord = useMemo(() => {
    return (
      data.streak.current > 1 &&
      data.streak.current >= (data.streak.max || 0) &&
      status !== "STREAK_LOST"
    );
  }, [data, status]);

  // 3. Tính toán nhảy Streak
  const streakDiff = data.streak.current - data.streak.previous;
  const isStreakJump = streakDiff > 1 && status !== "STREAK_LOST";

  // 4. Tính toán biến động Shield
  const shieldDiff = data.shield.previous - data.shield.current;
  const isShieldDecreased = shieldDiff > 0;

  const config = MODAL_THEME[status];

  // 5. Dynamic Color
  const color = useMemo(() => {
    if (status === "STREAK_LOST") return theme.error || "#ef4444";
    if (status === "SHIELD_USED") return theme.secondary || "#6366f1";
    return theme.primary || "#f97316";
  }, [status, theme]);

  return (
    <View className="relative py-2">
      {/* 🛡️ TOP RIGHT: SHIELD STATUS */}
      <View className="absolute top-0 right-0 z-10">
        <View className="flex-row items-center rounded-full border border-indigo-400/15 bg-indigo-500/10 px-2.5 py-1">
          <FontAwesome5 name="shield-alt" size={12} color={theme.primary} />
          <View className="flex-row">
            <Text className="font-bold text-[10px] text-primary">
              {data.shield.current}
            </Text>
            {data.shield.previous != data.shield.current && (
              <Text className="font-light text-[10px] text-error">
                (-{data.shield.previous - data.shield.current})
              </Text>
            )}
            <Text className="ml-1 text-[10px] font-bold text-primary">/3</Text>
          </View>
        </View>
      </View>

      {/* --- HERO SECTION --- */}
      <Animated.View
        entering={ZoomIn.delay(100).springify()}
        className="mt-7 items-center"
      >
        {/* STREAK DISPLAY */}
        <View className="w-full items-center">
          {data.streak.current - data.streak.previous > 1 && (
            <View className="absolute left-4 bottom-4 flex-row items-center gap-1 opacity-70">
              <Text className="text-white font-bold text-lg">
                {data.streak.previous}
              </Text>
              <View
                style={{ transform: [{ rotate: "-15deg" }], marginBottom: 3 }}
              >
                <Feather name="arrow-right" size={24} color={theme.white} />
              </View>
            </View>
          )}

          <View className="relative items-center justify-center px-8">
            {/* BEST STAMP */}
            {isBestRecord && (
              <View
                className="absolute right-0 top-0 z-10"
                style={{ transform: [{ rotate: "30deg" }] }}
              >
                <Animated.View
                  entering={ZoomIn.delay(280)
                    .springify()
                    .damping(18)
                    .stiffness(180)
                    .mass(1)}
                >
                  <View className="h-10 w-10 items-center justify-center rounded-full border-2 border-amber-400/80 bg-amber-500/15">
                    <View className="absolute inset-1 rounded-full border border-amber-400/40" />
                    <Text className="text-[7px] font-black tracking-widest text-amber-300">
                      BEST
                    </Text>
                  </View>
                </Animated.View>
              </View>
            )}

            {/* Main Streak Number */}
            <Text className="text-8xl font-black leading-[0.9] tracking-tighter text-white">
              {data.streak.current}
            </Text>

            {/* Identity Label */}
          </View>
        </View>
        <View className="items-center">
          <Text className="mt-1 text-[9px] font-bold uppercase tracking-[0.28em] text-orange-400/80">
            DAYS STREAK
          </Text>
        </View>

        {/* TITLE */}
        <View className="mt-5 flex-row items-center justify-center">
          <Text className="text-base">{config.icon}</Text>
          <Text className="mx-2 text-center text-lg font-black text-white">
            {milestone ?"Streak over "+milestone+" Hits!":config.title}
          </Text>
          <Text className="text-base" style={{ transform: [{ scaleX: -1 }] }}>
            {config.icon}
          </Text>
        </View>

        {/* SUBTITLE */}
        <Text className="mt-1.5 px-8 text-center text-xs leading-5 text-zinc-400">
          {data.message?.subtitle || config.subtitle}
        </Text>
      </Animated.View>

      {/* --- STATS SECTION --- */}
      <Animated.View
        entering={FadeInUp.delay(200)}
        className="mt-7 flex-row gap-x-3"
      >
        {/* HABIT PANEL */}
        <View className="flex-1 items-center justify-between rounded-2xl border border-white/5 bg-zinc-800/50 px-3 py-3">
          <View className="mb-1.5 flex-row items-center self-start">
            <Foundation name="graph-trend" size={14} color={theme.success} />
            <Text className="ml-1 text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
              Habit
            </Text>
          </View>

          <View className="my-1 items-center">
            <Text className="text-2xl font-black text-success">
              {data.habit.currentPercent}%
            </Text>
          </View>

          {data.habit.currentPercent !== data.habit.previousPercent ? (
            <Text
              className={`mt-0.5 text-[9px] font-medium ${
                data.habit.currentPercent >= data.habit.previousPercent
                  ? "text-success/80"
                  : "text-error/80"
              }`}
            >
              {data.habit.currentPercent >= data.habit.previousPercent
                ? "▲"
                : "▼"}{" "}
              {Math.abs(data.habit.currentPercent - data.habit.previousPercent)}
              %
            </Text>
          ) : (
            <Text className="mt-0.5 text-[8px] uppercase tracking-wide text-zinc-600">
              Consistency
            </Text>
          )}
        </View>

        {/* RETAIN PANEL */}
        <View className="flex-1 items-center justify-between rounded-2xl border border-white/5 bg-zinc-800/50 px-3 py-3">
          <View className="mb-1.5 flex-row items-center self-start">
            <AntDesign name="redo" size={14} color={theme.warning} />
            <Text className="ml-1 text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
              Retain
            </Text>
          </View>

          <View className="my-1 items-center">
            <Text className="text-2xl font-black text-warning">
              {data.retain.current}
            </Text>
          </View>

          {data.retain.current !== data.retain.previous ? (
            <Text
              className={`text-[9px] font-medium ${
                data.retain.current >= data.retain.previous
                  ? "text-success/80"
                  : "text-error/80"
              }`}
            >
              {data.retain.current >= data.retain.previous ? "+" : "-"}
              {Math.abs(data.retain.current - data.retain.previous)} pts
            </Text>
          ) : (
            <Text className="mt-0.5 text-[8px] uppercase tracking-wide text-zinc-600">
              Points
            </Text>
          )}
        </View>
      </Animated.View>

      {/* --- ACTION BUTTON --- */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onClose}
        style={{ backgroundColor: color, boxShadow: "0px 4px 8px " + color }}
        className="mt-6 items-center justify-center rounded-2xl py-3.5"
      >
        <Text className="text-sm font-bold text-white">{config.btnText}</Text>
      </TouchableOpacity>
    </View>
  );
};
