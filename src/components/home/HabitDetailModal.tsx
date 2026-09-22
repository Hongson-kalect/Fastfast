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

export const HabitDetailModal: React.FC<HabitDetailModalProps> = ({
  log,
  onClose,
  targetInfo,
}) => {
  if (!log) {
    console.log("nhảy modal", Date.now());
    return null;
  }

  const { theme } = useAppStore();

  const isPositiveHabit = Number(log.habit_delta) >= 0;
  const isShieldEvent =
    log.shield_delta !== undefined && log.shield_delta !== 0;
  const hasFastDetail = Boolean(log.duration || log.target_duration);

  // Tính trạng thái hoàn thành target
  const actualHours = log.duration ? log.duration / 3600 : 0;
  const targetHours = log.target_duration ?? 0;
  const isTargetSuccess = targetHours > 0 ? actualHours >= targetHours : null;

  const { currentModal } = useModalStore();

  useEffect(() => {
    console.log("Nhảy trong effect", Date.now());
  }, [currentModal]);

  return (
    <View className="w-full">
      <Pressable onPress={(e) => e.stopPropagation()}>
        {/* ---------------------------------------------------- */}
        {/* PHẦN 1: THÔNG SỐ HABIT                               */}
        {/* ---------------------------------------------------- */}
        <View className="gap-y-2">
          <View className="flex-row justify-between items-center">
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
              {log.log_date ? getLocalTodayStr(new Date(log.log_date)) : "N/A"}
            </ThemedText>
          </View>

          {/* Lưới Trạng thái Tích lũy */}
          <View className="flex-row justify-between items-center bg-background2/40 p-3 rounded-xl border border-text-base/5">
            <View className="items-center flex-1">
              <ThemedText size="xxs" color="text" opacity="medium">
                Điểm Habit
              </ThemedText>

              <ThemedText
                size="sm"
                weight="bold"
                color="success"
                style={{ marginTop: 4 }}
              >
                {fixed(log.habit_snap ?? 0)}%
              </ThemedText>

              {log.habit_delta ? (
                <ThemedText
                  size="xs"
                  weight="medium"
                  color={isPositiveHabit ? "success" : "error"}
                >
                  {isPositiveHabit ? "▲" : "▼"} {fixed(log.habit_delta)}
                </ThemedText>
              ) : null}
            </View>

            <View className="w-[1px] h-6 bg-text-base/10" />

            <View className="items-center flex-1">
              <ThemedText size="xxs" color="text" opacity="medium">
                Retain
              </ThemedText>

              <ThemedText
                size="sm"
                weight="bold"
                color="primary"
                style={{ marginTop: 4 }}
              >
                {fixed(log.habit_retain ?? 0)}%
              </ThemedText>

              {log.retain_delta ? (
                <ThemedText
                  size="xs"
                  weight="medium"
                  color={isPositiveHabit ? "success" : "error"}
                >
                  {log.retain_delta > 0 ? "▲" : "▼"} {fixed(log.retain_delta)}
                </ThemedText>
              ) : null}
            </View>

            <View className="w-[1px] h-6 bg-text-base/10" />

            <View className="items-center flex-1">
              <ThemedText size="xxs" color="text" opacity="medium">
                Số Khiên
              </ThemedText>

              <View className="flex-row items-center gap-1 mt-1">
                <FontAwesome5
                  name="shield-alt"
                  size={11}
                  color={theme.primary}
                />

                <ThemedText size="sm" weight="bold" color="primary">
                  {log.shield_snap ?? 0}
                </ThemedText>
              </View>

              {log.shield_delta ? (
                <ThemedText
                  size="xs"
                  weight="medium"
                  color={isPositiveHabit ? "success" : "error"}
                >
                  {log.shield_delta > 0 ? "▲" : "▼"} {fixed(log.shield_delta)}
                </ThemedText>
              ) : null}
            </View>
          </View>
        </View>

        {/* ---------------------------------------------------- */}
        {/* PHẦN 2: CHI TIẾT FAST / EXCEPTION                    */}
        {/* ---------------------------------------------------- */}
        {hasFastDetail ? (
          <View className="gap-y-2 mt-5">
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
          <View className="mt-6 py-4 items-center">
            <ThemedText size="sm" color="text" opacity="medium">
              Ngày nghỉ
            </ThemedText>
          </View>
        ) : log.habit_delta && log.habit_delta < 0 ? (
          <View className="mt-6 py-4 items-center">
            <ThemedText size="sm" color="text" opacity="medium">
              Quá đà
            </ThemedText>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
};
