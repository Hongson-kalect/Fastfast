import { FASTING_TARGETS } from "@/constants/data";
import { FastSession, HabitLog } from "@/interfaces/db.type";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { fixed } from "@/util/numberLimit";
import { getLocalTodayStr } from "@/util/timer";
import { FontAwesome5 } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { FastDetail } from "../fast_detail";

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
        {/* PHẦN 1: THÔNG SỐ HABIT (LUÔN HIỂN THỊ Ở ĐẦU)          */}
        {/* ---------------------------------------------------- */}
        <View className="gap-y-2">
          <View className="flex-row justify-between items-center">
            <Text className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Habit Log
            </Text>

            <Text className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              {log.log_date ? getLocalTodayStr(new Date(log.log_date)) : "N/A"}
            </Text>
          </View>

          {/* Lưới Trạng thái Tích lũy (Habit Snap, Retain, Shield Snap) */}
          <View className="flex-row justify-between items-center bg-zinc-800/40 p-3 rounded-xl border border-white/5">
            <View className="items-center flex-1">
              <Text className="text-[10px] text-zinc-400">Điểm Habit</Text>
              <Text className="text-sm text-emerald-400 font-bold mt-1">
                {fixed(log.habit_snap ?? 0)}%
              </Text>

              {log.habit_delta ? (
                <Text
                  className="text-xs font-medium"
                  style={{
                    color: isPositiveHabit ? theme.success : theme.error,
                  }}
                >
                  {isPositiveHabit ? "▲" : "▼"} {fixed(log.habit_delta)}
                </Text>
              ) : null}
            </View>

            <View className="w-[1px] h-6 bg-white/10" />

            <View className="items-center flex-1">
              <Text className="text-[10px] text-zinc-400">Retain</Text>
              <Text className="text-sm text-blue-400 font-bold mt-1">
                {fixed(log.habit_retain ?? 0)}%
              </Text>
              {log.retain_delta ? (
                <Text
                  className="text-xs font-medium"
                  style={{
                    color: isPositiveHabit ? theme.success : theme.error,
                  }}
                >
                  {log.retain_delta > 0 ? "▲" : "▼"} {fixed(log.retain_delta)}
                </Text>
              ) : null}
            </View>

            <View className="w-[1px] h-6 bg-white/10" />

            <View className="items-center flex-1">
              <Text className="text-[10px] text-zinc-400">Số Khiên</Text>
              <View className="flex-row items-center gap-1 mt-1">
                <FontAwesome5
                  name="shield-alt"
                  size={11}
                  color={theme.primary}
                />
                <Text className="text-sm text-primary font-bold">
                  {log.shield_snap ?? 0}
                </Text>
              </View>
              {log.shield_delta ? (
                <Text
                  className="text-xs font-medium"
                  style={{
                    color: isPositiveHabit ? theme.success : theme.error,
                  }}
                >
                  {log.shield_delta > 0 ? "▲" : "▼"} {fixed(log.shield_delta)}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* ---------------------------------------------------- */}
        {/* PHẦN 2: CHI TIẾT FAST (CHỈ HIỂN THỊ NẾU CÓ)            */}
        {/* ---------------------------------------------------- */}
        {hasFastDetail ? (
          <View className="gap-y-2 mt-4">
            <Text className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Chi tiết phiên Fast
            </Text>

            <FastDetail fast={log} />
          </View>
        ) : log.shield_delta && log.shield_delta < 0 ? (
          <View>
            <Text className="text-text-base">Ngày nghỉ em ây</Text>
          </View>
        ) : log.habit_delta && log.habit_delta < 0 ? (
          <View>
            <Text className="text-text-base">Quá đà em ây</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
};
