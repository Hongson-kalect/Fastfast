import PixelHeader from "@/components/pixel/Header";
import PixelDetailSheet from "@/components/pixel/PixelDetailSheet";
import { generateYearGrid } from "@/components/pixel/PixelInYear";
import WeekRow from "@/components/pixel/WeekRow";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useDBService } from "@/hooks/useDBService";
import {
  DailyLog,
  DailyNote,
  FastSession,
  HabitLog,
  SyncStatus,
} from "@/interfaces/db.type";
import {
  DailyPixelData,
  PixelStats,
  ViewMode,
  YearPixelDataMap,
} from "@/interfaces/pixel";
import { useBottomSheet } from "@/provider/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import { DissectedDay, splitSessionIntoDays } from "@/util/home/timespliter";
import { getLocalTodayStr } from "@/util/timer";
import { Feather } from "@expo/vector-icons";
import { getWeek } from "date-fns";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  SectionList,
  StatusBar,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

// 1. Định nghĩa các chế độ xem (View Options)

interface EmojiGuide {
  emoji: string;
  label: string;
}

const ITEM_HEIGHT = 40;
const HEADER_HEIGHT = 60;

type BuildPixelYearDataParams = {
  logs: DailyLog[];
  notes: DailyNote[];
  shieldUsed: HabitLog[];
  currentFastSession: FastSession|null;
}
const buildPixelYearData=({
  logs,
  notes,
  shieldUsed,
  currentFastSession,
}:BuildPixelYearDataParams) => {
  const yearMap: YearPixelDataMap = {};
      const newStats: PixelStats = { fastDays: 0, fastHour: 0, logDays: 0 };

      const getOrCreateDayNode = (dateStr: string): DailyPixelData => {
        if (!yearMap[dateStr]) {
          yearMap[dateStr] = { logs: [], totalHours: 0 };
        }
        return yearMap[dateStr];
      };

      // 1. Process Notes
      notes.forEach((note) => {
        const dayNode = getOrCreateDayNode(note.log_date);
        dayNode.note = note;
        newStats.logDays += 1;
      });

      // 2. Process Logs
      const appendFastLog = (log: DailyLog | DissectedDay) => {
        const dayNode = getOrCreateDayNode(log.log_date);
        if (dayNode.logs.length === 0) {
          newStats.fastDays += 1;
        }
        dayNode.logs.push(log);
        dayNode.totalHours += log.hours_in_day;
        newStats.fastHour += log.hours_in_day;
      };

      logs.forEach(appendFastLog);

      // Process active session
      if (currentFastSession?.start_time && !currentFastSession?.end_time) {
        const parsedDays = splitSessionIntoDays(
          currentFastSession.start_time,
          Math.floor(Date.now()),
          currentFastSession.id,
        );
        parsedDays.forEach(appendFastLog);
      }

      // 3. Process Shields
      shieldUsed.forEach((log) => {
        let shields = Math.abs(log.shield_delta || 0);
        const [y, m, d] = log.log_date.split("-").map(Number);
        const pointerDate = new Date(Date.UTC(y, m - 1, d));

        while (shields > 0) {
          pointerDate.setUTCDate(pointerDate.getUTCDate() - 1);
          const dateStr = pointerDate.toISOString().split("T")[0];

          const dayNode = getOrCreateDayNode(dateStr);
          dayNode.shieldLog = log;
          shields -= 1;
        }
      });

      return { yearMap, stats: newStats };
};

