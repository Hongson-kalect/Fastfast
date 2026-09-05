import { FASTING_TARGETS, getTarget } from "@/constants/data";
import { FastSession } from "@/interfaces/db.type";
import { splitSessionIntoDays } from "@/util/home/timespliter";
import { useMemo } from "react";
import { Text, View } from "react-native";

type FastDetailProps = {
  fast: FastSession;
};

const S_PER_HOUR = 60 * 60;

const formatDate = (date: Date) =>
  date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatTime = (date: Date) =>
  date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

const formatDuration = (hours: number) => {
  if (hours <= 0) return "0m";

  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;

  return `${h}h ${m}m`;
};

const formatSignedDuration = (hours: number) => {
  if (hours <= 0) return "0m";

  return `+${formatDuration(hours)}`;
};

function formatDayDuration(hours: number) {
  return `${Number(hours.toFixed(1))}h`;
}
function formatTimelineDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${month}/${day}`;
}

function Timeline({
  start,
  end,
  durationHours,
  color,
}: {
  start: number;
  end: number | null;
  durationHours: number;
  color: string;
}) {
  const effectiveEnd = end ?? Date.now();
  const parts = useMemo(
    () => splitSessionIntoDays(start, effectiveEnd, "fast"),
    [start, effectiveEnd],
  );
  const validParts = parts.filter((part) => part.hours_in_day > 0);
  const totalTimelineHours = validParts.reduce(
    (sum, part) => sum + part.hours_in_day,
    0,
  );
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;
  return (
    <View className="m3-5 bg-zinc-900 rounded-2xl border border-white/5 px-4 py-2">
      <View className="flex-row items-center">
        <View className="absolute bottom-3 -left-3">
          <Text
            style={{ color: color }}
            className=" opaciry-70 text-xs font-semibold"
          >
            {startDate.getHours().toString()}h
          </Text>
        </View>
        <View className="absolute bottom-3 -right-3">
          <Text
            style={{ color: color }}
            className=" opaciry-70 text-xs font-semibold"
          >
            {endDate ? endDate.getHours().toString() + "h" : "Now"}
          </Text>
        </View>
        <View className="flex-1 flex-row items-center h-[58px]">
          {validParts.map((part, index) => {
            const ratio =
              totalTimelineHours > 0
                ? part.hours_in_day / totalTimelineHours
                : 0;
            const isLast = index === validParts.length - 1;
            const isStart = index === 0;
            return (
              <View
                key={`${part.fast_id}-${part.log_date}`}
                className="relative h-full justify-center"
                style={{ flexGrow: ratio, flexBasis: 0, minWidth: 32 }}
              >
                <View className="absolute left-0 right-0 top-0 items-center">
                  <Text
                    className="text-zinc-500 text-[9px] font-semibold"
                    numberOfLines={1}
                  >
                    {formatTimelineDate(part.log_date)}
                  </Text>
                </View>
                <View
                  className={`h-2.5 ${isStart && "rounded-l-full"} ${isLast && "rounded-r-full"}`}
                  style={{
                    backgroundColor: color,
                    opacity: index % 2 === 0 ? 1 : 0.68,
                    marginLeft: index === 0 ? 0 : 3,
                    marginRight: isLast ? 0 : 3,
                  }}
                />
                <View className="absolute left-0 right-0 bottom-2 items-center">
                  <Text
                    className="text-text-base/40 text-[9px] font-light"
                    numberOfLines={1}
                  >
                    {formatDayDuration(part.hours_in_day)}
                  </Text>
                </View>
                {/* Day separator */}
                {!isLast && (
                  <View className="absolute right-0 top-2 bottom-2 items-center">
                    <View className="w-px flex-1 bg-white/15" />
                    <View
                      className="absolute w-1 h-1 rounded-full"
                      style={{ backgroundColor: color, opacity: 0.55 }}
                    />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function InfoRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3.5 border-b border-white/5 last:border-b-0">
      <Text className="text-zinc-500 text-xs">{label} </Text>
      <Text
        className="text-xs font-semibold"
        style={{
          color: accent ?? "#E4E4E7",
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export function FastDetail({ fast }: FastDetailProps) {
  const durationHours = fast.duration / S_PER_HOUR;
  const targetHours = fast.target_duration;

  const target = useMemo(() => getTarget(targetHours), [targetHours]);

  const targetColor = target?.colors.accent ?? "#34D399";

  const progress = targetHours > 0 ? durationHours / targetHours : 0;

  const percent = Math.round(progress * 100);
  const reached = durationHours >= targetHours;

  
  const status =
  fast?.status==='failed'?'Bị Hủy':
  !fast?.end_time
  ? "Đang nhịn"
  : reached
  ? "Đã đạt mục tiêu"
  : "Chưa đạt mục tiêu";
  
  const statusColor =
    fast.status === "active" ? "#34D399" : reached ? targetColor : "#FB7185";

  const difference = Math.abs(durationHours - targetHours);

  return (
    <View className="pb-2">
      {/* Header */}
      <View className="flex-row items-center justify-between px-1 pt-1">
        {/* Left */}
        <View className="flex-1 mr-4">
          {target && (
            <View
              className="self-start flex-row items-center px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: target.colors.badgeBg,
              }}
            >
              <Text className="text-sm mr-1">{target.emoji}</Text>

              <Text
                className="text-[9px] font-bold uppercase tracking-wider"
                style={{
                  color: target.colors.badgeText,
                }}
              >
                {target.label}
              </Text>
            </View>
          )}

          <Text
            className="text-xs font-semibold mt-2"
            style={{ color: statusColor }}
          >
            {status}
          </Text>
        </View>

        {/* Duration */}
        <Text className="text-white text-4xl font-bold tracking-tight">
          {formatDuration(durationHours)}
        </Text>
      </View>

      {/* Timeline */}
      <View className="mt-3">
        <Timeline
          start={fast.start_time}
          end={fast.end_time}
          durationHours={durationHours}
          color={targetColor}
        />
      </View>

      {/* Target */}
      {target && (
        <View
          className="mt-3 rounded-2xl border px-4 py-3"
          style={{
            borderColor: `${targetColor}25`,
            backgroundColor: `${targetColor}08`,
          }}
        >
          {/* Target header */}
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-3">
              <Text
                className="text-sm font-bold"
                style={{ color: targetColor }}
                numberOfLines={1}
              >
                {target.title}
              </Text>

              <Text className="text-zinc-600 text-[10px] mt-0.5">
                {target.hours}h target
              </Text>
            </View>

            <Text className="text-lg font-bold" style={{ color: targetColor }}>
              {percent}%
            </Text>
          </View>

          {/* Progress */}
          <View className="h-1.5 bg-zinc-900 rounded-full overflow-hidden mt-3">
            <View
              className="h-full rounded-full"
              style={{
                width: `${Math.min(percent, 100)}%`,
                backgroundColor: targetColor,
              }}
            />
          </View>

          {/* Progress labels */}
          <View className="flex-row justify-between mt-1.5">
            <Text className="text-zinc-600 text-[10px]">
              {formatDuration(durationHours)}
            </Text>

            <Text
              className="text-[10px] font-medium"
              style={{ color: targetColor }}
            >
              {reached
                ? `Vượt ${formatSignedDuration(difference)}`
                : `Còn ${formatDuration(difference)}`}
            </Text>
          </View>

          <Text className="text-zinc-500 text-[11px] leading-4 mt-3">
            {target.description}
          </Text>
        </View>
      )}

      {/* Rating */}
      {fast.rating && (
        <View className="mt-4">
          <Text className="text-zinc-600 text-[9px] font-semibold uppercase tracking-[1.5px] mb-2">
            Rating
          </Text>

          <View className="bg-zinc-900 rounded-2xl border border-white/5 px-4 py-3">
            <View className="flex-row items-center">
              <Text className="text-xl mr-3">
                {fast.rating === "Excellent"
                  ? "🏆"
                  : fast.rating === "Good"
                    ? "👍"
                    : "—"}
              </Text>

              <View>
                <Text className="text-white text-sm font-semibold">
                  {fast.rating}
                </Text>

                <Text className="text-zinc-600 text-[10px] mt-0.5">
                  Đánh giá phiên nhịn
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* About target */}
      {target && (
        <View className="mt-4">
          <Text className="text-zinc-600 text-[9px] font-semibold uppercase tracking-[1.5px] mb-2">
            About this target
          </Text>

          <View className="bg-zinc-900 rounded-2xl border border-white/5 px-4 py-3">
            <Text className="text-white text-sm font-semibold">
              {target.title}
            </Text>

            <Text className="text-zinc-500 text-[11px] leading-4 mt-1.5">
              {target.adviceLong}
            </Text>
          </View>
        </View>
      )}

      {/* Home data */}
      {fast.home_data_snapshot && (
        <View className="mt-4">
          <Text className="text-zinc-600 text-[9px] font-semibold uppercase tracking-[1.5px] mb-2">
            Home data
          </Text>

          <View className="bg-zinc-900 rounded-2xl border border-white/5 px-4 py-3">
            <Text
              className="text-zinc-500 text-[11px] leading-4"
              numberOfLines={6}
            >
              {fast.home_data_snapshot}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
