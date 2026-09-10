import { DailyLog, FastSession } from "@/interfaces/db.type";
import useModalStore from "@/stores/modalStore";
import { DissectedDay } from "@/util/home/timespliter";
import { formatHour, getLocalTodayStr } from "@/util/timer";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { FastDetail } from "../fast_detail";
import { DEBUG_COLORS } from "./Circular24hTimeline";

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
  if (!fast) {
    return (
      <View className="bg-zinc-900/80 rounded-2xl border border-white/5 px-4 py-3">
        <View className="flex-row items-center">
          <ActivityIndicator size="small" color="#71717a" />
          <Text className="text-zinc-500 text-xs ml-3">
            Đang tải phiên nhịn...
          </Text>
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
        "bg-zinc-900 rounded-2xl",
        "border border-white/5",
        "px-4 py-3",
        isActive ? "border-emerald-400/15" : "",
      ].join(" ")}
    >
      {/* Session header */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View
            className="w-2 h-2 rounded-full mr-2.5"
            style={{ backgroundColor: accentColor }}
          />
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text
                className="text-white text-sm font-semibold"
                numberOfLines={1}
              >
                {startTime}
                {end && (
                  <>
                    {" → "} {endTime}
                  </>
                )}
              </Text>
              {dateRange && (
                <Text className="text-zinc-500 text-[10px] font-normal ml-2">
                  {dateRange}
                </Text>
              )}
            </View>
          </View>
        </View>
        <Text className="text-zinc-400 text-xs font-medium ml-3">
          {formatHour(actualDurationHours)}
        </Text>
      </View>
      {/* Today's contribution — hero */}
      <View className="mt-2.5 pt-2.5 border-t border-white/5">
        <View className="flex-row items-end justify-between">
          <View className="flex-row items-baseline">
            <Text
              style={{ color: contributionHours > 0 ? accentColor : "#71717A" }}
              className="text-2xl font-bold tracking-tight"
            >
              {contributionHours > 0 ? `+${contributionHours.toFixed(1)}` : "0"}
            </Text>
            <Text
              style={{
                color: contributionHours > 0 ? accentColor : "#71717A",
                opacity: 0.55,
              }}
              className="text-[10px] font-medium ml-1"
            >
              hours today
            </Text>
          </View>
          {targetDurationHours > 0 && (
            <Text className="text-zinc-600 text-[9px]">
              mục tiêu {targetDurationHours}h
            </Text>
          )}
        </View>
        {/* Progress */}
        {targetDurationHours > 0 && (
          <View className="mt-2">
            <View className="h-1 bg-zinc-800 rounded-full overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${progress * 100}%`,
                  backgroundColor: isFailed ? "#FB7185" : accentColor,
                }}
              />
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
}
