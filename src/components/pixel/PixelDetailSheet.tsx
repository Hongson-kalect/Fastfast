import { EMOTION_PACKS } from "@/constants/emotions";
import { useDBService } from "@/hooks/useDBService";
import { DailyLog, DailyNote, FastSession } from "@/interfaces/db.type";
import { useAppStore } from "@/stores/appStore";
import { DissectedDay } from "@/util/home/timespliter";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Image, ScrollView, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";
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

const getFastSegmentsForDay = (
  fast: FastSession,
  dateString: string,
): TimelineSegment[] => {
  if (!fast.start_time) return [];

  const start = new Date(fast.start_time);
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

const PixelDetailSheet = ({ dateString, log = [], note }: DetailType) => {
  const dbService = useDBService();
  const { theme, settings } = useAppStore();
  const isDark = settings?.is_dark_mode ?? true;

  const [fastObj, setFastObj] = useState<FastMap>({});
  const [isLoadingFasts, setIsLoadingFasts] = useState(false);
  const [weight, setWeight] = useState(0);
  const [activeTab, setActiveTab] = useState<"fasting" | "journal">("fasting");

  const EMOTIONS = EMOTION_PACKS[settings?.emotion_pack ?? "default"].emotions;

  const fastIds = useMemo(
    () => [...new Set(log.map((item) => item.fast_id).filter(Boolean))],
    [log],
  );

  const totalFastHoursInDay = useMemo(
    () => log.reduce((acc, item) => acc + (item.hours_in_day || 0), 0),
    [log],
  );

  const getFasts = useCallback(async () => {
    if (fastIds.length === 0) {
      setFastObj({});
      return;
    }

    try {
      setIsLoadingFasts(true);

      const fasts = await dbService.getFastSessionByIds(fastIds);

      const result: FastMap = {};

      for (const fast of fasts ?? []) {
        result[fast.id] = fast;
      }

      setFastObj(result);
    } catch (error) {
      console.error("PixelDetailSheet.getFasts", error);
      setFastObj({});
    } finally {
      setIsLoadingFasts(false);
    }
  }, [dbService, fastIds]);

  const getWeight = useCallback(async () => {
    const result = await dbService.getCurrentWeight(dateString);

    if (result) {
      setWeight(result.weight);
    }
  }, [dbService, dateString]);

  useEffect(() => {
    getFasts();
    getWeight();
  }, [getFasts, getWeight]);

  const timelineSegments = useMemo(() => {
    const segments: TimelineSegment[] = [];

    for (const item of log) {
      if (!item.fast_id) continue;

      const fast = fastObj[item.fast_id];
      if (!fast) continue;

      segments.push(...getFastSegmentsForDay(fast, dateString));
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

  const circularSegments = useMemo(
    () =>
      timelineSegments.map((segment) => ({
        id: `${segment.fastId}-${segment.startHour}`,
        startHour: segment.startHour,
        duration: segment.duration,
        color: theme.primary,
      })),
    [timelineSegments, theme.primary],
  );

  const totalDuration = useMemo(
    () => timelineSegments.reduce((acc, curr) => acc + curr.duration, 0),
    [timelineSegments],
  );

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-text-base/10 px-4 pb-3 pt-3">
        <View className="flex-1">
          <ThemedText size="xxs" color="text" opacity="medium">
            Nhật ký ngày
          </ThemedText>

          <ThemedText size="xl" weight="bold" color="title" className="mt-0.5">
            {dateString}
          </ThemedText>
        </View>

        {currentMood ? (
          <View
            style={{
              backgroundColor: currentMood.color[isDark ? "dark" : "light"],
            }}
            className="flex-row items-center gap-x-1.5 rounded-full border border-text-base/10 px-5 py-1.5"
          >
            <ThemedText size="xs" weight="semibold" color="background">
              {currentMood.label}
            </ThemedText>

            <ThemedText size="lg" weight="medium">
              {currentMood.icon}
            </ThemedText>
          </View>
        ) : (
          <View className="rounded-full border border-text-base/5 bg-text-base/5 px-2.5 py-1">
            <ThemedText size="xxs" color="text" opacity="medium">
              Chưa có mood
            </ThemedText>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View className="mt-3 px-4">
        <View className="flex-row gap-3 rounded-xl border border-text-base/5 bg-background2 p-1">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveTab("fasting")}
            className="flex-1 items-center justify-center rounded-2xl py-4"
            style={
              activeTab === "fasting"
                ? {
                    backgroundColor: `${theme.primary}18`,
                    borderWidth: 1,
                    borderColor: `${theme.primary}70`,
                  }
                : undefined
            }
          >
            <ThemedText
              size="xs"
              weight="semibold"
              color={activeTab === "fasting" ? "primary" : "text"}
              opacity={activeTab === "fasting" ? "full" : "medium"}
            >
              ⏱️ Daily Fast
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveTab("journal")}
            className="flex-1 items-center justify-center rounded-2xl py-4"
            style={
              activeTab === "journal"
                ? {
                    backgroundColor: `${theme.primary}18`,
                    borderWidth: 1,
                    borderColor: `${theme.primary}70`,
                  }
                : undefined
            }
          >
            <ThemedText
              size="xs"
              weight="semibold"
              color={activeTab === "journal" ? "primary" : "text"}
              opacity={activeTab === "journal" ? "full" : "medium"}
            >
              📝 Daily Note
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Fasting */}
        {activeTab === "fasting" && (
          <View className="gap-y-5">
            <View className="items-center justify-center rounded-2xl border border-text-base/10 bg-background2 p-5">
              <Circular24hTimeline
                segments={circularSegments}
                totalDuration={totalDuration}
                size={220}
                strokeWidth={14}
                isLoading={isLoadingFasts}
                animated
              />
            </View>

            {fastIds.length > 0 && (
              <View>
                <View className="mb-2.5 flex-row items-center justify-between px-1">
                  <ThemedText
                    size="xs"
                    weight="semibold"
                    color="text"
                    style={{
                      letterSpacing: 1,
                    }}
                  >
                    CÁC PHIÊN LIÊN QUAN
                  </ThemedText>

                  <ThemedText size="xs" color="text" opacity="medium">
                    {fastIds.length} phiên
                  </ThemedText>
                </View>

                <View className="gap-y-2">
                  {log.map((item, index) => (
                    <DailyFastSessionCard
                      key={item.fast_id}
                      index={index}
                      fast={fastObj[item.fast_id] ?? null}
                      dailyLog={item}
                    />
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Journal */}
        {activeTab === "journal" && (
          <View className="gap-y-4">
            {/* Weight */}
            <View className="flex-row items-center gap-x-3">
              <View className="flex-1 flex-row items-center justify-between rounded-2xl border border-text-base/10 bg-background2 p-3.5">
                <ThemedText
                  size="xs"
                  weight="medium"
                  color="text"
                  opacity="medium"
                >
                  Cân nặng
                </ThemedText>

                <View className="flex-row items-baseline">
                  <ThemedText size="lg" weight="bold" color="warning">
                    {weight || "--"}
                  </ThemedText>

                  <ThemedText
                    size="xs"
                    color="text"
                    opacity="medium"
                    className="ml-0.5"
                  >
                    kg
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Note */}
            <View className="rounded-2xl border border-text-base/10 bg-background2 p-4">
              <ThemedText
                size="xxs"
                weight="semibold"
                color="text"
                opacity="medium"
                className="mb-2.5"
                style={{
                  letterSpacing: 1.5,
                }}
              >
                GHI CHÚ TRONG NGÀY
              </ThemedText>

              {note?.note ? (
                <ThemedText size="sm" color="text" style={{ lineHeight: 24 }}>
                  {note.note}
                </ThemedText>
              ) : (
                <View className="py-2">
                  <ThemedText
                    size="sm"
                    color="text"
                    opacity="low"
                    style={{ fontStyle: "italic" }}
                  >
                    Chưa có ghi chú nào được thêm.
                  </ThemedText>
                </View>
              )}
            </View>

            {/* Image */}
            {note?.image_uri && (
              <View className="rounded-2xl border border-text-base/10 bg-background2 p-3">
                <ThemedText
                  size="xxs"
                  weight="semibold"
                  color="text"
                  opacity="medium"
                  className="mb-2.5 ml-1"
                  style={{
                    letterSpacing: 1.5,
                  }}
                >
                  HÌNH ẢNH
                </ThemedText>

                <View className="overflow-hidden rounded-xl bg-background">
                  <Image
                    source={{ uri: note.image_uri }}
                    className="aspect-9/16 w-full rounded-xl"
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
