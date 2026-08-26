import { EMOTIONS } from "@/constants/data";
import { useDBService } from "@/hooks/useDBService";
import { DailyLog, DailyNote, FastSession } from "@/interfaces/db.type";
import { DissectedDay } from "@/util/home/timespliter";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  View
} from "react-native";

type DetailType = {
  dateString: string; // YYYY-MM-DD
  log?: (DailyLog | DissectedDay)[];
  note?: DailyNote;
};

type FastMap = Record<string, FastSession>;

type TimelineSegment = {
  fastId: string;
  startHour: number;
  endHour: number;
  duration: number;
};

const HOURS_IN_DAY = 24;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const pad = (value: number) => String(value).padStart(2, "0");

const formatHour = (hour: number) => {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);

  if (m === 60) {
    return `${pad((h + 1) % 24)}:00`;
  }

  return `${pad(h % 24)}:${pad(m)}`;
};

const getDateKey = (date: Date) => {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-");
};

const getHourInLocalDay = (date: Date) => {
  return (
    date.getHours() +
    date.getMinutes() / 60 +
    date.getSeconds() / 3600 +
    date.getMilliseconds() / 3600000
  );
};

/**
 * Chuyển start/end của FastSession thành các segment
 * nằm trong đúng ngày dateString.
 *
 * Ví dụ:
 *
 * fast:
 *  22:00 hôm trước -> 14:00 hôm nay
 *
 * segment của hôm nay:
 *  00:00 -> 14:00
 *
 * fast:
 *  18:00 hôm nay -> 03:00 ngày mai
 *
 * segment của hôm nay:
 *  18:00 -> 24:00
 */
const getFastSegmentsForDay = (
  fast: FastSession,
  dateString: string,
): TimelineSegment[] => {
  if (!fast.start_time) return [];

  const start = new Date(fast.start_time);

  /**
   * Nếu fast đang chạy và end_time null,
   * lấy hiện tại làm end.
   *
   * Nếu FastSession của bạn dùng field khác cho trạng thái
   * đang chạy thì đổi đoạn này.
   */
  const end = fast.end_time ? new Date(fast.end_time) : new Date();

  if (end <= start) return [];

  const dayStart = new Date(`${dateString}T00:00:00`);
  const dayEnd = new Date(`${dateString}T23:59:59.999`);

  // Không overlap ngày này
  if (end <= dayStart || start > dayEnd) {
    return [];
  }

  const segmentStart = start > dayStart ? getHourInLocalDay(start) : 0;

  const segmentEnd = end < dayEnd ? getHourInLocalDay(end) : HOURS_IN_DAY;

  const duration = segmentEnd - segmentStart;

  if (duration <= 0) return [];

  return [
    {
      fastId: fast.id,
      startHour: segmentStart,
      endHour: segmentEnd,
      duration,
    },
  ];
};

