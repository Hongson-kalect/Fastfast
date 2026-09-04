import { FASTING_TARGETS } from "@/constants/data";
import { RETAIN_LIMIT } from "@/database/shema/habit_logs";
import { useDBService } from "@/hooks/useDBService";
import { FastSession, HabitLog } from "@/interfaces/db.type";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { fixed } from "@/util/numberLimit";
import { getLocalTodayStr } from "@/util/timer";
import { Feather, FontAwesome5, Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
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

  const [habitLogs, setHabitLogs] = useState<(HabitLog & FastSession)[]>([]);

  const getHabitLogs = async () => {
    const res = await dbService?.getHabitLogs();
    setHabitLogs(res);
  };

  useEffect(() => {
    getHabitLogs();
  }, []);

  const [selectedLog, setSelectedLog] = useState<HabitLog & FastSession>();
  const [logTarget, setLogTarget] = useState<(typeof FASTING_TARGETS)[0]>();

  const handleSelectHabit = (
    log: HabitLog & FastSession,
    target?: (typeof FASTING_TARGETS)[0],
  ) => {
    addModal(<HabitDetailModal log={log} targetInfo={target} />);
    // setSelectedLog(log);
    // setLogTarget(target);
  };

  const { width, height } = useWindowDimensions();

  return (
    <View className="bg-[#121318] px-5 pt-4 pb-20 rounded-t-4xl w-full border-t border-white/10">
      <Modal
        visible={!!selectedLog}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedLog(undefined)}
      >
        <View className="flex-1 justify-center">
          <Pressable
            className="absolute inset-0 bg-gray-900/60"
            onPress={() => setSelectedLog(undefined)}
          />

          <View className="px-5 max-h-[80%]">
            <Animated.View
              entering={FadeInDown}
              exiting={FadeOutUp}
              className="
                overflow-hidden
                rounded-2xl
                py-1
                border
                border-text-base/60
                shadow-lg
                shadow-text-base/40
                bg-gray-800
              "
            >
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <HabitDetailModal log={selectedLog} targetInfo={logTarget} />
              </ScrollView>
            </Animated.View>
          </View>
        </View>
      </Modal>
      {/* Handle bar */}
      {/* <View className="w-12 h-1.5 bg-zinc-700 rounded-full self-center mb-4 opacity-60" /> */}

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
          <Text className="text-xs text-zinc-500">7 phiên</Text>
        </View>

        <View className="">
          {habitLogs?.length ? (
            habitLogs.map((item) => (
              <HabitLogComponent
                onPress={handleSelectHabit}
                key={item.id}
                log={item}
              />
            ))
          ) : (
            <View className="mt-8 gap-3 items-center">
              <Text className="italic text-text-base/40">
                Chưa có lịch sử phiên gần đây
              </Text>
            </View>
          )}
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
  // Sửa dependency array cho useMemo
  const target = useMemo(() => {
    if (!log?.target_duration) {
      if (log.duration) {
        const dynamicTarget = FASTING_TARGETS.findIndex(
          (item) => item.hours >= log.duration / 3600,
        );

        if (dynamicTarget === -1) return FASTING_TARGETS.at(-1); //Quá last target
        if (dynamicTarget === 0) return FASTING_TARGETS[0]; // Thấp hơn first Target
        return FASTING_TARGETS[dynamicTarget - 1];
      }

      return undefined;
    }
    return FASTING_TARGETS.find(
      (item) => item.hours === Math.floor(log.target_duration),
    );
  }, [log?.target_duration]);

  const isFastSuccess = useMemo(() => {
    const delta = log.habit_delta || log.retain_delta;
    if (!delta) return null;
    if (delta > 0) return true;
    if (delta < 0) return false;
    return null;
  }, [log]);

  const isTargetSuccess = useMemo(() => {
    if (!log.target_duration) return null;
    const hours = log.duration / 3600;
    if (hours >= log.target_duration) return true;
    if (hours < log.target_duration) return false;
    return null;
  }, [log]);

  const isShieldIncrease = useMemo(() => {
    if (!log.shield_delta) return null;
    if (log.shield_delta > 0) return true;
    if (log.shield_delta < 0) return false;
    return null;
  }, [log]);

  const state = useMemo(() => {
    // 1. Fasting, 2. Shield, 3. Rest, 4. Over Rest
    const delta = log.habit_delta || log.retain_delta;
    if (delta && delta > 0) return 1;
    if (delta && delta < 0) return 4;
    if (log?.shield_delta && log.shield_delta > 0) return 2;
    if (log?.shield_delta && log.shield_delta < 0) return 3;
    return 0;
  }, [log]);

  const [labelColor, backgroundColor, borderColor] = useMemo(() => {
    let labelColor = theme.primary;
    if (state === 1) labelColor = target?.colors.accent || "theme.primary";
    if (state === 2) labelColor = theme.primary;
    if (state === 3) labelColor = theme.success;
    if (state === 4) labelColor = theme.error;

    let backgroundColor = theme.background;
    if (state === 3) backgroundColor = theme.success + "20";
    if (state === 4) backgroundColor = theme.error + "20";

    let borderColor = theme.text + "20";
    if (state === 3) borderColor = theme.success + "40";
    if (state === 4) borderColor = theme.error + "40";

    return [labelColor, backgroundColor, borderColor];
  }, [state]);

  const getTitle = () => {
    return (
      <View className="flex-row items-center gap-1">
        <Text
          style={{ color: labelColor }}
          numberOfLines={1}
          className="text-xs font-semibold text-zinc-100"
        >
          {isFastSuccess !== null
            ? isFastSuccess
              ? target?.label || log?.description || "Fasting session"
              : `😞 You over rest ${log?.overest} day(s)`
            : isShieldIncrease
              ? log?.description || "⬆️ Shield increase"
              : `🌱 Rest ${Math.abs(log?.shield_delta || 0)} days`}
        </Text>
        {log.target_duration ? (
          isTargetSuccess ? (
            <Feather name="check-circle" color={theme.success} size={12} />
          ) : (
            <Feather name="x-circle" color={theme.error} size={12} />
          )
        ) : null}
      </View>
    );
  };

  const { addModal } = useModalStore();
  const showDetail = () => {
    addModal({
      type: "custom",
      render: <HabitDetailModal />,
    });
  };

  if (!log) return null;

  const isShieldEvent = Boolean(log.shield_delta);
  const isPositiveHabit = log.habit_delta && log.habit_delta > 0;

  return (
    <View
      style={{ backgroundColor, borderColor }}
      className="rounded-xl mb-2.5 border overflow-hidden"
    >
      {/* 1. HEADER (CLICK ĐỂ ĐÓNG/MỞ) */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onPress(log, target)}
        // onPress={showDetail}
        className="p-3.5 flex-row justify-between items-center"
      >
        <View className="flex-row items-center gap-3 flex-1 pr-2">
          {/* Icon Badge */}
          <View
            style={{
              backgroundColor: isShieldEvent
                ? borderColor
                : isPositiveHabit
                  ? theme.primary + "40"
                  : borderColor,
            }}
            className={`w-9 h-9 rounded-full items-center justify-center`}
          >
            {isShieldEvent ? (
              <FontAwesome5
                name="shield-alt"
                size={13}
                color={
                  Number(log?.shield_delta) > 0 ? theme.primary : labelColor
                }
              />
            ) : (
              <Ionicons
                name="flame"
                size={15}
                color={isPositiveHabit ? theme.primary : labelColor}
              />
            )}
          </View>

          {/* Tiêu đề & Thời gian ngắn gọn */}
          <View className="flex-1">
            {getTitle()}

            <Text className="text-[10px] text-zinc-400 mt-0.5">
              {log.end_time
                ? getLocalTodayStr(new Date(log.end_time))
                : "########"}
              {log.duration ? ` • Fasted ${fixed(log.duration / 3600)}h` : ""}
            </Text>
          </View>
        </View>

        {/* Cột phải: Delta + Mũi tên indicator */}
        <View className="flex-row items-center gap-2">
          <View className="items-end">
            {/* Điểm Habit */}
            {log.habit_delta ? (
              <Text
                className={`text-xs font-bold ${
                  isPositiveHabit ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {isPositiveHabit ? "+" : ""}
                {fixed(log.habit_delta)}%
              </Text>
            ) : null}

            {/* Shield Badge nhỏ gọn ở Header nếu có biến động khiên */}
            {log.shield_delta !== 0 ? (
              <View className="flex-row items-center gap-1 mt-0.5 bg-blue-500/10 px-1.5 py-0.5 rounded">
                <FontAwesome5 name="shield-alt" size={8} color="#60A5FA" />
                <Text className="text-[9px] font-semibold text-blue-400">
                  {Number(log.shield_delta) > 0
                    ? `+${log.shield_delta}`
                    : log.shield_delta}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Mũi tên xoay */}
          <View className="ml-1">
            <Ionicons name="chevron-forward" size={14} color="#71717A" />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default HabitBottomSheet;
