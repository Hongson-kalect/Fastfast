import { FASTING_TARGETS } from "@/constants/data";
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

const getTarget = (targetHours: number) => {
  return FASTING_TARGETS.find(
    (item) =>
      targetHours >= item.hours &&
      (item.toHours == null || targetHours < item.toHours),
  );
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
    <View className="mt-5 bg-zinc-900 rounded-2xl border border-white/5 px-4 py-5">
      <View className="flex-row items-center">
        <View className="absolute bottom-2 -left-4">
          <Text
            style={{ color: color }}
            className=" opaciry-70 text-sm font-bold"
          >
            {startDate.getHours().toString().padStart(2, "0")}
          </Text>
        </View>
        <View className="absolute bottom-2 -right-4">
          <Text
            style={{ color: color }}
            className=" opaciry-70 text-sm font-bold"
          >
            {endDate ? endDate.getHours().toString().padStart(2, "0") : "Now"}
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
                  className={`h-2.5 ${isStart ? "rounded-l-full" : isLast ? "rounded-r-full" : ""}`}
                  style={{
                    backgroundColor: color,
                    opacity: index % 2 === 0 ? 1 : 0.68,
                    marginLeft: index === 0 ? 0 : 3,
                    marginRight: isLast ? 0 : 3,
                  }}
                />
                <View className="absolute left-0 right-0 bottom-2 items-center">
                  <Text
                    className="text-white/60 text-[10px] "
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
  const start = useMemo(() => new Date(fast.start_time), [fast.start_time]);

  const end = useMemo(
    () => (fast.end_time ? new Date(fast.end_time) : null),
    [fast.end_time],
  );

  const durationHours = fast.duration / S_PER_HOUR;

  const targetHours = fast.target_duration;

  const target = useMemo(() => getTarget(targetHours), [targetHours]);

  const targetColor = target?.colors.accent ?? "#34D399";

  const progress = targetHours > 0 ? durationHours / targetHours : 0;

  const percent = Math.round(progress * 100);

  const reached = durationHours >= targetHours;

  const status =
    fast.status === "active"
      ? "Đang nhịn"
      : reached
        ? "Đã đạt mục tiêu"
        : "Chưa đạt mục tiêu";

  const statusColor =
    fast.status === "active" ? "#34D399" : reached ? targetColor : "#FB7185";

  const difference = Math.abs(durationHours - targetHours);

  const parts = splitSessionIntoDays(
    fast.start_time,
    fast.end_time || Date.now(),
    fast.id,
  );

  return (
    <View>
      <View className="items-center pt-2">
        {target && (
          <View
            className="flex-row items-center px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: target.colors.badgeBg,
            }}
          >
            <Text className="text-base mr-1.5">{target.emoji} </Text>
            <Text
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{
                color: target.colors.badgeText,
              }}
            >
              {target.label}
            </Text>
          </View>
        )}

        <Text className="text-white text-4xl font-bold tracking-tight mt-3">
          {formatDuration(durationHours)}
        </Text>

        <Text
          className="text-xs font-semibold mt-1"
          style={{ color: statusColor }}
        >
          {status}
        </Text>
      </View>
      <Timeline
        start={fast.start_time}
        end={fast.end_time}
        durationHours={durationHours}
        color={targetColor}
      />
      {target && (
        <View
          className="mt-4 rounded-2xl border p-4"
          style={{
            borderColor: `${targetColor}25`,
            backgroundColor: `${targetColor}08`,
          }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text
                className="text-sm font-bold"
                style={{
                  color: targetColor,
                }}
              >
                {target.title}
              </Text>

              <Text className="text-zinc-500 text-[10px] mt-1">
                {target.hours}h target
              </Text>
            </View>

            <Text
              className="text-xl font-bold"
              style={{
                color: targetColor,
              }}
            >
              {percent}%
            </Text>
          </View>

          <View className="h-2 bg-zinc-900 rounded-full overflow-hidden mt-4">
            <View
              className="h-full rounded-full"
              style={{
                width: `${Math.min(percent, 100)}%`,
                backgroundColor: targetColor,
              }}
            />
          </View>

          <View className="flex-row justify-between mt-2">
            <Text className="text-zinc-600 text-[10px]">
              {formatDuration(durationHours)}
            </Text>

            <Text
              className="text-[10px] font-medium"
              style={{
                color: targetColor,
              }}
            >
              {reached
                ? `Vượt ${formatSignedDuration(difference)}`
                : `Còn ${formatDuration(difference)}`}
            </Text>
          </View>

          <Text className="text-zinc-500 text-xs leading-5 mt-4">
            {target.description}
          </Text>
        </View>
      )}

      {fast.rating && (
        <View className="mt-5">
          <Text className="text-zinc-600 text-[10px] font-semibold uppercase tracking-[1.5px] mb-3">
            Rating
          </Text>

          <View className="bg-zinc-900 rounded-2xl border border-white/5 px-4 py-4">
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">
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
      {target && (
        <View className="mt-5">
          <Text className="text-zinc-600 text-[10px] font-semibold uppercase tracking-[1.5px] mb-3">
            About this target
          </Text>

          <View className="bg-zinc-900 rounded-2xl border border-white/5 px-4 py-4">
            <Text className="text-white text-sm font-semibold">
              {target.title}
            </Text>

            <Text className="text-zinc-500 text-xs leading-5 mt-2">
              {target.adviceLong}
            </Text>
          </View>
        </View>
      )}
      {fast.home_data_snapshot && (
        <View className="mt-5">
          <Text className="text-zinc-600 text-[10px] font-semibold uppercase tracking-[1.5px] mb-3">
            Home data
          </Text>

          <View className="bg-zinc-900 rounded-2xl border border-white/5 px-4 py-4">
            <Text className="text-zinc-500 text-xs leading-5" numberOfLines={8}>
              {fast.home_data_snapshot}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
