import { FASTING_TARGETS } from "@/constants/data";
import { RETAIN_LIMIT } from "@/database/shema/habit_logs";
import { useDBService } from "@/hooks/useDBService";
import { FastSession, HabitLog } from "@/interfaces/db.type";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { fixed } from "@/util/numberLimit";
import { getLocalTodayStr } from "@/util/timer";
import { Feather, FontAwesome5, Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { HabitDetailModal } from "./HabitDetailModal";
import Waterball from "./Waterball";

interface HabitBottomSheetProps {
  habitPercent?: number; // Ví dụ: 45% (0 -> 100)
  shieldCount?: number;
  onClose?: () => void;
}

const HabitBottomSheet: React.FC<HabitBottomSheetProps> = () => {
  const { addModal } = useModalStore();
  const [showAllHistory, setShowAllHistory] = useState(false);
  const { theme, userProfile, habit } = useAppStore();
  const dbService = useDBService();

  const [habitPercent, shieldCount, habitRetain] = useMemo(() => {
    return [
      habit?.habit_snap || 0,
      habit?.shield_snap || 0,
      habit?.habit_retain || 0,
    ];
  }, [habit]);

  // Trạng thái mốc (Đã đạt hay chưa)
  const isMilestone35Reached = !!userProfile?.low_shield_clamable;
  const isMilestone70Reached = !!userProfile?.mid_shield_clamable;
  const isMilestone100Reached = !!userProfile?.full_shield_clamable;

  // Đánh giá động dựa trên % Habit
  const getMotivationalText = (percent: number) => {
    if (percent >= 100)
      return "👑 Bậc thầy kỷ luật! Bạn đã duy trì phong độ hoàn hảo.";
    if (percent >= 70)
      return "🔥 Thói quen cực kỳ vững chắc, tiếp tục phát huy nhé!";
    if (percent >= 35) return "🌱 Bạn đang hình thành thói quen rất tốt!";
    return "💡 Mới bắt đầu hành trình, hãy kiên trì thêm vài phiên nữa!";
  };

  const [selectedLog, setSelectedLog] = useState<HabitLog & FastSession>();
  const [logTarget, setLogTarget] = useState<(typeof FASTING_TARGETS)[0]>();

  const handleSelectHabit = (
    log: HabitLog & FastSession,
    target?: (typeof FASTING_TARGETS)[0],
  ) => {
    // setSelectedLog(log);
    // setLogTarget(target);
  };

  const { width, height } = useWindowDimensions();

  return (
    <View className="bg-[#121318] px-5 py-4 rounded-t-4xl w-full border-t border-white/10">
      {/* 1. HEADER SHEET */}
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center gap-2">
          <Ionicons name="sparkles" size={20} color={theme.primary} />
          <Text className="text-xl font-bold text-white">Habit Index</Text>
        </View>

        <View className="flex-row items-center gap-4 rounded-lg px-3 py-1 bg-gray-700">
          <Text className="text-white text-xs font-bold opacity-60">
            Shield:
          </Text>
          <View className="flex-row items-center gap-1">
            <Text className="text-white font-bold text-lg">{shieldCount}</Text>
            <FontAwesome5 name="shield-alt" size={16} color={theme.primary} />
          </View>
        </View>
      </View>

      {/* 2. HERO: VÒNG TRÒN % Ở CHÍNH GIỮA */}
      <TouchableOpacity
        onPress={() => {
          addModal({ type: "custom", render: <HabitDetailModal /> });
        }}
        className="items-center my-3"
      >
        <Waterball
          percent={habitPercent}
          size={120}
          color={theme.primary}
          retainPercent={(habitRetain / RETAIN_LIMIT) * 100} // Ví dụ: 45% (Đang tích được 45% cho Shield tiếp theo)
          retainColor="#3B82F6" // Viền Retain màu Xanh Shield
        />

        {/* Đánh giá / Câu thông điệp bên dưới */}
        <Text className="text-xs text-zinc-300 font-medium text-center mt-6 px-6">
          {getMotivationalText(habitPercent)}
        </Text>
      </TouchableOpacity>

      {/* 3. THANH MILESTONE & SHIELD TRACK (Ở DƯỚI) */}
      <View className="bg-zinc-900/80 p-4 rounded-2xl border border-white/5 my-4">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xs font-semibold text-zinc-400">
            Tiến trình
          </Text>
          {/* <Text className="text-xs text-blue-400 font-medium">
            Khiên đang có: 🛡️ {shieldCount}
          </Text> */}
        </View>

        {/* Thanh Progress Ngang (Chỉ để đo) */}
        <View className="relative h-3 bg-zinc-700 rounded-full w-full overflow-hidden">
          <View
            className="h-full bg-primary rounded-full"
            style={{ width: `${Math.min(habitPercent, 100)}%` }}
          />
        </View>

        {/* Các mốc vạch dọc & Shield Icon tương ứng */}
        <View className="relative h-12 w-full flex-row justify-between px-1">
          {/* Mốc 0% */}
          <View className="items-center -ml-2 opacity-0">
            <View className="w-0.5 h-2 bg-zinc-600 mb-1" />
            <Text className="text-[10px] text-zinc-500">0%</Text>
          </View>

          {/* Mốc 35% */}
          <View className="absolute left-[35%] -translate-x-1/2 items-center">
            <View className="w-0.5 h-2 bg-zinc-600 mb-1" />
            <View
              className={`p-1 rounded-full ${isMilestone35Reached ? "bg-blue-500/20 border border-blue-500/50" : "bg-zinc-800 opacity-40"}`}
            >
              <FontAwesome5
                name="shield-alt"
                size={10}
                color={isMilestone35Reached ? "#60A5FA" : "#71717A"}
              />
            </View>
            <Text className="text-[10px] text-zinc-400 mt-0.5">35%</Text>
          </View>

          {/* Mốc 70% */}
          <View className="absolute left-[70%] -translate-x-1/2 items-center">
            <View className="w-0.5 h-2 bg-zinc-600 mb-1" />
            <View
              className={`p-1 rounded-full ${isMilestone70Reached ? "bg-blue-500/20 border border-blue-500/50" : "bg-zinc-800 opacity-40"}`}
            >
              <FontAwesome5
                name="shield-alt"
                size={10}
                color={isMilestone70Reached ? "#60A5FA" : "#71717A"}
              />
            </View>
            <Text className="text-[10px] text-zinc-400 mt-0.5">70%</Text>
          </View>

          {/* Mốc 100% */}
          <View className="items-center -mr-2">
            <View className="w-0.5 h-2 bg-zinc-600 mb-1" />
            <View
              className={`p-1 rounded-full ${isMilestone100Reached ? "bg-amber-500/20 border border-amber-500/50" : "bg-zinc-800 opacity-40"}`}
            >
              <FontAwesome5
                name="crown"
                size={10}
                color={isMilestone100Reached ? "#FBBF24" : "#71717A"}
              />
            </View>
            <Text className="text-[10px] text-zinc-400 mt-0.5">100%</Text>
          </View>
        </View>
      </View>

      {/* 4. LỊCH SỬ TÍCH LŨY (7 PHIÊN GẦN NHẤT) */}
      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-sm font-bold text-zinc-300">
            Lịch sử phiên gần đây
          </Text>
        </View>
      </View>
    </View>
  );
};

type HabitLogComProps = {
  log: HabitLog & FastSession;
  onPress: (
    log: HabitLog & FastSession,
    target?: (typeof FASTING_TARGETS)[0],
  ) => void;
};
export const HabitLogComponent = ({ log, onPress }: HabitLogComProps) => {
  const { theme } = useAppStore();

  if (!log) return null;

  // ------------------------------------------------------------
  // Target
  // ------------------------------------------------------------

  const target = useMemo(() => {
    if (log.target_duration) {
      return FASTING_TARGETS.find(
        (item) => item.hours === Math.floor(log.target_duration),
      );
    }

    if (!log.duration) {
      return undefined;
    }

    const durationHours = log.duration / 3600;

    const index = FASTING_TARGETS.findIndex(
      (item) => item.hours >= durationHours,
    );

    if (index === -1) {
      return FASTING_TARGETS.at(-1);
    }

    if (index === 0) {
      return FASTING_TARGETS[0];
    }

    return FASTING_TARGETS[index - 1];
  }, [log.target_duration, log.duration]);

  // ------------------------------------------------------------
  // Events / state
  // ------------------------------------------------------------

  const habitDelta = Number(log.habit_delta ?? log.retain_delta ?? 0);
  const shieldDelta = Number(log.shield_delta ?? 0);

  const isFastSuccess = habitDelta > 0 ? true : habitDelta < 0 ? false : null;

  const isShieldIncrease =
    shieldDelta > 0 ? true : shieldDelta < 0 ? false : null;

  const isTargetSuccess = log.target_duration
    ? log.duration / 3600 >= log.target_duration
    : null;

  /**
   * 1 = Fasting success
   * 2 = Shield increase
   * 3 = Rest
   * 4 = Over rest
   * 0 = Unknown
   */
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

  // ------------------------------------------------------------
  // Colors
  // ------------------------------------------------------------

  let labelColor = theme.primary;

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

  const backgroundColor =
    state === 3
      ? `${theme.success}20`
      : state === 4
        ? `${theme.error}20`
        : theme.background;

  const borderColor =
    state === 3
      ? `${theme.success}40`
      : state === 4
        ? `${theme.error}40`
        : `${theme.text}20`;

  // ------------------------------------------------------------
  // Display
  // ------------------------------------------------------------

  const isShieldEvent = shieldDelta !== 0;
  const isPositiveHabit = habitDelta > 0;

  const title =
    isFastSuccess !== null
      ? isFastSuccess
        ? (target?.label ?? log.description ?? "Fasting session")
        : `😞 You over rest ${log.overest} day(s)`
      : isShieldIncrease
        ? (log.description ?? "⬆️ Shield increase")
        : `🌱 Rest ${Math.abs(shieldDelta)} days`;

  const dateLabel = log.end_time
    ? getLocalTodayStr(new Date(log.end_time))
    : "########";

  return (
    <View
      style={{
        backgroundColor,
        borderColor,
      }}
      className="rounded-xl mb-2.5 border overflow-hidden"
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onPress(log, target)}
        className="p-3.5 flex-row justify-between items-center"
      >
        {/* Left */}
        <View className="flex-row items-center gap-3 flex-1 pr-2">
          {/* Icon */}
          <View
            style={{
              backgroundColor: isShieldEvent
                ? borderColor
                : isPositiveHabit
                  ? `${theme.primary}40`
                  : borderColor,
            }}
            className="w-9 h-9 rounded-full items-center justify-center"
          >
            {isShieldEvent ? (
              <FontAwesome5
                name="shield-alt"
                size={13}
                color={shieldDelta > 0 ? theme.primary : labelColor}
              />
            ) : (
              <Ionicons
                name="flame"
                size={15}
                color={isPositiveHabit ? theme.primary : labelColor}
              />
            )}
          </View>

          {/* Title / date */}
          <View className="flex-1">
            <View className="flex-row items-center gap-1">
              <Text
                style={{ color: labelColor }}
                numberOfLines={1}
                className="text-xs font-semibold"
              >
                {title}
              </Text>

              {log.target_duration ? (
                isTargetSuccess ? (
                  <Feather
                    name="check-circle"
                    color={theme.success}
                    size={12}
                  />
                ) : (
                  <Feather name="x-circle" color={theme.error} size={12} />
                )
              ) : null}
            </View>

            <Text className="text-[10px] text-zinc-400 mt-0.5">
              {dateLabel}
              {log.duration ? ` • Fasted ${fixed(log.duration / 3600)}h` : ""}
            </Text>
          </View>
        </View>

        {/* Right */}
        <View className="flex-row items-center gap-2">
          <View className="items-end">
            {habitDelta !== 0 ? (
              <Text
                className={`text-xs font-bold ${
                  isPositiveHabit ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {isPositiveHabit ? "+" : ""}
                {fixed(habitDelta)}%
              </Text>
            ) : null}

            {shieldDelta !== 0 ? (
              <View className="flex-row items-center gap-1 mt-0.5 bg-blue-500/10 px-1.5 py-0.5 rounded">
                <FontAwesome5 name="shield-alt" size={8} color="#60A5FA" />

                <Text className="text-[9px] font-semibold text-blue-400">
                  {shieldDelta > 0 ? "+" : ""}
                  {shieldDelta}
                </Text>
              </View>
            ) : null}
          </View>

          <View className="ml-1">
            <Ionicons name="chevron-forward" size={14} color="#71717A" />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default HabitBottomSheet;
