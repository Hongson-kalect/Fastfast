import { FastStatsSummary } from "@/database/shema/fast_sessions";
import { useAppStore } from "@/stores/appStore";
import { Ionicons } from "@expo/vector-icons";
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
            {/* <ThemedText size="xl">{icon}</ThemedText> */}
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
    <View className="w-[48%] rounded-2xl bg-background2 p-3.5">
      <View className="mb-2.5 flex-row items-center gap-2">
        <View
          className="h-7 w-7 items-center justify-center rounded-lg"
          style={{
            backgroundColor: color + "15",
          }}
        >
          <Ionicons name={icon} size={16} color={color} />
          {/* <ThemedText size="xs">{icon}</ThemedText> */}
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
  const heroStat = {
    icon: "flame",
    title: "Current streak",
    value: userProfile?.current_streak || 0,
    unit: "days",
    color: theme.warning,
  };

  const gridStats = [
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

  return (
    <View className="mt-5">
      <View className="mb-4">
        <ThemedText size="md" weight="bold" color="title">
          Statistics
        </ThemedText>

        <ThemedText size="xxs" color="text" opacity="low" className="mt-0.5">
          Your fasting and habit overview
        </ThemedText>
      </View>

      <StatCard {...heroStat} isHero />

      <View className="flex-row flex-wrap justify-between gap-y-2.5">
        {gridStats.map((item) => (
          <StatCard key={item.title} {...item} />
        ))}
      </View>
    </View>
  );
};
