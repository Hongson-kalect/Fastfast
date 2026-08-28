import { DailyLog, FastSession } from "@/interfaces/db.type";
import useModalStore from "@/stores/modalStore";
import { DissectedDay } from "@/util/home/timespliter";
import { formatHour, getLocalTodayStr } from "@/util/timer";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { FastDetail } from "../fast_detail";

type DailyFastSessionCardProps = {
  fast: FastSession | null;
  dailyLog?: DailyLog | DissectedDay | null;
};

export function DailyFastSessionCard({
  fast,
  dailyLog,
}: DailyFastSessionCardProps) {
  const { addModal } = useModalStore();

  if (!fast) {
    return (
      <View className="bg-zinc-900/80 rounded-2xl border border-white/5 px-4 py-4">
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

  const startTime = `${new Date(start).getHours().toString().padStart(2, "0")}:${new Date(
    start,
  )
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;

  const endTime = end
    ? `${new Date(end).getHours().toString().padStart(2, "0")}:${new Date(end).getMinutes().toString().padStart(2, "0")}`
    : "Đang nhịn";

  const startDate = getLocalTodayStr(start);

  const endDate = end ? getLocalTodayStr(end) : null;

  const crossesDay = !!endDate && startDate !== endDate;

  const dateLabel = crossesDay ? `${startDate} → ${endDate}` : "Hôm nay";

  const accentColor = isActive ? "#34D399" : isFailed ? "#FB7185" : "#71717A";

  const progress =
    targetDurationHours > 0
      ? Math.min(contributionHours / actualDurationHours, 1)
      : 0;

  const openFastModal = () => {
    addModal({
      type: "custom",
      render: <FastDetail fast={fast} />,
    });
  };
  return (
    <Pressable
      onPress={openFastModal}
      className={[
        "bg-zinc-900 rounded-2xl",
        "border border-white/5",
        "px-4 py-4",
        isActive ? "border-emerald-400/15" : "",
      ].join(" ")}
    >
      {/* Session */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View
            className="w-2.5 h-2.5 rounded-full mr-3"
            style={{
              backgroundColor: accentColor,
            }}
          />

          <View className="flex-1">
            <Text
              className="text-white text-[15px] font-semibold"
              numberOfLines={1}
            >
              {startTime}
              {"  →  "}
              {endTime}
            </Text>

            <Text className="text-zinc-600 text-[10px] mt-1">{dateLabel}</Text>
          </View>
        </View>
        <View className="items-end ml-4">
          <Text className="text-zinc-300 text-sm font-semibold">
            {formatHour(actualDurationHours)}
          </Text>

          <Text className="text-zinc-600 text-[9px] uppercase tracking-wider mt-0.5">
            Session
          </Text>
        </View>
      </View>
      {/* Daily contribution */}
      <View className="mt-4 pt-3 border-t border-white/5">
        <Text className="text-zinc-600 text-[9px] font-semibold uppercase tracking-[1.5px]">
          Fasted today
        </Text>

        <View className="flex-row items-baseline mt-0.5">
          <Text
            className={[
              "text-2xl font-bold tracking-tight",
              contributionHours > 0 ? "text-emerald-400" : "text-zinc-500",
            ].join(" ")}
          >
            {contributionHours > 0 ? `+${contributionHours.toFixed(1)}` : "0"}
          </Text>

          <Text
            className={[
              "text-xs font-medium ml-1",
              contributionHours > 0 ? "text-emerald-400/60" : "text-zinc-600",
            ].join(" ")}
          >
            hours
          </Text>
        </View>

        {/* Target */}
        {targetDurationHours > 0 && (
          <View className="mt-3">
            <View className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <View
                className={[
                  "h-full rounded-full",
                  isFailed ? "bg-rose-400/60" : "bg-emerald-400",
                ].join(" ")}
                style={{
                  width: `${progress * 100}%`,
                }}
              />
            </View>

            <View className="flex-row justify-between mt-1.5">
              <Text className="text-zinc-700 text-[9px]">
                {formatHour(actualDurationHours)}
              </Text>

              <Text className="text-zinc-700 text-[9px]">
                mục tiêu {targetDurationHours}
              </Text>
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
}
