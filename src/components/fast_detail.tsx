import { getTarget } from "@/constants/data";
import { FastSession } from "@/interfaces/db.type";
import { useAppStore } from "@/stores/appStore";
import { splitSessionIntoDays } from "@/util/home/timespliter";
import { getLocalTodayStr } from "@/util/timer";
import { useMemo } from "react";
import { View } from "react-native";
import { ThemedText } from "./themed-text";

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
  status,
}: {
  start: number;
  end: number | null;
  durationHours: number;
  color: string;
  status: string;
}) {
  const isActive = status === "active";

  // Chỉ dùng "now" cho session đang active.
  // Session không active nhưng thiếu endTime thì không nên kéo tới thời điểm hiện tại.
  const effectiveEnd = isActive ? (end ?? Date.now()) : (end ?? start);

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

  // Nếu start === end hoặc duration quá nhỏ,
  // vẫn render một thanh có kích thước tối thiểu.
  const hasProgress = validParts.length > 0;
  const displayParts =
    validParts.length > 0
      ? validParts
      : [
          {
            fast_id: `empty-${start}`,
            log_date: getLocalTodayStr(startDate),
            hours_in_day: 0,
          },
        ];

  const displayTotalHours = totalTimelineHours > 0 ? totalTimelineHours : 1;

  return (
    <View className="m-3.5 rounded-xl border border-text-base/5 bg-background2 px-4 py-2">
      <View className="flex-row items-center">
        {/* Start time */}
        <View className="absolute bottom-3 -left-3">
          <ThemedText
            size="xs"
            weight="semibold"
            colorHex={color}
            opacity="medium"
          >
            {startDate.getHours()}h
          </ThemedText>
        </View>

        {/* End time */}
        <View className="absolute bottom-3 -right-3">
          <ThemedText
            size="xs"
            weight="semibold"
            colorHex={color}
            opacity="medium"
          >
            {isActive && !end
              ? "Now"
              : endDate
                ? `${endDate.getHours()}h`
                : `${startDate.getHours()}h`}
          </ThemedText>
        </View>

        <View className="h-[58px] flex-1 flex-row items-center">
          {displayParts.map((part, index) => {
            const isPlaceholder = !hasProgress;

            const ratio = isPlaceholder
              ? 1
              : part.hours_in_day / displayTotalHours;

            const isLast = index === displayParts.length - 1;
            const isStart = index === 0;

            return (
              <View
                key={`${part.fast_id}-${part.log_date}`}
                className="relative h-full justify-center"
                style={{
                  flexGrow: ratio,
                  flexBasis: 0,
                  minWidth: 32,
                }}
              >
                {/* Date */}
                <View className="absolute left-0 right-0 top-0 items-center">
                  <ThemedText
                    size="tiny"
                    weight="semibold"
                    color="text"
                    opacity="medium"
                    numberOfLines={1}
                  >
                    {isPlaceholder
                      ? formatTimelineDate(getLocalTodayStr(start))
                      : formatTimelineDate(part.log_date)}
                  </ThemedText>
                </View>

                {/* Progress bar */}
                <View
                  className={`h-2.5 ${
                    isStart ? "rounded-l-full" : ""
                  } ${isLast ? "rounded-r-full" : ""}`}
                  style={{
                    backgroundColor: color,
                    opacity: isPlaceholder ? 0.35 : index % 2 === 0 ? 1 : 0.68,
                    marginLeft: index === 0 ? 0 : 3,
                    marginRight: isLast ? 0 : 3,
                  }}
                />

                {/* Duration */}
                <View className="absolute bottom-2 left-0 right-0 items-center">
                  <ThemedText
                    size="tiny"
                    weight="light"
                    color="text"
                    opacity="low"
                    numberOfLines={1}
                  >
                    {isPlaceholder
                      ? formatDayDuration(durationHours)
                      : formatDayDuration(part.hours_in_day)}
                  </ThemedText>
                </View>

                {/* Day separator */}
                {!isLast && (
                  <View className="absolute bottom-2 right-0 top-2 items-center">
                    <View className="w-px flex-1 bg-text-base/15" />

                    <View
                      className="absolute h-1 w-1 rounded-full"
                      style={{
                        backgroundColor: color,
                        opacity: 0.55,
                      }}
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

export function FastDetail({ fast }: FastDetailProps) {
  const durationHours = fast.duration / S_PER_HOUR;
  const targetHours = fast.target_duration;
  const { theme } = useAppStore();

  const target = useMemo(() => getTarget(targetHours), [targetHours]);
  const targetColor = target?.colors.accent ?? "#34D399";

  // Parse Home Data Snapshot an toàn
  const parsedSnapshot = useMemo(() => {
    if (!fast.home_data_snapshot) return null;
    try {
      return JSON.parse(fast.home_data_snapshot);
    } catch {
      return null;
    }
  }, [fast.home_data_snapshot]);

  const progress = targetHours > 0 ? durationHours / targetHours : 0;
  const percent = Math.round(progress * 100);
  const reached = durationHours >= targetHours;

  const status =
    fast?.status === "failed"
      ? "Bị Hủy"
      : !fast?.end_time
        ? "Đang nhịn"
        : reached
          ? "Đã đạt mục tiêu"
          : "Chưa đạt mục tiêu";

  const statusColor =
    fast.status === "failed"
      ? theme.error
      : fast.status === "active"
        ? theme.primary
        : reached
          ? targetColor
          : theme.warning;

  const difference = Math.abs(durationHours - targetHours);

  return (
    <View className="pb-4">
      {/* 1. Header Detail */}
      <View className="flex-row items-center justify-between px-1 pt-1">
        <View className="mr-4 flex-1">
          {target && (
            <View
              className="self-start flex-row items-center rounded-full px-2.5 py-1"
              style={{ backgroundColor: target.colors.accent + "40" }}
            >
              <ThemedText size="xs" style={{ marginRight: 4 }}>
                {target.emoji}
              </ThemedText>

              <ThemedText
                size="xxs"
                weight="bold"
                colorHex={target.colors.badgeText}
                style={{
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {target.label}
              </ThemedText>
            </View>
          )}

          <ThemedText
            size="xs"
            weight="bold"
            colorHex={statusColor}
            style={{ marginTop: 6 }}
          >
            {status}
          </ThemedText>
        </View>

        <ThemedText
          size="xxxl"
          weight="bold"
          color="text"
          style={{ letterSpacing: -0.5 }}
        >
          {formatDuration(durationHours)}
        </ThemedText>
      </View>

      {/* 2. Timeline Component */}
      <View className="mt-4">
        <Timeline
          start={fast.start_time}
          end={fast.end_time}
          durationHours={durationHours}
          color={targetColor}
          status={fast.status}
        />
      </View>

      {/* 3. Progress Card */}
      {target && (
        <View
          className="mt-4 rounded-xl border bg-background2/80 px-3 py-2"
          style={{ borderColor: `${targetColor}30` }}
        >
          <View className="flex-row items-center justify-between">
            <View className="mr-3 flex-1">
              <ThemedText
                size="sm"
                weight="bold"
                color="text"
                numberOfLines={1}
              >
                {target.title}
              </ThemedText>

              <ThemedText
                size="xxs"
                color="text"
                opacity="half"
                style={{ marginTop: 2 }}
              >
                Mục tiêu: {target.hours} giờ
              </ThemedText>
            </View>

            <ThemedText size="xl" weight="bold" colorHex={targetColor}>
              {percent}%
            </ThemedText>
          </View>

          {/* Progress Bar */}
          <View className="mt-3 h-2 overflow-hidden rounded-full bg-background2">
            <View
              className="h-full rounded-full"
              style={{
                width: `${Math.min(percent, 100)}%`,
                backgroundColor: targetColor,
              }}
            />
          </View>

          <View className="mt-2 flex-row justify-between">
            <ThemedText size="xxs" color="text" opacity="medium">
              {formatDuration(durationHours)}
            </ThemedText>

            <ThemedText size="xxs" weight="semibold" colorHex={targetColor}>
              {reached
                ? `Vượt ${formatSignedDuration(difference)}`
                : `Còn ${formatDuration(difference)}`}
            </ThemedText>
          </View>
        </View>
      )}

      {/* 4. Rating Section */}
      {fast.rating && (
        <View className="mt-4">
          <ThemedText
            size="xxs"
            weight="bold"
            color="text"
            opacity="medium"
            style={{
              textTransform: "uppercase",
              letterSpacing: 1.5,
              marginBottom: 6,
              paddingHorizontal: 4,
            }}
          >
            Đánh giá phiên
          </ThemedText>

          <View className="flex-row items-center rounded-xl border border-text-base/10 bg-background2 p-3.5">
            <ThemedText size="xxl" style={{ marginRight: 12 }}>
              {fast.rating === "Excellent"
                ? "🏆"
                : fast.rating === "Good"
                  ? "👍"
                  : "😮‍💨"}
            </ThemedText>

            <View>
              <ThemedText size="sm" weight="bold" color="text">
                {fast.rating}
              </ThemedText>

              <ThemedText size="xxs" color="text" opacity="medium">
                Trạng thái cơ thể lúc kết thúc
              </ThemedText>
            </View>
          </View>
        </View>
      )}

      {/* 5. Health Snapshot */}
      {parsedSnapshot && (
        <View className="mt-4">
          <ThemedText
            size="xxs"
            weight="bold"
            color="text"
            opacity="medium"
            style={{
              textTransform: "uppercase",
              letterSpacing: 1.5,
              marginBottom: 6,
              paddingHorizontal: 4,
            }}
          >
            Chỉ số ghi nhận
          </ThemedText>

          <View className="flex-row flex-wrap gap-2 rounded-xl border border-text-base/10 bg-background2 p-3.5">
            {Object.entries(parsedSnapshot).map(([key, val]) => (
              <View
                key={key}
                className="rounded-xl border border-text-base/5 bg-background2/60 px-3 py-2"
              >
                <ThemedText
                  size="tiny"
                  weight="bold"
                  color="text"
                  opacity="medium"
                  style={{ textTransform: "uppercase" }}
                >
                  {key}
                </ThemedText>

                <ThemedText
                  size="xs"
                  weight="bold"
                  color="text"
                  style={{ marginTop: 2 }}
                >
                  {String(val)}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 6. About Target */}
      {target?.adviceLong && (
        <View className="mt-4">
          <ThemedText
            size="xxs"
            weight="bold"
            color="text"
            opacity="medium"
            style={{
              textTransform: "uppercase",
              letterSpacing: 1.5,
              marginBottom: 6,
              paddingHorizontal: 4,
            }}
          >
            Lời khuyên
          </ThemedText>

          <View className="rounded-xl border border-text-base/10 bg-background2 px-3 py-2">
            <ThemedText size="xxs" color="text" opacity="medium">
              {target.adviceLong}
            </ThemedText>
          </View>
        </View>
      )}
    </View>
  );
}
