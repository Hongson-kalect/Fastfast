import { getTarget } from "@/constants/data";
import { FastSession } from "@/interfaces/db.type";
import { splitSessionIntoDays } from "@/util/home/timespliter";
import { getLocalTodayStr } from "@/util/timer";
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
    <View className="m-3.5 bg-zinc-900 rounded-2xl border border-white/5 px-4 py-2">
      <View className="flex-row items-center">
        {/* Start time */}
        <View className="absolute bottom-3 -left-3">
          <Text style={{ color }} className="opacity-70 text-xs font-semibold">
            {startDate.getHours()}h
          </Text>
        </View>

        {/* End time */}
        <View className="absolute bottom-3 -right-3">
          <Text style={{ color }} className="opacity-70 text-xs font-semibold">
            {isActive && !end
              ? "Now"
              : endDate
                ? `${endDate.getHours()}h`
                : `${startDate.getHours()}h`}
          </Text>
        </View>

        <View className="flex-1 flex-row items-center h-[58px]">
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
                  <Text
                    className="text-zinc-500 text-[9px] font-semibold"
                    numberOfLines={1}
                  >
                    {isPlaceholder
                      ? formatTimelineDate(getLocalTodayStr(start))
                      : formatTimelineDate(part.log_date)}
                  </Text>
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
                <View className="absolute left-0 right-0 bottom-2 items-center">
                  <Text
                    className="text-text-base/40 text-[9px] font-light"
                    numberOfLines={1}
                  >
                    {isPlaceholder
                      ? formatDayDuration(durationHours)
                      : formatDayDuration(part.hours_in_day)}
                  </Text>
                </View>

                {/* Day separator */}
                {!isLast && (
                  <View className="absolute right-0 top-2 bottom-2 items-center">
                    <View className="w-px flex-1 bg-white/15" />
                    <View
                      className="absolute w-1 h-1 rounded-full"
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
      ? "#FB7185"
      : fast.status === "active"
        ? "#34D399"
        : reached
          ? targetColor
          : "#FBBF24";

  const difference = Math.abs(durationHours - targetHours);

  return (
    <View className="pb-4">
      {/* 1. Header Detail */}
      <View className="flex-row items-center justify-between px-1 pt-1">
        <View className="flex-1 mr-4">
          {target && (
            <View
              className="self-start flex-row items-center px-2.5 py-1 rounded-full"
              style={{ backgroundColor: target.colors.badgeBg }}
            >
              <Text className="text-sm mr-1">{target.emoji}</Text>
              <Text
                className="text-[9px] font-bold uppercase tracking-wider"
                style={{ color: target.colors.badgeText }}
              >
                {target.label}
              </Text>
            </View>
          )}

          <Text
            className="text-xs font-bold mt-2"
            style={{ color: statusColor }}
          >
            {status}
          </Text>
        </View>

        <Text className="text-white text-4xl font-extrabold tracking-tight">
          {formatDuration(durationHours)}
        </Text>
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

      {/* 3. Progress Card (Gộp gọn gàng, tránh lặp lại text) */}
      {target && (
        <View
          className="mt-4 rounded-2xl border p-4 bg-zinc-900/80"
          style={{ borderColor: `${targetColor}30` }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-3">
              <Text className="text-sm font-bold text-white" numberOfLines={1}>
                {target.title}
              </Text>
              <Text className="text-zinc-400 text-[11px] mt-0.5">
                Mục tiêu: {target.hours} giờ
              </Text>
            </View>

            <Text className="text-xl font-black" style={{ color: targetColor }}>
              {percent}%
            </Text>
          </View>

          {/* Progress Bar */}
          <View className="h-2 bg-zinc-800 rounded-full overflow-hidden mt-3">
            <View
              className="h-full rounded-full"
              style={{
                width: `${Math.min(percent, 100)}%`,
                backgroundColor: targetColor,
              }}
            />
          </View>

          <View className="flex-row justify-between mt-2">
            <Text className="text-zinc-400 text-[10px]">
              {formatDuration(durationHours)}
            </Text>

            <Text
              className="text-[10px] font-semibold"
              style={{ color: targetColor }}
            >
              {reached
                ? `Vượt ${formatSignedDuration(difference)}`
                : `Còn ${formatDuration(difference)}`}
            </Text>
          </View>
        </View>
      )}

      {/* 4. Rating Section */}
      {fast.rating && (
        <View className="mt-4">
          <Text className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-1.5 px-1">
            Đánh giá phiên
          </Text>

          <View className="bg-zinc-900 rounded-2xl border border-white/10 p-3.5 flex-row items-center">
            <Text className="text-2xl mr-3">
              {fast.rating === "Excellent"
                ? "🏆"
                : fast.rating === "Good"
                  ? "👍"
                  : "😮‍💨"}
            </Text>
            <View>
              <Text className="text-white text-sm font-bold">
                {fast.rating}
              </Text>
              <Text className="text-zinc-400 text-[11px]">
                Trạng thái cơ thể lúc kết thúc
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* 5. Health Snapshot (Parsed Data dạng Grid UI) */}
      {parsedSnapshot && (
        <View className="mt-4">
          <Text className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-1.5 px-1">
            Chỉ số ghi nhận
          </Text>

          <View className="bg-zinc-900 rounded-2xl border border-white/10 p-3.5 flex-row flex-wrap gap-2">
            {Object.entries(parsedSnapshot).map(([key, val]) => (
              <View
                key={key}
                className="bg-zinc-800/60 px-3 py-2 rounded-xl border border-white/5"
              >
                <Text className="text-zinc-400 text-[9px] uppercase font-bold">
                  {key}
                </Text>
                <Text className="text-white text-xs font-bold mt-0.5">
                  {String(val)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 6. About Target (Thông tin kiến thức khoa học) */}
      {target?.adviceLong && (
        <View className="mt-4">
          <Text className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-1.5 px-1">
            Lời khuyên
          </Text>

          <View className="bg-zinc-900 rounded-2xl border border-white/10 p-4">
            <Text className="text-zinc-300 text-xs leading-5">
              {target.adviceLong}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
