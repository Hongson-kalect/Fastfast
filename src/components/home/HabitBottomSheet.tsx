import { FASTING_TARGETS } from "@/constants/data";
import { RETAIN_LIMIT } from "@/database/shema/habit_logs";
import { useDBService } from "@/hooks/useDBService";
import { FastSession, HabitLog } from "@/interfaces/db.type";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { getLocalTodayStr } from "@/util/timer";
import { Feather, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import React, { useEffect, useMemo, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";
import { HabitDetailModal } from "./HabitDetailModal";
import Waterball from "./Waterball";
import { getMotivationalText } from "@/util/home/timespliter";
import HabitMilestone from "./HabitMilestone";
import { getTargetInfo } from "@/util/home/fast";
import { fixed } from "@/util/numberLimit";

interface HabitBottomSheetProps {
  habitPercent?: number; // Ví dụ: 45% (0 -> 100)
  shieldCount?: number;
  onClose?: () => void;
}

const HabitBottomSheet: React.FC<HabitBottomSheetProps> = (props) => {
  const [habitLogs, setHabitLogs] = useState<(HabitLog & FastSession)[]>([]);
  const dbService = useDBService();

  const getHabitLogs = async () => {
    const res = await dbService?.getHabitLogs();
    setHabitLogs(res);
  };

  useEffect(() => {
    getHabitLogs();
  }, []);

  return (
    <BottomSheetFlatList
      data={habitLogs}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View className="px-3">
          <HabitLogComponent log={item} />
        </View>
      )}
      contentContainerStyle={{
        gap: 2,
      }}
      ListHeaderComponent={
        <HabitBottomSheetHeader habitCount={habitLogs.length} />
      }
      ListEmptyComponent={
        <View className="items-center justify-center px-3">
          <ThemedText
            color="text"
            opacity="medium"
            style={{ textAlign: "center" }}
          >
            Không có dữ liệu
          </ThemedText>
        </View>
      }
    />
  );
};

const HabitBottomSheetHeader: React.FC<
   { habitCount: number }
> = ({ habitCount }) => {
  const { theme, userProfile, habit } = useAppStore();

  const habitPercent = habit?.habit_snap || 0;
const shieldCount = habit?.shield_snap || 0;
const habitRetain = habit?.habit_retain || 0;

  // Trạng thái mốc (Đã đạt hay chưa)
  const isMilestone35Reached = !!userProfile?.low_shield_clamable;
  const isMilestone70Reached = !!userProfile?.mid_shield_clamable;
  const isMilestone100Reached = !!userProfile?.full_shield_clamable;

  // Đánh giá động dựa trên % Habit

  return (
    <View className="px-2 py-4 rounded-t-4xl w-full">
      {/* 1. HEADER SHEET */}
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center gap-2">
          <Ionicons name="sparkles" size={20} color={theme.primary} />
          <ThemedText size="xl" weight="bold" color="text">
            Habit Index
          </ThemedText>
        </View>

        <View className="flex-row items-center gap-4 rounded-lg px-3 py-1 bg-background2">
          <ThemedText size="xs" weight="bold" color="text" opacity="medium">
            Shield:
          </ThemedText>

          <View className="flex-row items-center gap-1">
            <ThemedText size="lg" weight="bold" color="text">
              {shieldCount}
            </ThemedText>

            <FontAwesome5 name="shield-alt" size={16} color={theme.primary} />
          </View>
        </View>
      </View>

      {/* 2. HERO */}
      <TouchableOpacity className="items-center my-3">
        <Waterball
          percent={habitPercent}
          size={120}
          color={theme.primary}
          retainPercent={(habitRetain / RETAIN_LIMIT) * 100}
          retainColor={theme.primary}
        />

        <ThemedText
          size="xs"
          weight="medium"
          color="text"
          opacity="medium"
          style={{ textAlign: "center", marginTop: 24, paddingHorizontal: 24 }}
        >
          {getMotivationalText(habitPercent)}
        </ThemedText>
      </TouchableOpacity>

      {/* 3. MILESTONE & SHIELD TRACK */}
     <HabitMilestone
  habitPercent={habitPercent}
  isMilestone35Reached={isMilestone35Reached}
  isMilestone70Reached={isMilestone70Reached}
  isMilestone100Reached={isMilestone100Reached}
  primaryColor={theme.primary}
  textColor={theme.text}
/>

      {/* 4. HISTORY */}
      <View className="flex-1">
        <View className="mb-3 flex-row items-center justify-between">
          <ThemedText size="sm" weight="bold" color="text" opacity="medium">
            Lịch sử phiên gần đây
          </ThemedText>

          <ThemedText size="xs" color="text" opacity="medium">
            {habitCount} phiên
          </ThemedText>
        </View>
      </View>
    </View>
  );
};