const formatDuration = (hours: number) => {
  if (hours <= 0) return "0h";

  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  if (minutes === 60) {
    return `${wholeHours + 1}h`;
  }

  if (wholeHours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${wholeHours}h`;
  }

  return `${wholeHours}h ${minutes}m`;
};

const PixelDetailSheet = ({ dateString, log = [], note }: DetailType) => {
  const dbService = useDBService();

  const [fastObj, setFastObj] = useState<FastMap>({});
  const [isLoadingFasts, setIsLoadingFasts] = useState(false);

  

  /**
   * Những fast thực sự liên quan tới ngày này.
   *
   * Set giúp tránh query trùng ID.
   */
  const fastIds = useMemo(() => {
    return [...new Set(log.map((item) => item.fast_id).filter(Boolean))];
  }, [log]);

  /**
   * Tổng số giờ fasting trong ngày.
   */
  const totalFastHoursInDay = useMemo(() => {
    return log.reduce((acc, item) => acc + (item.hours_in_day || 0), 0);
  }, [log]);

  /**
   * Lấy FastSession sau khi sheet mở.
   */
  const getFasts = useCallback(async () => {
    if (fastIds.length === 0) {
      setFastObj({});
      return;
    }

    try {
      setIsLoadingFasts(true);

      const fasts = await dbService.getFastSessionByIds(fastIds);

      const nextFastObj: FastMap = {};

      for (const fast of fasts ?? []) {
        nextFastObj[fast.id] = fast;
      }

      setFastObj(nextFastObj);
    } catch (error) {
      console.error("PixelDetailSheet.getFasts", error);
      setFastObj({});
    } finally {
      setIsLoadingFasts(false);
    }
  }, [dbService, fastIds]);

  useEffect(() => {
    getFasts();
  }, [getFasts]);

  /**
   * Timeline.
   *
   * Mỗi DailyLog có fast_id.
   * Sau khi FastSession được load thì lấy start/end thực tế.
   */
  const timelineSegments = useMemo(() => {
    const segments: TimelineSegment[] = [];

    for (const item of log) {
      if (!item.fast_id) continue;

      const fast = fastObj[item.fast_id];

      if (!fast) continue;

      const fastSegments = getFastSegmentsForDay(fast, dateString);

      segments.push(...fastSegments);
    }

    /**
     * Một fast_id có thể xuất hiện nhiều row,
     * tránh duplicate segment.
     */
    const unique = new Map<string, TimelineSegment>();

    for (const segment of segments) {
      const key = `${segment.fastId}-${segment.startHour}-${segment.endHour}`;

      if (!unique.has(key)) {
        unique.set(key, segment);
      }
    }

    return [...unique.values()].sort((a, b) => a.startHour - b.startHour);
  }, [log, fastObj, dateString]);

  /**
   * Mood.
   */
  const currentMood = note?.mood_level ? EMOTIONS[note.mood_level] : null;

  /**
   * Tìm log tương ứng với fast.
   *
   * Dùng để hiển thị hours_in_day / elapsed_hours /
   * hours_in_fast trong card.
   */
  const getLogForFast = (fastId: string) => {
    return log.find((item) => item.fast_id === fastId);
  };

  return (
    <ScrollView
      className="flex-1 bg-zinc-950"
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 40,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* ========================================================= */}
      {/* HEADER                                                     */}
      {/* ========================================================= */}

      <View className="flex-row items-center justify-between pb-5 border-b border-white/10">
        <View className="flex-1">
          <Text className="text-zinc-500 text-[11px] font-semibold uppercase tracking-[1.5px]">
            Nhật ký ngày
          </Text>

          <Text className="text-white text-2xl font-bold mt-1">
            {dateString}
          </Text>
        </View>

        {currentMood ? (
          <View className="flex-row items-center gap-x-2 bg-white/5 px-3 py-2 rounded-full border border-white/10">
            <Text className="text-2xl">{currentMood.emoji}</Text>

            <Text className="text-zinc-300 text-xs font-semibold">
              {currentMood.label}
            </Text>
          </View>
        ) : (
          <View className="bg-white/5 px-3 py-2 rounded-full border border-white/5">
            <Text className="text-zinc-500 text-xs">Chưa có mood</Text>
          </View>
        )}
      </View>

      {/* ========================================================= */}
      {/* FASTING SUMMARY                                            */}
      {/* ========================================================= */}

      <View className="mt-5">
        <View className="flex-row items-end justify-between mb-3">
          <View>
            <Text className="text-zinc-500 text-xs font-medium uppercase tracking-wider">
              Fasting
            </Text>

            <View className="flex-row items-baseline mt-0.5">
              <Text className="text-white text-3xl font-bold">
                {totalFastHoursInDay.toFixed(1)}
              </Text>

              <Text className="text-zinc-500 text-sm ml-1">giờ</Text>
            </View>
          </View>

          <Text className="text-zinc-600 text-xs">
            {((totalFastHoursInDay / 24) * 100).toFixed(0)}% ngày
          </Text>
        </View>

        {/* ======================================================= */}
        {/* 24H TIMELINE                                             */}
        {/* ======================================================= */}

        <View className="bg-zinc-900 rounded-2xl border border-white/10 p-4">
          <View className="relative h-10 rounded-xl overflow-hidden bg-zinc-800 border border-white/5">
            {/* Grid 6h */}
            <View
              pointerEvents="none"
              className="absolute top-0 bottom-0 left-1/4 w-px bg-white/5"
            />

            <View
              pointerEvents="none"
              className="absolute top-0 bottom-0 left-1/2 w-px bg-white/10"
            />

            <View
              pointerEvents="none"
              className="absolute top-0 bottom-0 left-3/4 w-px bg-white/5"
            />

            {/* Fasting segments */}
            {timelineSegments.map((segment) => {
              const leftPercent = (segment.startHour / 24) * 100;

              const widthPercent = (segment.duration / 24) * 100;

              return (
                <View
                  key={`${segment.fastId}-${segment.startHour}`}
                  style={{
                    left: `${clamp(leftPercent, 0, 100)}%`,
                    width: `${clamp(widthPercent, 0, 100)}%`,
                  }}
                  className="absolute top-0 bottom-0 bg-emerald-500 justify-center overflow-hidden"
                >
                  {widthPercent > 10 && (
                    <Text
                      numberOfLines={1}
                      className="text-[10px] font-bold text-zinc-950 text-center"
                    >
                      {formatDuration(segment.duration)}
                    </Text>
                  )}
                </View>
              );
            })}

            {/* Loading overlay */}
            {isLoadingFasts && (
              <View className="absolute inset-0 bg-zinc-900/70 items-center justify-center">
                <ActivityIndicator size="small" color="#34d399" />
              </View>
            )}
          </View>

          {/* Time labels */}
          <View className="flex-row justify-between mt-2">
            <Text className="text-zinc-600 text-[10px] font-mono">00:00</Text>

            <Text className="text-zinc-600 text-[10px] font-mono">06:00</Text>

            <Text className="text-zinc-600 text-[10px] font-mono">12:00</Text>

            <Text className="text-zinc-600 text-[10px] font-mono">18:00</Text>

            <Text className="text-zinc-600 text-[10px] font-mono">24:00</Text>
          </View>
        </View>
      </View>

      {/* ========================================================= */}
      {/* RELATED FASTS                                              */}
      {/* ========================================================= */}

      {fastIds.length > 0 && (
        <View className="mt-5">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white text-sm font-semibold">
              Các phiên liên quan
            </Text>

            <Text className="text-zinc-600 text-xs">
              {fastIds.length} phiên
            </Text>
          </View>

          <View className="gap-y-2">
            {fastIds.map((fastId) => {
              const fast = fastObj[fastId];
              const dailyLog = getLogForFast(fastId);

              if (!fast) {
                return (
                  <View
                    key={fastId}
                    className="bg-zinc-900 rounded-xl border border-white/5 p-3"
                  >
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

              const duration = dailyLog?.hours_in_fast ?? 0;

              return (
                <View
                  key={fastId}
                  className="bg-zinc-900 rounded-xl border border-white/5 p-3"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-2 h-2 rounded-full bg-emerald-400 mr-3" />

                      <View>
                        <Text className="text-white text-sm font-semibold">
                          {formatHour(getHourInLocalDay(start))}

                          {"  →  "}

                          {end
                            ? formatHour(getHourInLocalDay(end))
                            : "Đang nhịn"}
                        </Text>

                        <Text className="text-zinc-600 text-[10px] mt-0.5">
                          {fastId}
                        </Text>
                      </View>
                    </View>

                    <View className="items-end ml-3">
                      <Text className="text-emerald-400 text-sm font-bold">
                        {formatDuration(duration)}
                      </Text>

                      <Text className="text-zinc-600 text-[10px]">
                        trong ngày
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* ========================================================= */}
      {/* NOTE                                                        */}
      {/* ========================================================= */}

      <View className="mt-5 bg-zinc-900 rounded-2xl border border-white/10 p-4">
        <Text className="text-zinc-500 text-[11px] font-semibold uppercase tracking-[1.5px] mb-3">
          Ghi chú
        </Text>

        {note?.note ? (
          <Text className="text-zinc-200 text-sm leading-6">{note.note}</Text>
        ) : (
          <View className="py-2">
            <Text className="text-zinc-600 text-sm italic">
              Không có ghi chú nào cho ngày này.
            </Text>
          </View>
        )}
      </View>

      {/* ========================================================= */}
      {/* IMAGE                                                       */}
      {/* ========================================================= */}

      {note?.image_uri && (
        <View className="mt-4">
          <Text className="text-zinc-500 text-[11px] font-semibold uppercase tracking-[1.5px] mb-3">
            Hình ảnh
          </Text>

          <View className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
            <Image
              source={{ uri: note.image_uri }}
              className="w-full h-64"
              resizeMode="cover"
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default PixelDetailSheet;
