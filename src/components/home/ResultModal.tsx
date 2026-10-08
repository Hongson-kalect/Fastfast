import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { fixed } from "@/util/numberLimit";
import { hourFormat } from "@/util/timer";
import { FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInUp, ZoomIn } from "react-native-reanimated";
import { ThemedText } from "../themed-text";

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
    detail: number[] | null;
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
    detail: null,
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
  const { closeCurrentModal } = useModalStore();
  const { theme } = useAppStore();

  const fastingHours = data.fastingTime / 3600;
  const isCompleted =
    !data.targetHours || fastingHours >= data.targetHours;

  const status: FastResultStatus = isCompleted
    ? "COMPLETED"
    : "ENDED_EARLY";

  const fastingTime = hourFormat(data.fastingTime);
  const config = STATUS_CONFIG[status];

  const progressRatio = data.targetHours
    ? Math.min(1, fastingHours / data.targetHours)
    : 1;

  const progressPercent = Math.floor(progressRatio * 100);

  const shieldDetails = data.shields.detail ?? [];

  return (
    <View>
      {/* Header */}
      <Animated.View
        entering={ZoomIn.delay(100)}
        className="items-center"
      >
        <View className="mb-3 h-16 w-16 items-center justify-center rounded-2xl border border-primary/10 bg-primary/10">
          <Text className="text-3xl">
            {config.icon}
          </Text>
        </View>

        <ThemedText
          size="xl"
          weight="bold"
          color="title"
          style={{ textAlign: "center" }}
        >
          {config.title}
        </ThemedText>

        <ThemedText
          size="xs"
          color="text"
          opacity="medium"
          className="mt-1"
          style={{ textAlign: "center" }}
        >
          {config.subtitle}
        </ThemedText>
      </Animated.View>

      {/* Fasting Time */}
      <Animated.View
        entering={FadeInUp.delay(200)}
        className="mt-5 rounded-2xl border border-text-base/10 bg-background2/60 p-4"
      >
        <View className="mb-2 flex-row items-end justify-between">
          <ThemedText
            size="xxs"
            weight="semibold"
            color="text"
            opacity="medium"
            style={{
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Fasting time
          </ThemedText>

          <ThemedText
            size="xxl"
            weight="bold"
            color="title"
          >
            {fastingTime}
          </ThemedText>
        </View>

        <View className="h-2 overflow-hidden rounded-full bg-text-base/10">
          <LinearGradient
            colors={config.barColor}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{
              width: `${progressPercent}%`,
              height: "100%",
              borderRadius: 999,
            }}
          />
        </View>

        {data.targetHours ? (
          <ThemedText
            size="xxs"
            color="text"
            opacity="low"
            className="mt-1.5"
            style={{ textAlign: "right" }}
          >
            Target {data.targetHours}h · {progressPercent}%
          </ThemedText>
        ) : null}
      </Animated.View>

      {/* Metrics */}
      <Animated.View
        entering={FadeInUp.delay(300)}
        className="mt-3 flex-row gap-2"
      >
        {/* Habit */}
        <View className="flex-1 items-center rounded-2xl border border-text-base/10 bg-background2/60 p-3">
          <ThemedText
            size="xxs"
            color="text"
            opacity="medium"
          >
            Habit
          </ThemedText>

          <ThemedText
            size="md"
            weight="bold"
            color="title"
            className="mt-1"
          >
            {fixed(data.habitPercent)}%
          </ThemedText>

          {data.habitDiff > 0 ? (
            <ThemedText
              size="xxs"
              weight="semibold"
              color="success"
            >
              +{fixed(data.habitDiff)}%
            </ThemedText>
          ) : null}
        </View>

        {/* Shield */}
        <View className="flex-1 items-center rounded-2xl border border-text-base/10 bg-background2/60 p-3">
          <ThemedText
            size="xxs"
            color="text"
            opacity="medium"
          >
            Shield
          </ThemedText>

          <View className="mt-1 flex-row items-center">
            <FontAwesome5
              name="shield-alt"
              size={13}
              color={theme.primary}
            />

            <ThemedText
              size="md"
              weight="bold"
              color="title"
              className="ml-1"
            >
              {data.shields.current}/{data.shields.max}
            </ThemedText>
          </View>

          {data.shields.gained > 0 ? (
            <ThemedText
              size="xxs"
              weight="semibold"
              color="success"
            >
              +{data.shields.gained}
            </ThemedText>
          ) : null}
        </View>

        {/* Retain */}
        <View className="flex-1 items-center rounded-2xl border border-text-base/10 bg-background2/60 p-3">
          <ThemedText
            size="xxs"
            color="text"
            opacity="medium"
          >
            Retain
          </ThemedText>

          <ThemedText
            size="md"
            weight="bold"
            color="title"
            className="mt-1"
          >
            {data.retainCount}/25
          </ThemedText>

          {data.retainDiff > 0 ? (
            <ThemedText
              size="xxs"
              weight="semibold"
              color="success"
            >
              +{data.retainDiff}%
            </ThemedText>
          ) : null}
        </View>
      </Animated.View>

      {/* Shield rewards */}
      {shieldDetails.length > 0 ? (
        <View className="mt-4 rounded-2xl border border-primary/10 bg-primary/5 px-3 py-2.5">
          {shieldDetails.map((amount, index) => {
            if (!amount) return null;

            const labels = [
              "Fast dài",
              "Duy trì Habit",
              "Đạt milestone",
            ];

            return (
              <View
                key={`${index}-${amount}`}
                className="flex-row items-center py-1"
              >
                <View className="w-12 flex-row items-center">
                  <ThemedText
                    size="xs"
                    weight="bold"
                    color="success"
                  >
                    +{amount}
                  </ThemedText>

                  <FontAwesome5
                    name="shield-alt"
                    size={11}
                    color={theme.primary}
                    style={{ marginLeft: 4 }}
                  />
                </View>

                <ThemedText
                  size="xxs"
                  color="text"
                  opacity="medium"
                  className="ml-2"
                >
                  {labels[index]}
                </ThemedText>
              </View>
            );
          })}
        </View>
      ) : null}

      {/* Note */}
      {data.note ? (
        <Animated.View
          entering={FadeInUp.delay(400)}
          className="mt-3 flex-row items-center rounded-xl border border-warning/10 bg-warning/5 px-3 py-2.5"
        >
          <ThemedText size="sm">
            💡
          </ThemedText>

          <ThemedText
            size="xs"
            weight="medium"
            color="text"
            className="ml-2 flex-1"
          >
            {data.note}
          </ThemedText>
        </Animated.View>
      ) : null}

      {/* Confirm */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => closeCurrentModal()}
        className="mt-5 items-center justify-center rounded-2xl bg-primary py-3.5"
      >
        <ThemedText
          size="sm"
          weight="bold"
          colorHex="white"
        >
          OK
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
};