type HabitLogComProps = {
  log: HabitLog & FastSession;
};
export const HabitLogComponent = ({ log }: HabitLogComProps) => {
  const { theme } = useAppStore();
  const { addModal } = useModalStore();

  if (!log) return null;

  // 1. Tính toán Target mục tiêu (Chỉ recalculate khi log.target_duration hoặc log.duration đổi)
  const target = log.target_duration && getTargetInfo(log.target_duration) || null;
  // 2. Bọc toàn bộ logic trạng thái & hiển thị vào useMemo để tối ưu FlatList scroll
  const habitDelta = Number(log.habit_delta ?? log.retain_delta ?? 0);
const shieldDelta = Number(log.shield_delta ?? 0);

const isFastSuccess =
  habitDelta > 0 ? true : habitDelta < 0 ? false : null;

const isShieldIncrease =
  shieldDelta > 0 ? true : shieldDelta < 0 ? false : null;

const isTargetSuccess =
  log.target_duration && log.target_duration > 0
    ? log.duration / 3600 >= log.target_duration
    : false;

const state =
  habitDelta > 0
    ? 1
    : habitDelta < 0
      ? 4
      : shieldDelta > 0
        ? 2
        : shieldDelta < 0
          ? 3
          : 0;

let labelColor = "#F4F4F5";

switch (state) {
  case 1:
    labelColor = target?.colors.accent ?? theme.primary;
    break;
  case 2:
    labelColor = theme.primary;
    break;
  case 3:
    labelColor = theme.success;
    break;
  case 4:
    labelColor = theme.error;
    break;
}

const isShieldEvent = habitDelta === 0 && shieldDelta !== 0;
const isPositiveHabit = habitDelta > 0;

const overrestDays = log.overest ?? 0;

const title =
  isFastSuccess !== null
    ? isFastSuccess
      ? (target?.label ?? log.description ?? "Fasting session")
      : `You over rest ${overrestDays} day(s)`
    : isShieldIncrease
      ? (log.description ?? "Shield increase")
      : `Rest ${Math.abs(shieldDelta)} days`;

const dateLabel = log.end_time
  ? getLocalTodayStr(new Date(log.end_time))
  : "--:--";
  
  const handleSelectHabit = (
  ) => {
    addModal({
      type: "custom",
      render: <HabitDetailModal log={log} targetInfo={target} />,
    });
  };

  return (
    <View className="mb-3 overflow-hidden rounded-xl border border-text-base/20 bg-background2">
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleSelectHabit}
        className="flex-row items-center justify-between p-3.5"
      >
        {/* Left Section */}
        <View className="flex-1 flex-row items-center gap-3 pr-2">
          {/* Badge Icon */}
          <View className="h-9 w-9 items-center justify-center rounded-xl border border-text-base/5 bg-background2/80">
            {isShieldEvent ? (
              <FontAwesome5
                name="shield-alt"
                size={13}
                color={shieldDelta > 0 ? theme.primary : theme.text}
                style={{
                  opacity: shieldDelta > 0 ? 1 : 0.5,
                }}
              />
            ) : (
              <Ionicons
                name="flame"
                size={15}
                color={isPositiveHabit ? theme.primary : theme.text}
                style={{
                  opacity: isPositiveHabit ? 1 : 0.5,
                }}
              />
            )}
          </View>

          {/* Title & Date Info */}
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5">
              <ThemedText
                size="xs"
                weight="bold"
                colorHex={labelColor}
                numberOfLines={1}
                style={{ letterSpacing: -0.2 }}
              >
                {title}
              </ThemedText>

              {/* Status Indicator */}
              {log.target_duration && log.target_duration > 0 ? (
                isTargetSuccess ? (
                  <Feather
                    name="check-circle"
                    color={theme.success}
                    size={11}
                  />
                ) : (
                  <Feather name="x-circle" color={theme.error} size={11} />
                )
              ) : null}
            </View>

            <ThemedText
              size="xxs"
              weight="medium"
              color="text"
              opacity="medium"
              style={{ marginTop: 2 }}
            >
              {dateLabel}
              {log.duration ? ` • ${fixed(log.duration / 3600)}h` : ""}
            </ThemedText>
          </View>
        </View>

        {/* Right Section */}
        <View className="flex-row items-center gap-2.5">
          <View className="items-end gap-1">
            {/* Habit Score Delta */}
            {habitDelta !== 0 && (
              <ThemedText
                size="xs"
                weight="bold"
                color={isPositiveHabit ? "success" : "error"}
              >
                {isPositiveHabit ? "+" : ""}
                {fixed(habitDelta)}%
              </ThemedText>
            )}

            {/* Shield Delta */}
            {shieldDelta !== 0 && (
              <View className="flex-row items-center gap-1">
                <FontAwesome5
                  name="shield-alt"
                  size={8}
                  color={theme.primary}
                />

                <ThemedText size="xxs" weight="bold" color="primary">
                  {shieldDelta > 0 ? "+" : ""}
                  {shieldDelta}
                </ThemedText>
              </View>
            )}
          </View>

          <Ionicons
            name="chevron-forward"
            size={14}
            color={theme.text}
            style={{ opacity: 0.25 }}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default HabitBottomSheet;
