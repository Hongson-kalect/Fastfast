import { DailyLog, FastSession } from "@/interfaces/db.type";
import useModalStore from "@/stores/modalStore";
import { DissectedDay } from "@/util/home/timespliter";
import { formatHour, getLocalTodayStr } from "@/util/timer";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { FastDetail } from "../fast_detail";
import { DEBUG_COLORS } from "./Circular24hTimeline";
import { ThemedText } from "../themed-text";
import { useAppStore } from "@/stores/appStore";

type DailyFastSessionCardProps = {
  index?: number;
  fast: FastSession | null;
  dailyLog?: DailyLog | DissectedDay | null;
};
export function DailyFastSessionCard({
  index,
  fast,
  dailyLog,
}: DailyFastSessionCardProps) {
  const { addModal } = useModalStore();
  const {theme} = useAppStore();
  if (!fast) {
  return (
    <View className="rounded-2xl border border-text-base/5 bg-background2/80 px-4 py-3">
      <View className="flex-row items-center">
        <ActivityIndicator
          size="small"
          color={theme.text + "70"}
        />

        <ThemedText
          size="xs"
          color="text"
          opacity="medium"
          style={{ marginLeft: 12 }}
        >
          Đang tải phiên nhịn...
        </ThemedText>
      </View>
    </View>
  );
}

  const start = new Date(fast.start_time);
  const end = fast.end_time ? new Date(fast.end_time) : null;
  const actualDurationHours = fast.duration / 3600;
  const contributionHours = dailyLog?.hours_in_day ?? 0;
  const targetDurationHours = fast.target_duration ?? 0;
  const isActive = fast.status === "active" || !fast.end_time;
  const isFailed = fast.status === "failed";
  const formatTime = (date: Date) =>
    `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  const formatShortDate = (date: Date, showYear = false) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    if (showYear) {
      const year = date.getFullYear().toString().slice(-2);
      return `${day}/${month}/${year}`;
    }
    return `${day}/${month}`;
  };
  const startTime = formatTime(start);
  const endTime = end ? formatTime(end) : "Đang nhịn";
  const crossesDay =
    (!!end && start.getFullYear() !== end.getFullYear()) ||
    (!!end && start.getMonth() !== end.getMonth()) ||
    (!!end && start.getDate() !== end.getDate());
  const crossesYear = !!end && start.getFullYear() !== end.getFullYear();
  const dateRange = end
    ? crossesDay
      ? `${formatShortDate(start, crossesYear)} → ${formatShortDate(end, crossesYear)}`
      : null
    : null;

  const startDate = getLocalTodayStr(start);
  const endDate = end ? getLocalTodayStr(end) : null;
  const dateLabel = crossesDay ? `${startDate} → ${endDate}` : "Hôm nay";
  const accentColor = isActive
    ? "#34D399"
    : isFailed
      ? "#FB7185"
      : (DEBUG_COLORS[index ?? 0] ?? "#71717A");
  const progress =
    targetDurationHours > 0
      ? Math.min(contributionHours / actualDurationHours, 1)
      : 0;
  const openFastModal = () => {
    addModal({ type: "custom", render: <FastDetail fast={fast} /> });
  };
  return (
    <Pressable
  onPress={openFastModal}
  className={[
    "rounded-2xl bg-background2",
    "border border-text-base/5",
    "px-4 py-3",
    isActive ? "border-success/15" : "",
  ].join(" ")}
>
  {/* Session header */}
  <View className="flex-row items-center justify-between">
    <View className="flex-1 flex-row items-center">
      <View
        className="mr-2.5 h-2 w-2 rounded-full"
        style={{ backgroundColor: accentColor }}
      />

      <View className="flex-1">
        <View className="flex-row items-center">
          <ThemedText
            size="sm"
            weight="semibold"
            color="text"
            numberOfLines={1}
          >
            {startTime}
            {end && (
              <>
                {" → "} {endTime}
              </>
            )}
          </ThemedText>

          {dateRange && (
            <ThemedText
              size="xxs"
              color="text"
              opacity="medium"
              style={{ marginLeft: 8 }}
            >
              {dateRange}
            </ThemedText>
          )}
        </View>
      </View>
    </View>

    <ThemedText
      size="xs"
      weight="medium"
      color="text"
      opacity="medium"
      style={{ marginLeft: 12 }}
    >
      {formatHour(actualDurationHours)}
    </ThemedText>
  </View>

  {/* Today's contribution — hero */}
  <View className="mt-2.5 border-t border-text-base/5 pt-2.5">
    <View className="flex-row items-end justify-between">
      <View className="flex-row items-baseline">
        <ThemedText
          size="xxl"
          weight="bold"
          colorHex={contributionHours > 0 ? accentColor : theme.text + "40"}
        >
          {contributionHours > 0
            ? `+${contributionHours.toFixed(1)}`
            : "0"}
        </ThemedText>

        <ThemedText
          size="xxs"
          weight="medium"
          colorHex={contributionHours > 0 ? accentColor : theme.text}
          opacity={contributionHours > 0 ? "medium" : "fade"}
          style={{ marginLeft: 4 }}
        >
          hours today
        </ThemedText>
      </View>

      {targetDurationHours > 0 && (
        <ThemedText
          size="tiny"
          color="text"
          opacity="low"
        >
          mục tiêu {targetDurationHours}h
        </ThemedText>
      )}
    </View>

    {/* Progress */}
    {targetDurationHours > 0 && (
      <View className="mt-2">
        <View className="h-1 overflow-hidden rounded-full bg-background">
          <View
            className="h-full rounded-full"
            style={{
              width: `${progress * 100}%`,
              backgroundColor: isFailed ? theme.error : accentColor,
            }}
          />
        </View>
      </View>
    )}
  </View>
</Pressable>
  );
}
