import { FastStatsSummary } from "@/database/shema/fast_sessions";
import { useAppStore } from "@/stores/appStore";
import { Text, View } from "react-native";

type StatCardProps = {
  icon: string;
  title: string;
  value: string | number;
  unit?: string;
  color?: string;
  isHero?: boolean;
};

// Component Card linh hoạt: hỗ trợ cả dạng Hero (nổi bật) và Normal
const StatCard = ({
  icon,
  title,
  value,
  unit,
  color = "#7F92F8",
  isHero,
}: StatCardProps) => {
  if (isHero) {
    return (
      <View className="mb-3 w-full flex-row items-center justify-between rounded-2xl border border-[#7F92F8]/30 bg-[#7F92F8]/10 p-4">
        <View className="flex-row items-center gap-3">
          <View
            style={{ backgroundColor: color + "25" }}
            className="h-11 w-11 items-center justify-center rounded-xl border border-[#7F92F8]/20"
          >
            <Text className="text-xl">{icon}</Text>
          </View>
          <View>
            <Text className="text-xs font-medium text-[#7F92F8] uppercase tracking-wider">
              {title}
            </Text>
            <View className="flex-row items-baseline gap-1">
              <Text className="text-2xl font-extrabold text-white">
                {value}
              </Text>
              {unit && (
                <Text className="text-xs font-semibold text-zinc-300">
                  {unit}
                </Text>
              )}
            </View>
          </View>
        </View>

        <View className="rounded-full bg-[#7F92F8]/20 px-3 py-1 border border-[#7F92F8]/30">
          <Text className="text-[11px] font-bold text-[#7F92F8]">
            Active 🔥
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="w-[48%] rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-3.5">
      <View className="mb-2.5 flex-row items-center gap-2">
        <View
          style={{ backgroundColor: color + "15" }}
          className="h-7 w-7 items-center justify-center rounded-lg"
        >
          <Text className="text-xs">{icon}</Text>
        </View>
        <Text
          className="text-[11px] font-medium text-zinc-400"
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>

      <View className="flex-row items-baseline gap-1">
        <Text className="text-xl font-bold text-white">{value}</Text>
        {unit && <Text className="text-[10px] text-zinc-500">{unit}</Text>}
      </View>
    </View>
  );
};

type Props = {
  fastStatistics: FastStatsSummary;
};

export const StatisticsSection = ({ fastStatistics }: Props) => {
  // Chuẩn hóa hệ màu: Ưu tiên Theme Primary (#7F92F8) & Accent có nghĩa
  const { userProfile } = useAppStore();
  const heroStat = {
    icon: "🔥",
    title: "Current streak",
    value: userProfile?.current_streak || 0,
    unit: "days",
    color: "#FB923C", // Lửa Cam giữ nguyên vì mang tính biểu tượng
  };

  const gridStats = [
    {
      icon: "⏱",
      title: "Total fasting",
      value: Math.round(fastStatistics.total_hours * 10) / 10,
      unit: "hours",
      color: "#7F92F8",
    },
    {
      icon: "✅",
      title: "Completed",
      value: fastStatistics.total_sessions,
      unit: "times",
      color: "#34D399",
    },
    {
      icon: "⭐",
      title: "Average fast",
      value: Math.round(fastStatistics.avg_hours * 10) / 10,
      unit: "hours",
      color: "#7F92F8",
    },
    {
      icon: "🏆",
      title: "Longest fast",
      value: Math.round(fastStatistics.max_hours * 10) / 10,
      unit: "hours",
      color: "#FBBF24",
    },
    {
      icon: "📅",
      title: "Active days",
      value: userProfile?.active_days || 0,
      unit: "days",
      color: "#7F92F8",
    },
    {
      icon: "📅",
      title: "Max streaks",
      value: userProfile?.max_streak || 0,
      unit: "days",
      color: "#7F92F8",
    },
  ];

  return (
    <View className="mt-5">
      <Text className="mb-3 text-base font-bold text-white">Statistics</Text>

      {/* Streak Hero Card */}
      <StatCard {...heroStat} isHero />

      {/* Remaining Stats Grid */}
      <View className="flex-row flex-wrap justify-between gap-y-2.5">
        {gridStats.map((item) => (
          <StatCard key={item.title} {...item} />
        ))}
      </View>
    </View>
  );
};
