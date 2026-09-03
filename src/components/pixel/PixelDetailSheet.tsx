import { EMOTIONS } from "@/constants/data";
import { useDBService } from "@/hooks/useDBService";
import { DailyLog, DailyNote, FastSession } from "@/interfaces/db.type";
import { DissectedDay } from "@/util/home/timespliter";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Circular24hTimeline from "./Circular24hTimeline";
import { DailyFastSessionCard } from "./DailySessionFast";

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

  const fastIds = useMemo(() => {
    return [...new Set(log.map((item) => item.fast_id).filter(Boolean))];
  }, [log]);

  const totalFastHoursInDay = useMemo(() => {
    return log.reduce((acc, item) => acc + (item.hours_in_day || 0), 0);
  }, [log]);

  const getFasts = useCallback(async () => {
    if (fastIds.length === 0) {
      setFastObj({});
      return;
    }

    if (3 === 3) {
      const id = "fast_session_" + dateString;

      const fast: FastMap = {
        "fast_session_2026-08-08": {
          start_time: new Date("2026-08-08T13:00:00.000Z").getTime(),
          end_time: new Date("2026-08-09T09:00:00.000Z").getTime(),
          duration: 20 * 3600,
          target_duration: 20,
          created_at: new Date("2026-08-08T13:00:00.000Z").getTime() / 1000,
          updated_at: new Date("2026-08-08T13:00:00.000Z").getTime() / 1000,
          home_data_snapshot: null,
          id: id,
          is_deleted: 0,
          sync_status: "synced",
          user_id: "qq",
          status: "completed",
          rating: null,
        },
        "fast_session_2026-08-09": {
          start_time: new Date("2026-08-09T13:00:00.000Z").getTime(),
          end_time: new Date("2026-08-10T09:00:00.000Z").getTime(),
          duration: 20 * 3600,
          target_duration: 20,
          created_at: new Date("2026-08-09T13:00:00.000Z").getTime() / 1000,
          updated_at: new Date("2026-08-09T13:00:00.000Z").getTime() / 1000,
          home_data_snapshot: null,
          id: id,
          is_deleted: 0,
          sync_status: "synced",
          user_id: "qq",
          status: "completed",
          rating: null,
        },
      };
      return setFastObj(fast);
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

  const [weight, setWeight] = useState(0);
  const getWeight = useCallback(async () => {
    const weight = await dbService?.getCurrentWeight(dateString);
    if (weight) {
      setWeight(weight.weight);
    }
  }, [dbService]);

  useEffect(() => {
    getFasts();
    getWeight();
  }, [getFasts]);

  const timelineSegments = useMemo(() => {
    const segments: TimelineSegment[] = [];

    for (const item of log) {
      console.log("timelineSegments", log, fastObj);
      if (!item.fast_id) continue;

      const fast = fastObj[item.fast_id];

      if (!fast) continue;

      const fastSegments = getFastSegmentsForDay(fast, dateString);

      segments.push(...fastSegments);
    }

    const unique = new Map<string, TimelineSegment>();

    for (const segment of segments) {
      const key = `${segment.fastId}-${segment.startHour}-${segment.endHour}`;

      if (!unique.has(key)) {
        unique.set(key, segment);
      }
    }

    return [...unique.values()].sort((a, b) => a.startHour - b.startHour);
  }, [log, fastObj, dateString]);

  const currentMood = note?.mood_level ? EMOTIONS[note.mood_level] : null;

  const getLogForFast = (fastId: string) => {
    return log.find((item) => item.fast_id === fastId);
  };

  const circularSegments = useMemo(() => {
    return timelineSegments.map((segment) => ({
      id: `${segment.fastId}-${segment.startHour}`,
      startHour: segment.startHour,
      duration: segment.duration,
      // Muốn chỉnh màu riêng hoặc dùng mặc định #34D399:
      color: "#34d399",
    }));
  }, [timelineSegments]);

  // Tính tổng số giờ nhịn trong ngày để hiển thị ở tâm đồng hồ
  const totalDuration = useMemo(() => {
    return timelineSegments.reduce((acc, curr) => acc + curr.duration, 0);
  }, [timelineSegments]);

  const [activeTab, setActiveTab] = useState<"fasting" | "journal">("fasting");

  return (
    <View className="flex-1 bg-zinc-950">
      {/* 1. HEADER CHÍNH (Cố định ở trên) */}
      <View className="px-4 pt-3 pb-3 border-b border-white/10 flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-zinc-500 text-[11px]">Nhật ký ngày</Text>
          <Text className="text-white text-xl font-bold mt-0.5">
            {dateString}
          </Text>
        </View>

        {/* Mood Badge thu gọn */}
        {currentMood ? (
          <View
            style={{ backgroundColor: currentMood.color }}
            className="flex-row items-center gap-x-1.5 px-5 py-1.5 rounded-full border border-white/10"
          >
            <Text className="text-zinc-200 text-xs font-semibold">
              {currentMood.label}
            </Text>
            <Text className="text-lg font-medium">{currentMood.emoji}</Text>
          </View>
        ) : (
          <View className="bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
            <Text className="text-zinc-500 text-[11px]">Chưa có mood</Text>
          </View>
        )}
      </View>

      {/* 2. TAB SWITCHER (Nút chuyển Tab) */}
      <View className="px-4 mt-3">
        <View className="flex-row gap-3 bg-zinc-900 p-1 rounded-xl border border-white/5">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveTab("fasting")}
            className={`flex-1 py-4 items-center justify-center ${
              activeTab === "fasting"
                ? "bg-zinc-800  border rounded-2xl border-emerald-400"
                : "bg-transparent"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                activeTab === "fasting" ? "text-emerald-400" : "text-zinc-400"
              }`}
            >
              ⏱️ Daily Fast
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveTab("journal")}
            className={`flex-1 py-4 items-center justify-center ${
              activeTab === "journal"
                ? "bg-zinc-800 border rounded-2xl border-emerald-400"
                : "bg-transparent"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                activeTab === "journal" ? "text-emerald-400" : "text-zinc-400"
              }`}
            >
              📝 Daily Note
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. NỘI DUNG SCROLLVIEW TƯƠNG ỨNG THEO TAB */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= TAB 1: FASTING ================= */}
        {activeTab === "fasting" && (
          <View className="gap-y-5">
            {/* 24H CIRCULAR TIMELINE */}
            <View className="bg-zinc-900 rounded-2xl border border-white/10 p-5 items-center justify-center">
              <Circular24hTimeline
                segments={circularSegments}
                totalDuration={totalDuration}
                size={220}
                strokeWidth={14}
                isLoading={isLoadingFasts}
                animated={true}
              />
            </View>

            {/* DANH SÁCH PHIÊN LIÊN QUAN */}
            {fastIds.length > 0 && (
              <View>
                <View className="flex-row items-center justify-between mb-2.5 px-1">
                  <Text className="text-white text-xs font-semibold uppercase tracking-wider">
                    Các phiên liên quan
                  </Text>
                  <Text className="text-zinc-500 text-xs">
                    {fastIds.length} phiên
                  </Text>
                </View>

                <View className="gap-y-2">
                  {log.map((item, index) => (
                    <DailyFastSessionCard
                      index={index}
                      key={item.fast_id}
                      fast={fastObj[item.fast_id] ?? null}
                      dailyLog={item}
                      // item={item}
                    />
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* ================= TAB 2: JOURNAL & METRICS ================= */}
        {activeTab === "journal" && (
          <View className="gap-y-4">
            {/* CARD THÔNG SỐ SỨC KHỎE (CÂN NẶNG & MOOD) */}
            <View className="flex-row items-center gap-x-3">
              <View className="flex-1 bg-zinc-900 p-3.5 rounded-2xl border border-white/10 flex-row items-center justify-between">
                <Text className="text-zinc-400 text-xs font-medium">
                  Cân nặng
                </Text>
                <View className="flex-row items-baseline">
                  <Text className="text-amber-400 text-lg font-bold">
                    {weight ?? "--"}
                  </Text>
                  <Text className="text-zinc-500 text-xs ml-0.5">kg</Text>
                </View>
              </View>
            </View>

            {/* GHI CHÚ (NOTE) */}
            <View className="bg-zinc-900 rounded-2xl border border-white/10 p-4">
              <Text className="text-zinc-500 text-[11px] font-semibold uppercase tracking-[1.5px] mb-2.5">
                Ghi chú trong ngày
              </Text>

              {note?.note ? (
                <Text className="text-zinc-200 text-sm leading-6">
                  {note.note}
                </Text>
              ) : (
                <View className="py-2">
                  <Text className="text-zinc-600 text-sm italic">
                    Chưa có ghi chú nào được thêm.
                  </Text>
                </View>
              )}
            </View>

            {/* HÌNH ẢNH (IMAGE) - Đã sửa lỗi h-screen */}
            {note?.image_uri && (
              <View className="bg-zinc-900 rounded-2xl border border-white/10 p-3">
                <Text className="text-zinc-500 text-[11px] font-semibold uppercase tracking-[1.5px] mb-2.5 ml-1">
                  Hình ảnh
                </Text>

                <View className="overflow-hidden rounded-xl bg-zinc-950">
                  <Image
                    source={{ uri: note.image_uri }}
                    className="w-full aspect-9/16 rounded-xl"
                    resizeMode="cover"
                  />
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default PixelDetailSheet;
