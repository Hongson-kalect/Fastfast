import { useAppStore } from "@/stores/appStore";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import Waterball from "./Waterball";

interface HabitHistoryItem {
  id: string;
  date: string;
  targetName: string;
  durationHours: number;
  habitPointsGained: number;
  usedShield?: boolean;
}

const MOCK_HISTORY: HabitHistoryItem[] = [
  {
    id: "1",
    date: "Hôm nay, 10:00",
    targetName: "Warrior 20H",
    durationHours: 23.9,
    habitPointsGained: 4.4,
  },
  {
    id: "2",
    date: "Hôm qua, 18:00",
    targetName: "18:6 Fast",
    durationHours: 18.2,
    habitPointsGained: 3.5,
  },
  {
    id: "3",
    date: "05/08, 12:00",
    targetName: "16:8 Fast",
    durationHours: 16.0,
    habitPointsGained: 3.0,
  },
  {
    id: "4",
    date: "04/08, 20:00",
    targetName: "Warrior 20H",
    durationHours: 14.5,
    habitPointsGained: 0,
    usedShield: true,
  },
  {
    id: "5",
    date: "03/08, 19:00",
    targetName: "OMAD 24H",
    durationHours: 24.1,
    habitPointsGained: 5.0,
  },
];

interface HabitBottomSheetProps {
  habitPercent?: number; // Ví dụ: 45% (0 -> 100)
  shieldCount?: number;
  onClose?: () => void;
}

const HabitBottomSheet: React.FC<HabitBottomSheetProps> = ({
  habitPercent = 45,
  shieldCount = 1,
  onClose,
}) => {
  const [showAllHistory, setShowAllHistory] = useState(false);
  const { theme } = useAppStore();

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

  return (
    <View className="bg-[#121318] px-5 pt-4 pb-8 rounded-t-4xl w-full border-t border-white/10">
      {/* Handle bar */}
      <View className="w-12 h-1.5 bg-zinc-700 rounded-full self-center mb-4 opacity-60" />

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
            <FontAwesome5 name="shield-alt" size={16} color={theme.success} />
          </View>
        </View>
      </View>

      {/* 2. HERO: VÒNG TRÒN % Ở CHÍNH GIỮA */}
      <View className="items-center my-3">
        {/* <View className="w-24 h-24 rounded-full bg-zinc-900 border-2 border-primary/50 items-center justify-center relative overflow-hidden shadow-lg shadow-primary/20">
          <View
            className="absolute bottom-0 w-full bg-primary/70"
            style={{ height: `${Math.min(habitPercent, 100)}%` }}
          >
            <View className="h-1.5 bg-primary/40 w-full" />
          </View>

          <Text className="text-2xl font-black text-white z-10">
            {habitPercent}
          </Text>
          <Text className="text-sm text-white opacity-70 z-10 absolute bottom-3 left-1/2 translate-x-[-50%]">
            %
          </Text>
        </View> */}
        <Waterball
          percent={100}
          color={theme.primary}
          retainPercent={45} // Ví dụ: 45% (Đang tích được 45% cho Shield tiếp theo)
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
            Tiến trình mốc phần thưởng
          </Text>
          {/* <Text className="text-xs text-blue-400 font-medium">
            Khiên đang có: 🛡️ {shieldCount}
          </Text> */}
        </View>

        {/* Thanh Progress Ngang (Chỉ để đo) */}
        <View className="relative h-3 bg-zinc-800 rounded-full w-full overflow-hidden">
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

        <ScrollView className="max-h-48">
          {MOCK_HISTORY.map((item) => (
            <View
              key={item.id}
              className="flex-row justify-between items-center bg-zinc-900/40 p-3 rounded-xl mb-2 border border-white/5"
            >
              <View className="flex-row items-center gap-3">
                <View
                  className={`w-8 h-8 rounded-full items-center justify-center ${item.usedShield ? "bg-blue-500/20" : "bg-primary/20"}`}
                >
                  {item.usedShield ? (
                    <FontAwesome5 name="shield-alt" size={12} color="#60A5FA" />
                  ) : (
                    <Ionicons name="flame" size={14} color={theme.primary} />
                  )}
                </View>
                <View>
                  <Text className="text-xs font-semibold text-zinc-200">
                    {item.targetName} ({item.durationHours}h)
                  </Text>
                  <Text className="text-[10px] text-zinc-500">{item.date}</Text>
                </View>
              </View>

              {item.usedShield ? (
                <View className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30">
                  <Text className="text-[10px] text-blue-400 font-medium">
                    Đã dùng Khiên
                  </Text>
                </View>
              ) : (
                <Text className="text-xs font-bold text-emerald-400">
                  +{item.habitPointsGained}%
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

export default HabitBottomSheet;
