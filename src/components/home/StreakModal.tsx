import { StreakCheckResult } from "@/interfaces/home.type";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { fixed } from "@/util/numberLimit";
import {
  Feather,
  FontAwesome5,
  Foundation,
  Ionicons,
} from "@expo/vector-icons";
import { useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInUp, ZoomIn } from "react-native-reanimated";
import { ThemedText } from "../themed-text";

interface Props {
  data: StreakCheckResult | null;
}

export const MILESTONES = [3, 7, 14, 21, 30, 60, 90, 100, 180, 365];

const MODAL_THEME = {
  STREAK_MILESTONE: {
    icon: "🎉",
    title: "Streak Milestone Hit!",
    subtitle: "You're building an unstoppable fasting habit!",
    bgColor: "from-success/20 to-success",
    borderColor: "border-success/30",
    btnText: "Keep It Up! 🔥",
  },
  SHIELD_USED: {
    icon: "🛡️",
    title: "Rest Day Active!",
    subtitle: "Recovery is part of the journey. Your streak stays strong!",
    bgColor: "from-primary/20 to-primary/10",
    borderColor: "border-primary/30",
    btnText: "Keep going! 🌿",
  },
  STREAK_LOST: {
    icon: "💪",
    title: "Fresh Start Ahead",
    subtitle: "Every master failed before succeeding. Let's rebuild today!",
    bgColor: "from-error/20 to-error",
    borderColor: "border-error/30",
    btnText: "Start Fresh Now 🚀",
  },
};
export const StreakCheckModal = ({ data }: Props) => {
  const { theme } = useAppStore();
  const { closeCurrentModal } = useModalStore();

  if (!data) return null;

  const onClose = () => closeCurrentModal();

  const status: keyof typeof MODAL_THEME =
    data.streak.current < data.streak.previous
      ? "STREAK_LOST"
      : data.shield.current < data.shield.previous
        ? "SHIELD_USED"
        : "STREAK_MILESTONE";

  const milestone = MILESTONES.find(
    (value) =>
      data.streak.previous < value &&
      value <= data.streak.current,
  );

  const isBestRecord =
    data.streak.current > 1 &&
    data.streak.current >= (data.streak.max || 0) &&
    status !== "STREAK_LOST";

  const streakDiff =
    data.streak.current - data.streak.previous;

  const isStreakJump =
    streakDiff > 1 && status !== "STREAK_LOST";

  const habitDiff =
    data.habit.currentPercent -
    data.habit.previousPercent;

  const retainDiff =
    data.retain.current - data.retain.previous;

  const color =
    status === "STREAK_LOST"
      ? theme.error
      : status === "SHIELD_USED"
        ? theme.secondary
        : theme.primary;

  const config = MODAL_THEME[status];

  return (
    <View className="py-2">
      {/* Shield status */}
      <View className="absolute right-0 top-0 z-10">
        <View className="flex-row items-center gap-1 rounded-full border border-primary/10 bg-primary/5 px-2.5 py-1">
          <FontAwesome5
            name="shield-alt"
            size={11}
            color={theme.primary}
          />

          <ThemedText
            size="xxs"
            weight="bold"
            color="primary"
          >
            {data.shield.current}
          </ThemedText>

          {data.shield.previous !== data.shield.current ? (
            <ThemedText
              size="xxs"
              weight="medium"
              color="error"
            >
              -{data.shield.previous - data.shield.current}
            </ThemedText>
          ) : null}

          <ThemedText
            size="xxs"
            weight="bold"
            color="primary"
          >
            /3
          </ThemedText>
        </View>
      </View>

      {/* Hero */}
      <Animated.View
        entering={ZoomIn.delay(100).springify()}
        className="mt-7 items-center"
      >
        <View className="w-full items-center">
          {isStreakJump ? (
            <View className="absolute bottom-4 left-4 flex-row items-center gap-1 opacity-60">
              <ThemedText
                size="lg"
                weight="bold"
                color="text"
              >
                {data.streak.previous}
              </ThemedText>

              <Feather
                name="arrow-right"
                size={22}
                color={theme.text}
              />
            </View>
          ) : null}

          <View className="relative items-center px-8">
            {/* Best */}
            {isBestRecord ? (
              <View
                className="absolute right-0 top-0 z-10"
                style={{
                  transform: [{ rotate: "30deg" }],
                }}
              >
                <Animated.View
                  entering={ZoomIn.delay(280)
                    .springify()
                    .damping(18)
                    .stiffness(180)
                    .mass(1)}
                >
                  <View className="h-10 w-10 items-center justify-center rounded-full border-2 border-warning/60 bg-warning/10">
                    <View className="absolute inset-1 rounded-full border border-warning/30" />

                    <ThemedText
                      size="tiny"
                      weight="bold"
                      color="warning"
                    >
                      BEST
                    </ThemedText>
                  </View>
                </Animated.View>
              </View>
            ) : null}

            <ThemedText
              size="displayLarge"
              weight="bold"
              color="title"
              style={{
                lineHeight: 88,
                letterSpacing: -4,
              }}
            >
              {data.streak.current}
            </ThemedText>
          </View>
        </View>

        <ThemedText
          size="tiny"
          weight="bold"
          color="primary"
          className="mt-1"
          style={{
            textTransform: "uppercase",
            letterSpacing: 2.5,
            opacity: 0.8,
          }}
        >
          Days streak
        </ThemedText>

        {/* Title */}
        <View className="mt-5 flex-row items-center justify-center">
          <ThemedText size="sm">
            {config.icon}
          </ThemedText>

          <ThemedText
            size="lg"
            weight="bold"
            color="title"
            className="mx-2"
            style={{ textAlign: "center" }}
          >
            {milestone
              ? `Streak over ${milestone} hits!`
              : config.title}
          </ThemedText>

          <ThemedText
            size="sm"
            style={{
              transform: [{ scaleX: -1 }],
            }}
          >
            {config.icon}
          </ThemedText>
        </View>

        <ThemedText
          size="xs"
          color="text"
          opacity="medium"
          className="mt-1.5 px-8"
          style={{
            lineHeight: 20,
            textAlign: "center",
          }}
        >
          {data.message?.subtitle || config.subtitle}
        </ThemedText>
      </Animated.View>

      {/* Stats */}
      <Animated.View
        entering={FadeInUp.delay(200)}
        className="mt-7 flex-row gap-2.5"
      >
        {/* Habit */}
        <View className="flex-1 items-center rounded-2xl border border-text-base/10 bg-background2/60 px-3 py-3">
          <View className="mb-1.5 flex-row items-center self-start">
            <Foundation
              name="graph-trend"
              size={14}
              color={theme.success}
            />

            <ThemedText
              size="tiny"
              weight="semibold"
              color="text"
              opacity="medium"
              className="ml-1"
              style={{
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Habit
            </ThemedText>
          </View>

          <ThemedText
            size="xl"
            weight="bold"
            color="success"
          >
            {fixed(data.habit.currentPercent)}%
          </ThemedText>

          {habitDiff !== 0 ? (
            <ThemedText
              size="tiny"
              weight="medium"
              color={habitDiff > 0 ? "success" : "error"}
            >
              {habitDiff > 0 ? "▲" : "▼"}{" "}
              {fixed(Math.abs(habitDiff))}%
            </ThemedText>
          ) : (
            <ThemedText
              size="tiny"
              color="text"
              opacity="low"
              className="mt-0.5"
            >
              Consistency
            </ThemedText>
          )}
        </View>

        {/* Retain */}
        <View className="flex-1 items-center rounded-2xl border border-text-base/10 bg-background2/60 px-3 py-3">
          <View className="mb-1.5 flex-row items-center self-start">
            <Ionicons
              name="water"
              size={17}
              color={theme.primary}
            />

            <ThemedText
              size="tiny"
              weight="semibold"
              color="text"
              opacity="medium"
              className="ml-1"
              style={{
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Retain
            </ThemedText>
          </View>

          <ThemedText
            size="xl"
            weight="bold"
            color="primary"
          >
            {data.retain.current}
          </ThemedText>

          {retainDiff !== 0 ? (
            <ThemedText
              size="tiny"
              weight="medium"
              color={retainDiff > 0 ? "success" : "error"}
            >
              {retainDiff > 0 ? "+" : "-"}
              {fixed(Math.abs(retainDiff))} pts
            </ThemedText>
          ) : (
            <ThemedText
              size="tiny"
              color="text"
              opacity="low"
              className="mt-0.5"
            >
              Points
            </ThemedText>
          )}
        </View>
      </Animated.View>

      {/* Action */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onClose}
        className="mt-6 items-center justify-center rounded-2xl py-3.5"
        style={{
          backgroundColor: color,
          boxShadow: `0px 3px 6px ${color}40`,
        }}
      >
        <ThemedText
          size="sm"
          weight="bold"
          color="background"
        >
          {config.btnText}
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
};
