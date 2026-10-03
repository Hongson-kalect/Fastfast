import { FASTING_TARGETS } from "@/constants/data";
import { FastSession, HabitLog } from "@/interfaces/db.type";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { fixed } from "@/util/numberLimit";
import { getLocalTodayStr } from "@/util/timer";
import { FontAwesome5 } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Pressable, View } from "react-native";
import { FastDetail } from "../fast_detail";
import { ThemedText } from "../themed-text";

interface HabitDetailModalProps {
  log?: HabitLog & FastSession;
  onClose?: () => void;
  // Helper format do bạn định nghĩa
  targetInfo?: (typeof FASTING_TARGETS)[0] | null;
}
export const HabitDetailModal = ({
  log,
  onClose,
  targetInfo,
}: HabitDetailModalProps) => {
  const { theme } = useAppStore();

  if (!log) return null;

  const isPositiveHabit = Number(log.habit_delta) >= 0;
  const isPositiveRetain = Number(log.retain_delta) >= 0;
  const isPositiveShield = Number(log.shield_delta) >= 0;

  const isShieldEvent =
    log.shield_delta !== undefined && log.shield_delta !== 0;

  const hasFastDetail = Boolean(
    log.duration || log.target_duration,
  );

  return (
    <View className="w-full">
      <Pressable onPress={(e) => e.stopPropagation()}>
        {/* Habit log */}
        <View className="gap-y-2">
          <View className="flex-row items-center justify-between">
            <ThemedText
              size="xs"
              weight="semibold"
              color="text"
              opacity="medium"
              style={{
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Habit Log
            </ThemedText>

            <ThemedText
              size="xs"
              weight="semibold"
              color="text"
              opacity="medium"
              style={{
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              {log.log_date
                ? getLocalTodayStr(new Date(log.log_date))
                : "N/A"}
            </ThemedText>
          </View>

          {/* Habit / Retain / Shield */}
          <View className="flex-row items-center justify-between rounded-xl border border-text-base/5 bg-background2/40 p-3">
            {/* Habit */}
            <View className="flex-1 items-center">
              <ThemedText
                size="xxs"
                color="text"
                opacity="medium"
              >
                Điểm Habit
              </ThemedText>

              <ThemedText
                size="sm"
                weight="bold"
                color="success"
                className="mt-1"
              >
                {fixed(log.habit_snap ?? 0)}%
              </ThemedText>

              {log.habit_delta ? (
                <ThemedText
                  size="xs"
                  weight="medium"
                  color={isPositiveHabit ? "success" : "error"}
                >
                  {isPositiveHabit ? "▲" : "▼"}{" "}
                  {fixed(log.habit_delta)}
                </ThemedText>
              ) : null}
            </View>

            <View className="h-6 w-px bg-text-base/10" />

            {/* Retain */}
            <View className="flex-1 items-center">
              <ThemedText
                size="xxs"
                color="text"
                opacity="medium"
              >
                Retain
              </ThemedText>

              <ThemedText
                size="sm"
                weight="bold"
                color="primary"
                className="mt-1"
              >
                {fixed(log.habit_retain ?? 0)}%
              </ThemedText>

              {log.retain_delta ? (
                <ThemedText
                  size="xs"
                  weight="medium"
                  color={isPositiveRetain ? "success" : "error"}
                >
                  {isPositiveRetain ? "▲" : "▼"}{" "}
                  {fixed(log.retain_delta)}
                </ThemedText>
              ) : null}
            </View>

            <View className="h-6 w-px bg-text-base/10" />

            {/* Shield */}
            <View className="flex-1 items-center">
              <ThemedText
                size="xxs"
                color="text"
                opacity="medium"
              >
                Số Khiên
              </ThemedText>

              <View className="mt-1 flex-row items-center gap-1">
                <FontAwesome5
                  name="shield-alt"
                  size={11}
                  color={theme.primary}
                />

                <ThemedText
                  size="sm"
                  weight="bold"
                  color="primary"
                >
                  {log.shield_snap ?? 0}
                </ThemedText>
              </View>

              {log.shield_delta ? (
                <ThemedText
                  size="xs"
                  weight="medium"
                  color={isPositiveShield ? "success" : "error"}
                >
                  {isPositiveShield ? "▲" : "▼"}{" "}
                  {fixed(log.shield_delta)}
                </ThemedText>
              ) : null}
            </View>
          </View>
        </View>

        {/* Fast / Exception */}
        {hasFastDetail ? (
          <View className="mt-5 gap-y-2">
            <ThemedText
              size="xs"
              weight="semibold"
              color="text"
              opacity="medium"
              style={{
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Chi tiết phiên Fast
            </ThemedText>

            <FastDetail fast={log} />
          </View>
        ) : log.shield_delta && log.shield_delta < 0 ? (
          <View className="mt-6 items-center py-4">
            <ThemedText
              size="sm"
              color="text"
              opacity="medium"
            >
              Ngày nghỉ
            </ThemedText>
          </View>
        ) : log.habit_delta && log.habit_delta < 0 ? (
          <View className="mt-6 items-center py-4">
            <ThemedText
              size="sm"
              color="text"
              opacity="medium"
            >
              Quá đà
            </ThemedText>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
};