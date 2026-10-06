import { RETAIN_LIMIT } from "@/database/shema/habit_logs";
import { useDBService } from "@/hooks/useDBService";
import { FastSession, HabitLog } from "@/interfaces/db.type";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { getTargetInfo } from "@/util/home/fast";
import { getMotivationalText } from "@/util/home/timespliter";
import { fixed } from "@/util/numberLimit";
import { getLocalTodayStr } from "@/util/timer";
import { Feather, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import React, { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";
import { HabitDetailModal } from "./HabitDetailModal";
import HabitMilestone from "./HabitMilestone";
import Waterball from "./Waterball";

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
            size="sm"
            opacity="medium"
            style={{ textAlign: "center" }}
            className="mt-4 italic"
          >
            Không có dữ liệu
          </ThemedText>
        </View>
      }
    />
  );
};

const HabitBottomSheetHeader: React.FC<{ habitCount: number }> = ({
  habitCount,
}) => {
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
    <View className="p-4 rounded-t-4xl w-full">
      {/* 1. HEADER SHEET */}
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center gap-2">
          <Ionicons name="sparkles" size={20} color={theme.primary} />
          <ThemedText size="xl" weight="bold" color="text">
            Habit Index
          </ThemedText>
        </View>

        <View className="flex-row items-center gap-1.5 rounded-full bg-primary/20 px-2">
          <ThemedText size="lg" weight="semibold" color="text">
            {shieldCount}
          </ThemedText>

          <FontAwesome5 name="shield-alt" size={16} color={theme.primary} />
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
          <ThemedText size="sm" weight="semibold" opacity="medium">
            Lịch sử
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
  const target =
    (log.target_duration && getTargetInfo(log.target_duration)) || null;
  // 2. Bọc toàn bộ logic trạng thái & hiển thị vào useMemo để tối ưu FlatList scroll
  const habitDelta = Number(log.habit_delta ?? log.retain_delta ?? 0);
  const shieldDelta = Number(log.shield_delta ?? 0);

  const isFastSuccess = habitDelta > 0 ? true : habitDelta < 0 ? false : null;

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

  const handleSelectHabit = () => {
    addModal({
      type: "custom",
      render: <HabitDetailModal log={log} targetInfo={target} />,
    });
  };

  return (
    <View className="mb-2.5 overflow-hidden rounded-2xl bg-background2">
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={handleSelectHabit}
        className="flex-row items-center px-3.5 py-3"
      >
        {/* EVENT ICON */}
        <View
          className="mr-3 h-10 w-10 items-center justify-center rounded-xl"
          style={{
            backgroundColor: isPositiveHabit
              ? theme.primary + "15"
              : theme.text + "0D",
          }}
        >
          {isShieldEvent ? (
            <FontAwesome5
              name="shield-alt"
              size={14}
              color={shieldDelta > 0 ? theme.primary : theme.text}
              style={{
                opacity: shieldDelta > 0 ? 1 : 0.45,
              }}
            />
          ) : (
            <Ionicons
              name="flame"
              size={17}
              color={isPositiveHabit ? theme.primary : theme.text}
              style={{
                opacity: isPositiveHabit ? 1 : 0.45,
              }}
            />
          )}
        </View>

        {/* MAIN CONTENT */}
        <View className="min-w-0 flex-1">
          {/* Title */}
          <View className="flex-row items-center gap-1.5">
            <ThemedText
              size="sm"
              weight="semibold"
              colorHex={labelColor}
              numberOfLines={1}
              className="flex-1"
            >
              {title}
            </ThemedText>

            {/* Target result */}
            {log.target_duration && log.target_duration > 0 && (
              <View
                className="h-4 w-4 items-center justify-center rounded-full"
                style={{
                  backgroundColor: isTargetSuccess
                    ? theme.success + "15"
                    : theme.error + "15",
                }}
              >
                <Feather
                  name={isTargetSuccess ? "check" : "x"}
                  size={10}
                  color={isTargetSuccess ? theme.success : theme.error}
                />
              </View>
            )}
          </View>

          {/* Date / duration */}
          <View className="mt-1 flex-row items-center">
            <ThemedText
              size="xxs"
              weight="medium"
              color="text"
              opacity="medium"
              numberOfLines={1}
            >
              {dateLabel}
            </ThemedText>

            {log.duration ? (
              <>
                <ThemedText
                  size="xxs"
                  color="text"
                  opacity="low"
                  className="mx-1"
                >
                  •
                </ThemedText>

                <ThemedText
                  size="xxs"
                  weight="medium"
                  color="text"
                  opacity="medium"
                >
                  {fixed(log.duration / 3600)}h
                </ThemedText>
              </>
            ) : null}
          </View>
        </View>

        {/* REWARD / DELTA */}
        <View className="ml-3 items-end">
          {/* Habit change */}
          {habitDelta !== 0 ? (
            <ThemedText
              size="sm"
              weight="bold"
              color={isPositiveHabit ? "success" : "error"}
            >
              {isPositiveHabit ? "+" : ""}
              {fixed(habitDelta)}%
            </ThemedText>
          ) : (
            <ThemedText size="sm" weight="bold" color="text" opacity="low">
              —
            </ThemedText>
          )}

          {/* Shield change */}
          {shieldDelta !== 0 && (
            <View className="mt-1 flex-row items-center gap-1">
              <FontAwesome5 name="shield-alt" size={9} color={theme.primary} />

              <ThemedText size="xxs" weight="bold" color="primary">
                {shieldDelta > 0 ? "+" : ""}
                {shieldDelta}
              </ThemedText>
            </View>
          )}
        </View>

        {/* CHEVRON */}
        <View className="ml-2.5">
          <Ionicons
            name="chevron-forward"
            size={14}
            color={theme.text}
            style={{ opacity: 0.2 }}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default HabitBottomSheet;
