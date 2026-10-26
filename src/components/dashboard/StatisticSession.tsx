import { RADIUS } from "@/constants/design";
import { FastStatsSummary } from "@/database/schema/fast_sessions";
import { SectionTitle } from "../SectionTitle";
import { useAppStore } from "@/stores/appStore";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { ThemedText } from "../themed-text";

type StatCardProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
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
  const { theme } = useAppStore();
  if (isHero) {
    return (
      <View
        className="mb-3 w-full flex-row items-center justify-between rounded-2xl p-4"
        style={{
          backgroundColor: theme.primary + "12",
        }}
      >
        <View className="flex-row items-center gap-3">
          <View
            className="h-11 w-11 items-center justify-center rounded-xl"
            style={{
              backgroundColor: color + "20",
            }}
          >
            <Ionicons name="sparkles" size={24} color={color} />
          </View>

          <View>
            <ThemedText
              size="xxs"
              weight="semibold"
              color="primary"
              style={{
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              {title}
            </ThemedText>

            <View className="flex-row items-baseline gap-1">
              <ThemedText size="xxl" weight="bold" color="title">
                {value}
              </ThemedText>

              {unit && (
                <ThemedText
                  size="xs"
                  weight="medium"
                  color="text"
                  opacity="medium"
                >
                  {unit}
                </ThemedText>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  }
  return (
    <View
      className="w-[48.5%] bg-card p-4"
      style={{
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: theme.text + "0F",
      }}
    >
      <View className="mb-2.5 flex-row items-center gap-2">
        <View
          className="h-7 w-7 items-center justify-center rounded-lg"
          style={{
            backgroundColor: color + "15",
          }}
        >
          <Ionicons name={icon} size={16} color={color} />
        </View>

        <ThemedText
          size="xs"
          weight="medium"
          opacity="medium"
          numberOfLines={1}
          className="flex-1"
        >
          {title}
        </ThemedText>
      </View>

      <View className="flex-row items-baseline gap-1">
        <ThemedText size="lg" weight="bold" color="title">
          {value}
        </ThemedText>

        {unit && (
          <ThemedText size="tiny" color="text" opacity="half">
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
  const { userProfile, theme } = useAppStore();
  const gridStats: StatCardProps[] = [
    {
      icon: "timer-outline",
      title: "Total fasting",
      value: Math.round(fastStatistics.total_hours * 10) / 10,
      unit: "hours",
      color: theme.primary,
    },
    {
      icon: "checkmark-circle-outline",
      title: "Completed",
      value: fastStatistics.total_sessions,
      unit: "times",
      color: theme.success,
    },
    {
      icon: "time-outline",
      title: "Average fast",
      value: Math.round(fastStatistics.avg_hours * 10) / 10,
      unit: "hours",
      color: theme.primary,
    },
    {
      icon: "trophy-outline",
      title: "Longest fast",
      value: Math.round(fastStatistics.max_hours * 10) / 10,
      unit: "hours",
      color: theme.warning,
    },
    {
      icon: "calendar-outline",
      title: "Active days",
      value: userProfile?.active_days || 0,
      unit: "days",
      color: theme.primary,
    },
    {
      icon: "flame-outline",
      title: "Max streak",
      value: userProfile?.max_streak || 0,
      unit: "days",
      color: theme.primary,
    },
  ];

  // Streak đã có card riêng (StreakHero) ở đầu Dashboard → thay ô Max streak bằng số khiên đã dùng
  const stats: StatCardProps[] = [
    ...gridStats.filter((item) => item.title !== "Max streak"),
    {
      icon: "shield-checkmark-outline",
      title: "Shields used",
      value: userProfile?.total_shield_used || 0,
      unit: "times",
      color: theme.info,
    },
  ];

  return (
    <View className="mt-7">
      <SectionTitle title="Thống kê" />

      <View className="flex-row flex-wrap justify-between gap-y-3">
        {stats.map((item) => (
          <StatCard key={item.title} {...item} />
        ))}
      </View>
    </View>
  );
};
