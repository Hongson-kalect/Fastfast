import { getEmotionPack } from "@/constants/emotions";
import { useDBService } from "@/hooks/useDBService";
import {
  DailyLog,
  DailyNote,
  FastSession,
  MoodLevel,
} from "@/interfaces/db.type";
import { ViewMode } from "@/interfaces/pixel";
import { useAppStore } from "@/stores/appStore";
import { updatePixelNote } from "@/stores/pixelAction";
import { usePixelStore } from "@/stores/pixelStore";
import { DissectedDay } from "@/utils/home/timespliter";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";
import PixelDailyFast from "./PixelDailyFast";
import PixelDailyNote, { ModalNote } from "./PixelDailyNote";
import { MoodModal } from "./modals/MoodModal";
import { useShallow } from "zustand/react/shallow";
import { useT } from "@/providers/Language";

type DetailType = {
  dateString: string; // YYYY-MM-DD
  log?: (DailyLog | DissectedDay)[];
  note?: DailyNote;
  /** Ngày nghỉ được khiên giữ chuỗi */
  restDay?: boolean;
};

type FastMap = Record<string, FastSession>;

export type TimelineSegment = {
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

const PixelDetailSheet = ({
  dateString,
  log = [],
  note,
  restDay = false,
}: DetailType) => {
  const t = useT();
  const dbService = useDBService();
  const { theme, settings } = useAppStore(
    useShallow((state) => ({ theme: state.theme, settings: state.settings })),
  );
  const isDark = settings?.is_dark_mode ?? true;

  const [sheetNote, setSheetNote] = useState({
    mood_level: note?.mood_level,
    note: note?.note,
    weight: 0,
    dateStr: note?.log_date,
    image_uri: note?.image_uri,
  });

  const [fastObj, setFastObj] = useState<FastMap>({});
  const [isLoadingFasts, setIsLoadingFasts] = useState(false);
  const viewMode = usePixelStore((state) => state.viewMode);
  const [activeTab, setActiveTab] = useState<ViewMode>(viewMode);
  const [moodModalVisible, setMoodModalVisible] = useState(false);

  const EMOTIONS = getEmotionPack(settings?.emotion_pack).emotions;

  const fastIds = useMemo(
    () => [...new Set(log.map((item) => item.fast_id).filter(Boolean))],
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

  useEffect(() => {
    Promise.all([getFasts()]);
  }, [getFasts]);

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

  const currentMood = useMemo(() => {
    return sheetNote.mood_level != null ? EMOTIONS[sheetNote.mood_level] : null;
  }, [sheetNote.mood_level]);

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

  const updateMood = async (mood: MoodLevel) => {
    await dbService.setDailyNote(mood, undefined, undefined, dateString);
    setSheetNote({
      ...sheetNote,
      mood_level: mood,
    });

    await updatePixelNote(dbService, dateString);
  };

  const updateSheetNote = async (update: Partial<ModalNote>) => {
    setSheetNote((prev) => ({
      ...prev,
      ...update,
    }));

    await updatePixelNote(dbService, dateString);
  };

  const loadNote = async () => {
    await dbService.getDailyNote(dateString).then((note) => {
      if (note)
        setSheetNote((prev) => ({
          ...prev,
          mood_level: note.mood_level,
          note: note.note,
          dateStr: note.log_date,
          image_uri: note.image_uri,
        }));
    });
  };
  const loadWeight = async () => {
    await dbService.getCurrentWeight(dateString).then((weight) => {
      if (weight)
        setSheetNote((prev) => ({
          ...prev,
          weight: weight.weight,
        }));
    });
  };

  useEffect(() => {
    loadNote();
    loadWeight();
  }, [dateString]);

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-text-base/10 px-4 pb-3 pt-3">
        <View className="flex-1">
          <ThemedText size="xxs" color="text" opacity="medium">
            {t("pixelDetail.title")}
          </ThemedText>

          <ThemedText size="xl" weight="bold" color="title" className="mt-0.5">
            {dateString}
          </ThemedText>
        </View>

        <Pressable onPress={() => setMoodModalVisible(true)}>
          {currentMood ? (
            <View
              style={{
                backgroundColor: currentMood.color[isDark ? "dark" : "light"],
              }}
              className="flex-row items-center gap-x-1.5 rounded-full border border-text-base/10 px-5 py-1.5"
            >
              <ThemedText
                size="xs"
                weight="semibold"
                colorHex={currentMood.color[isDark ? "light" : "dark"]}
              >
                {currentMood.label}
              </ThemedText>

              <ThemedText size="lg" weight="medium">
                {currentMood.icon[isDark ? "dark" : "light"]}
              </ThemedText>
            </View>
          ) : (
            <View className="rounded-full border border-text-base/5 bg-text-base/5 px-2.5 py-1">
              <ThemedText size="xxs" color="text" opacity="medium">
                {t("pixelDetail.noMood")}
              </ThemedText>
            </View>
          )}
        </Pressable>
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
              {t("pixelDetail.dailyFast")}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveTab("mood")}
            className="flex-1 items-center justify-center rounded-2xl py-4"
            style={
              activeTab === "mood"
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
              color={activeTab === "mood" ? "primary" : "text"}
              opacity={activeTab === "mood" ? "full" : "medium"}
            >
              {t("pixelDetail.dailyNote")}
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
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === "fasting" ? (
          <PixelDailyFast
            circularSegments={circularSegments}
            totalDuration={totalDuration}
            isLoadingFasts={isLoadingFasts}
            fastIds={fastIds}
            log={log}
            fastObj={fastObj}
            restDay={restDay}
          />
        ) : (
          <PixelDailyNote
            note={sheetNote}
            updateSheetNote={updateSheetNote}
            date={dateString}
          />
        )}
      </ScrollView>

      <MoodModal
        visible={moodModalVisible}
        setVisible={setMoodModalVisible}
        dateStr={dateString}
        mood={sheetNote?.mood_level}
        onSave={(value, date) => {
          updateMood(value);

          // Chỉ cập nhật mood.
        }}
      />
    </View>
  );
};

export default PixelDetailSheet;
