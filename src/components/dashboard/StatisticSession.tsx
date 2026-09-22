import { FastStatsSummary } from "@/database/shema/fast_sessions";
import { useAppStore } from "@/stores/appStore";
import { View } from "react-native";
import { ThemedText } from "../themed-text";

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
      <View className="mb-3 w-full flex-row items-center justify-between rounded-2xl border border-primary/30 bg-primary/10 p-4">
        <View className="flex-row items-center gap-3">
          <View
            style={{ backgroundColor: color + "25" }}
            className="h-11 w-11 items-center justify-center rounded-xl border border-primary/20"
          >
            <ThemedText size="xl">{icon}</ThemedText>
          </View>

          <View>
            <ThemedText
              size="xs"
              weight="medium"
              color="primary"
              style={{
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              {title}
            </ThemedText>

            <View className="flex-row items-baseline gap-1">
              <ThemedText size="xxl" weight="bold" color="text">
                {value}
              </ThemedText>

              {unit && (
                <ThemedText
                  size="xs"
                  weight="semibold"
                  color="text"
                  opacity="medium"
                >
                  {unit}
                </ThemedText>
              )}
            </View>
          </View>
        </View>

        <View className="rounded-full border border-primary/30 bg-primary/20 px-3 py-1">
          <ThemedText size="xxs" weight="bold" color="primary">
            Active 🔥
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View className="w-[48%] rounded-2xl border border-text-base/10 bg-background2/80 p-3.5">
      <View className="mb-2.5 flex-row items-center gap-2">
        <View
          style={{ backgroundColor: color + "15" }}
          className="h-7 w-7 items-center justify-center rounded-lg"
        >
          <ThemedText size="xs">{icon}</ThemedText>
        </View>

        <ThemedText
          size="xs"
          weight="medium"
          color="text"
          opacity="medium"
          numberOfLines={1}
        >
          {title}
        </ThemedText>
      </View>

      <View className="flex-row items-baseline gap-1">
        <ThemedText size="lg" weight="bold" color="text">
          {value}
        </ThemedText>

        {unit && (
          <ThemedText size="tiny" color="text" opacity="medium">
            {unit}
          </ThemedText>
        )}
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
      <ThemedText weight="bold" className="mb-3 text-text-base">
        Statistics
      </ThemedText>

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
