import { FASTING_TARGETS } from "@/constants/data";
import { useDBService } from "@/hooks/useDBService";
import { FastSession, HabitLog } from "@/interfaces/db.type";
import { useAppStore } from "@/stores/appStore";
import { fixed } from "@/util/numberLimit";
import { getLocalTodayStr } from "@/util/timer";
import { Feather, FontAwesome5, Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  FadeInDown,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Waterball from "./Waterball";

export interface HabitLogItem {
  id: string;
  log_date: string; // 'YYYY-MM-DD'
  fast_id: string | null;
  type: "habit+" | "habit-" | "shield+" | "shield-";
  habit_delta: number;
  habit_snap: number;
  habit_retain: number;
  shield_delta: number;
  shield_snap: number;

  // Các trường thời gian bổ sung
  start_time: number | null; // Unix Timestamp (seconds)
  end_time: number | null; // Unix Timestamp (seconds)
  target_duration: number | null; // Mục tiêu nhịn (Giờ, VD: 16.0)
  duration: number | null; // Thời gian nhịn thực tế (Giờ, VD: 16.5)

  is_deleted: number;
  sync_status: "synced" | "pending";
  description: string;
  created_at: number;
  updated_at: number;
}

export const MOCK_HABIT_LOGS: HabitLogItem[] = [
  {
    id: "log_001",
    log_date: "2026-08-01",
    fast_id: "fast_101",
    type: "habit+",
    habit_delta: 3.0,
    habit_snap: 3.0,
    habit_retain: 15.0,
    shield_delta: 0,
    shield_snap: 0,
    start_time: 1785523200000, // 2026-07-31 18:00000
    end_time: 1785582600000, // 2026-08-01 10:30000
    target_duration: 16.0, // Mục tiêu 16h
    duration: 16.5, // Thực tế 16.5h
    is_deleted: 0,
    sync_status: "synced",
    description: "Hoàn thành 16:8 Fasting",
    created_at: 1785580800,
    updated_at: 1785580800,
  },
  {
    id: "log_002",
    log_date: "2026-08-02",
    fast_id: "fast_102",
    type: "habit+",
    habit_delta: 3.5,
    habit_snap: 6.5,
    habit_retain: 50.0,
    shield_delta: 0,
    shield_snap: 0,
    start_time: 1785602400000,
    end_time: 1785667200000,
    target_duration: 18.0,
    duration: 18.0,
    is_deleted: 0,
    sync_status: "synced",
    description: "Hoàn thành 18:6 Fasting",
    created_at: 1785667200,
    updated_at: 1785667200,
  },
  {
    id: "log_003",
    log_date: "2026-08-03",
    fast_id: "fast_103",
    type: "shield+",
    habit_delta: 4.0,
    habit_snap: 10.5,
    habit_retain: 0.0,
    shield_delta: 1.0,
    shield_snap: 1.0,
    start_time: 1785680000000,
    end_time: 1785753800000,
    target_duration: 20.0,
    duration: 20.5,
    is_deleted: 0,
    sync_status: "synced",
    description: "Đạt mốc 100% Retain -> Nhận Khiên bảo vệ",
    created_at: 1785753600,
    updated_at: 1785753600,
  },
  {
    id: "log_004",
    log_date: "2026-08-04",
    fast_id: null,
    type: "shield-",
    habit_delta: 0.0,
    habit_snap: 10.5,
    habit_retain: 0.0,
    shield_delta: -1.0,
    shield_snap: 0.0,
    start_time: null, // Dùng Shield do bỏ lỡ phiên nhị000n
    end_time: null,
    target_duration: null,
    duration: null,
    is_deleted: 0,
    sync_status: "synced",
    description: "Nghỉ 1 ngày",
    created_at: 1785840000,
    updated_at: 1785840000,
  },
  {
    id: "log_005",
    log_date: "2026-08-05",
    fast_id: "fast_104",
    type: "habit+",
    habit_delta: 3.2,
    habit_snap: 13.7,
    habit_retain: 30.0,
    shield_delta: 0,
    shield_snap: 0,
    start_time: 1785868800000,
    end_time: 1785927120000,
    target_duration: 16.0,
    duration: 16.2,
    is_deleted: 0,
    sync_status: "synced",
    description: "Hoàn thành 16:8 Fasting",
    created_at: 1785926400,
    updated_at: 1785926400,
  },
  {
    id: "log_006",
    log_date: "2026-08-06",
    fast_id: "fast_105",
    type: "habit+",
    habit_delta: 5.0,
    habit_snap: 18.7,
    habit_retain: 85.0,
    shield_delta: 0,
    shield_snap: 0,
    start_time: 1785926400000,
    end_time: 1786012800000,
    target_duration: 23.0,
    duration: 24.1,
    is_deleted: 0,
    sync_status: "synced",
    description: "Hoàn thành OMAD 24H",
    created_at: 1786012800,
    updated_at: 1786012800,
  },
  {
    id: "log_007",
    log_date: "2026-08-07",
    fast_id: "fast_106",
    type: "shield+",
    habit_delta: 3.0,
    habit_snap: 21.7,
    habit_retain: 10.0,
    shield_delta: 1.0,
    shield_snap: 1.0,
    start_time: 1786041600000,
    end_time: 1786099200000,
    target_duration: 16.0,
    duration: 16.0,
    is_deleted: 0,
    sync_status: "synced",
    description: "Đạt mốc phần thưởng -> Nhận Khiên",
    created_at: 1786099200,
    updated_at: 1786099200,
  },
  {
    id: "log_008",
    log_date: "2026-08-08",
    fast_id: "fast_107",
    type: "habit-",
    habit_delta: -2.0,
    habit_snap: 19.7,
    habit_retain: 10.0,
    shield_delta: 0,
    shield_snap: 1.0,
    start_time: 1786128000000,
    end_time: 1786169400000,
    target_duration: 16.0,
    duration: 11.5, // Hủy sớm hơn mục tiêu
    is_deleted: 0,
    sync_status: "synced",
    description: "1",
    created_at: 1786185600,
    updated_at: 1786185600,
  },
  {
    id: "log_009",
    log_date: "2026-08-09",
    fast_id: "fast_108",
    type: "habit+",
    habit_delta: 4.5,
    habit_snap: 24.2,
    habit_retain: 55.0,
    shield_delta: 0,
    shield_snap: 1.0,
    start_time: 1786200000000,
    end_time: 1786272000000,
    target_duration: 20.0,
    duration: 20.0,
    is_deleted: 0,
    sync_status: "pending",
    description: "Hoàn thành Warrior 20H",
    created_at: 1786272000,
    updated_at: 1786272000,
  },
  {
    id: "log_010",
    log_date: "2026-08-10",
    fast_id: "fast_109",
    type: "habit+",
    habit_delta: 3.0,
    habit_snap: 27.2,
    habit_retain: 85.0,
    shield_delta: 0,
    shield_snap: 1.0,
    start_time: 1786300800000,
    end_time: 1786358400000,
    target_duration: 16.0,
    duration: 16.0,
    is_deleted: 0,
    sync_status: "pending",
    description: "Hoàn thành 16:8 Fasting",
    created_at: 1786358400,
    updated_at: 1786358400,
  },
];

interface HabitBottomSheetProps {
  habitPercent?: number; // Ví dụ: 45% (0 -> 100)
  shieldCount?: number;
  onClose?: () => void;
}

const HabitBottomSheet: React.FC<HabitBottomSheetProps> = ({ onClose }) => {
  const [showAllHistory, setShowAllHistory] = useState(false);
  const { theme, userProfile } = useAppStore();
  const dbService = useDBService();

  const [habitPercent, shieldCount, habitRetain] = useMemo(() => {
    return [
      userProfile?.habit_percent || 0,
      userProfile?.shield || 0,
      userProfile?.habit_retain || 0,
    ];
  }, [userProfile]);

  // Trạng thái mốc (Đã đạt hay chưa)
  const isMilestone35Reached = habitPercent < 35;
  const isMilestone70Reached = habitPercent < 70;
  const isMilestone100Reached = habitPercent < 100;

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

  return (
    <View className="bg-[#121318] px-5 pt-4 pb-20 rounded-t-4xl w-full border-t border-white/10">
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
      <View className="items-center my-3">
        <Waterball
          percent={habitPercent}
          size={120}
          color={theme.primary}
          retainPercent={habitRetain} // Ví dụ: 45% (Đang tích được 45% cho Shield tiếp theo)
          retainColor="#3B82F6" // Viền Retain màu Xanh Shield
        />

        {/* Đánh giá / Câu thông điệp bên dưới */}
        <Text className="text-xs text-zinc-300 font-medium text-center mt-6 px-6">
          {getMotivationalText(habitPercent)}
        </Text>
      </View>

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

        <ScrollView className="">
          {habitLogs?.length ? (
            habitLogs.map((item) => (
              <HabitLogComponent key={item.id} log={item} />
            ))
          ) : (
            <View className="mt-8 gap-3 items-center">
              <Text className="italic text-text-base/40">
                Chưa có lịch sử phiên gần đây
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

type HabitLogComProps = {
  log: HabitLog & FastSession;
};
const HabitLogComponent = ({ log }: HabitLogComProps) => {
  const { theme } = useAppStore();
  const [expanded, setExpanded] = useState(false);
  const rotateValue = useSharedValue(0);
  // Sửa dependency array cho useMemo
  const target = useMemo(() => {
    if (!log?.target_duration) {
      if (log.duration) {
        const dynamicTarget = FASTING_TARGETS.findIndex(
          (item) => item.hours >= log.duration,
        );

        if (dynamicTarget === -1) return FASTING_TARGETS.at(-1); //Quá last target
        if (dynamicTarget === 0) return FASTING_TARGETS[0]; // Thấp hơn first Target
        return FASTING_TARGETS[dynamicTarget - 1];
      }

      return null;
    }
    return FASTING_TARGETS.find(
      (item) => item.hours === Math.floor(log.target_duration),
    );
  }, [log?.target_duration]);

  const isFastSuccess = useMemo(() => {
    if (!log.habit_delta) return null;
    if (log.habit_delta > 0) return true;
    if (log.habit_delta < 0) return false;
    return null;
  }, [log]);

  const isTargetSuccess = useMemo(() => {
    if (!log.target_duration) return null;
    if (log.duration >= log.target_duration) return true;
    if (log.duration < log.target_duration) return false;
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
    if (log?.habit_delta && log.habit_delta > 0) return 1;
    if (log?.habit_delta && log.habit_delta < 0) return 4;
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
        {log.target_duration && isTargetSuccess ? (
          <Feather name="check-circle" color={theme.success} size={12} />
        ) : (
          <Feather name="x-circle" color={theme.error} size={12} />
        )}
      </View>
    );
  };

  const toggleExpand = () => {
    setExpanded((prev) => !prev);
    rotateValue.value = withTiming(expanded ? 0 : 180, { duration: 250 });
  };

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateValue.value}deg` }],
  }));

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
        onPress={toggleExpand}
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
          <Animated.View style={arrowStyle} className="ml-1">
            <Ionicons name="chevron-down" size={14} color="#71717A" />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* 2. DETAIL EXPANDED PANEL (MỞ RA KHI BẤM) */}
      {expanded && (
        <Animated.View
          entering={FadeInDown.duration(200)}
          exiting={FadeOutUp.duration(150)}
          className="px-3.5 pb-3.5 pt-2 border-t border-white/5 bg-black/20"
        >
          {/* Lưới thông số chi tiết (2 hàng 2 cột) */}
          <View className="gap-3">
            {/* Hàng 1: Thời gian Nhịn & Mục tiêu */}
            <View className="flex-row justify-between items-center bg-zinc-800/40 p-2.5 rounded-lg">
              <View>
                <Text className="text-[10px] text-text-base/60">
                  Thời gian nhịn
                </Text>
                <Text className="text-xs text-text-base/90 font-semibold mt-1">
                  {getLocalTodayStr(log.start_time)} ➔{" "}
                  {log.end_time
                    ? getLocalTodayStr(log.end_time).slice(5)
                    : "#####"}
                </Text>
              </View>

              <View className="items-end">
                <Text className="text-[10px] text-zinc-400">
                  Thực tế / Mục tiêu
                </Text>
                <View className="flex-row items-center gap-1.5 mt-1">
                  <Text
                    style={{
                      color:
                        isTargetSuccess !== null
                          ? isTargetSuccess
                            ? theme.success
                            : theme.error
                          : theme.primary,
                    }}
                    className="text-xs font-semibold"
                  >
                    {fixed(log.duration ? log.duration / 3600 : 0)}h
                  </Text>
                  {log.target_duration && (
                    <Text
                      style={{ color: target?.colors.accent }}
                      className="text-xs font-semibold"
                    >
                      {`/ ${log.target_duration ?? 0}h`}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Hàng 2: Trạng thái Tích lũy (Habit Snap & Shield Retain) */}
            <View className="flex-row justify-between items-center bg-zinc-800/40 p-2.5 rounded-lg">
              <View className="item-center">
                <Text className="text-[10px] text-zinc-400">Điểm Habit</Text>
                <Text className="text-sm text-emerald-400 font-bold mt-1">
                  {fixed(log.habit_snap ?? 0)}%
                </Text>
              </View>

              <View className="items-center">
                <Text className="text-[10px] text-zinc-400">Retain</Text>
                <Text className="text-sm text-blue-400 font-bold mt-1">
                  {fixed(log.habit_retain ?? 0)}%
                </Text>
              </View>

              <View className="item-center">
                <Text className="text-[10px] text-zinc-400">Số Khiên</Text>
                <View className="items-center justify-center flex-row gap-1 mt-1">
                  <FontAwesome5
                    name="shield-alt"
                    size={13}
                    color={theme.primary}
                  />
                  <Text className="text-sm text-amber-400 font-bold">
                    {log.shield_snap ?? 0}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

export default HabitBottomSheet;