const PixelScreen = () => {
  const dbService = useDBService();
  const { present, hide } = useBottomSheet();
  const { width, height } = useWindowDimensions();
  const { currentFastSession, settings, updateSetting, theme } =
    useAppStore();

    const sectionListRef = useRef<SectionList>(null);
  const todayStr = getLocalTodayStr();
  const currentYear = new Date().getFullYear();

  const [year, setYear] = useState(currentYear);
  const [viewMode, setViewMode] = useState<ViewMode>(
    settings?.pixel_view_mode || "fasting",
  );
  const [isLoading, setIsLoading] = useState(false);

  const [yIndex, setYIndex] = useState(0);
  const [isScrollUp, setIsScrollUp] = useState(false);

  const [yearPixelData, setYearPixelData] = useState<YearPixelDataMap>({});
  const [stats, setStats] = useState<PixelStats>({
    fastDays: 0,
    fastHour: 0,
    logDays: 0,
  });

  const gridData = useMemo(() => {
    return generateYearGrid(year);
  }, [year]);

  const currentWeekY = Math.max(0, getWeek(new Date()) - 4);

  const lastScrollY = useRef(0);

const handleScroll = useCallback(
  (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const scrollingUp = y < lastScrollY.current;

    if (scrollingUp !== isScrollUp) {
      setIsScrollUp(scrollingUp);
    }

    lastScrollY.current = y;
  },
  [isScrollUp],
);

  const scrollToSection = useCallback((sectionIndex: number, itemIndex = 0) => {
    sectionListRef.current?.scrollToLocation({
      sectionIndex,
      itemIndex,
      animated: true,
    });
  }, []);

  const handleSelectDate = useCallback(
    (date: string) => {
      console.log("handleSelectDate", Date.now());
      const data = yearPixelData[date];
      console.log("selected Date ", date, data);
      if (!data) return;

      if (data.note || data.logs.length > 0) {
        present(
          <PixelDetailSheet
            dateString={date}
            note={data.note}
            log={data.logs}
          />,
          {
            snapPoints: ["100%"],
          },
        );
        console.log("present ", Date.now());
      } else if (data.shieldLog) {
        // TODO: Show shield log detail
      }
    },
    [yearPixelData, present],
  );

  const getYearData = useCallback(
    async (targetYear: number) => {
      setIsLoading(true);
      const [logs, notes, shieldUsed] = await Promise.all([
        dbService.getPixelLogData(targetYear),
        dbService.getPixelNoteData(targetYear),
        dbService.getPixelShielLog(targetYear),
      ]);

      const { yearMap, stats } = buildPixelYearData({
    logs,
    notes,
    shieldUsed,
    currentFastSession,
  });

      

      setYearPixelData(yearMap);
      setStats(stats);
      setIsLoading(false);
    },
    [currentFastSession, dbService],
  );

  useEffect(() => {
    dbService.setting("pixel_view_mode", viewMode || "fasting");
    updateSetting({ pixel_view_mode: viewMode });
  }, [viewMode, dbService, updateSetting]);

  // Initial Auto Scroll to Current Week
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToSection(0, currentWeekY);
    }, 500);
    return () => clearTimeout(timer);
  }, [currentWeekY, scrollToSection]);

  // Refetch data on screen focus
  useFocusEffect(
    useCallback(() => {
      const task = requestIdleCallback(() => {
        getYearData(year);
      });

      return () => {
        cancelIdleCallback(task);
      };
    }, [year, getYearData]),
  );

  return (
    <ThemedView className="flex-1 bg-background">
      <View className="absolute bottom-12 right-2 z-10">
        {isScrollUp && yIndex > height ? (
          <Pressable
            onPress={() => scrollToSection(0)}
            className="bg-primary h-12 w-12 rounded-full items-center justify-center opacity-60"
          >
            <Feather name="arrow-up" size={20} color="white" />
          </Pressable>
        ) : (
          yIndex > ITEM_HEIGHT &&
          currentWeekY * ITEM_HEIGHT + HEADER_HEIGHT > height &&
          yIndex < currentWeekY * ITEM_HEIGHT + HEADER_HEIGHT - height && (
            <Pressable
              onPress={() => scrollToSection(0, currentWeekY)}
              className="bg-primary h-12 w-12 rounded-full items-center justify-center opacity-60"
            >
              <Feather name="arrow-down" size={20} color="white" />
            </Pressable>
          )
        )}
      </View>
      <View
        style={{ paddingTop: StatusBar.currentHeight || 0 }}
        className="h-full w-full"
      >
        <SectionList
          ref={sectionListRef}
          contentContainerStyle={{
            paddingHorizontal: 10,
            gap: 4,
          }}
          onScroll={handleScroll}
          getItemLayout={(data, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          sections={[{ key: "calendar", data: gridData }]}
          ListHeaderComponent={
              <PixelHeader
                stats={stats}
                year={year}
                setYear={setYear}
                viewMode={viewMode}
                setViewMode={setViewMode}
              />
          }
          renderSectionHeader={() => (
            <View className="bg-background rounded-lg pr-1 pb-1 overflow-hidden">
              {/* Header Thứ (T2 -> CN) */}
              <View className="flex-row mb-2 items-center">
                <TouchableOpacity
                  activeOpacity={0.7}
                  hitSlop={25}
                  style={{ borderTopLeftRadius: 4 }}
                  className="w-15 bg-primary justify-center items-center"
                >
                  <ThemedText
                    size="xs"
                    weight="bold"
                    colorHex="#FFFFFF"
                    style={{ paddingVertical: 4 }}
                  >
                    Week
                  </ThemedText>
                </TouchableOpacity>

                <View className="flex-1 flex-row justify-between">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    (day, idx) => (
                      <View
                        key={idx}
                        className="flex-1 items-center justify-center pt-1"
                      >
                        <ThemedText size="xxs" color="text" opacity="medium">
                          {day}
                        </ThemedText>
                      </View>
                    ),
                  )}
                </View>
              </View>
            </View>
          )}
          stickySectionHeadersEnabled
          contentContainerClassName="gap-1"
          keyExtractor={(week) => week.weekIndex.toString()}
          renderItem={({ item }) => (
            <WeekRow
              week={item}
              todayStr={todayStr}
              viewMode={viewMode}
              yearPixelData={yearPixelData}
              onSelectDate={handleSelectDate}
            />
          )}
        />
      </View>
    </ThemedView>
  );
};

export default PixelScreen;
