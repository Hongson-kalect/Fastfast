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
  Pressable,
  SectionList,
  StatusBar,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";

// 1. Định nghĩa các chế độ xem (View Options)

interface EmojiGuide {
  emoji: string;
  label: string;
}

const ITEM_HEIGHT = 40;
const HEADER_HEIGHT = 60;

export const generateRealisticYearData = (targetYear: number = 2026) => {
  const notes: DailyNote[] = [];
  const logs: DailyLog[] = [];
  const habitLogs: HabitLog[] = [];
  const fastSessions: FastSession[] = [];

  const createFast = ({
    id,
    dateStr,
    target,
    duration,
  }: {
    id: string;
    dateStr: string;
    target: number;
    duration: number;
  }) => {
    const timestamp = new Date(dateStr).getTime();
    fastSessions.push({
      id: id,
      start_time: timestamp,
      end_time: timestamp + duration * 1000,
      duration,
      target_duration: target,
      is_deleted: 0,
      sync_status: "synced" as SyncStatus,
      created_at: timestamp,
      updated_at: timestamp,
      user_id: "qq",
      status: "completed",
      rating: null,
      home_data_snapshot: null,
    });
  };

  const createLog = (
    dateStr: string,
    startStr: string,
    hoursInDay: number,
    elapsed: number,
    totalFast: number,
  ) => {
    const timestamp = new Date(dateStr).getTime();
    logs.push({
      log_date: dateStr,
      user_id: "user_alex_01",
      fast_id: `fast_session_${startStr}`,
      hours_in_day: hoursInDay,
      elapsed_hours: elapsed,
      hours_in_fast: totalFast,
      is_deleted: 0,
      sync_status: "synced" as SyncStatus,
      created_at: timestamp,
      updated_at: timestamp,
    });
  };

  const createNote = (
    dateStr: string,
    mood: 0 | 1 | 2 | 3 | 4,
    text: string,
  ) => {
    const timestamp = new Date(dateStr).getTime();
    notes.push({
      log_date: dateStr,
      mood_level: mood,
      note: text,
      image_uri:
        "https://wallpapers.com/images/hd/professional-portrait-background-raqacmglp56xscr1.jpg",
      sync_status: "synced" as SyncStatus,
      created_at: timestamp,
      updated_at: timestamp,
    });
  };

  // Hàm tạo log dùng Khiên bảo vệ (Shield)
  const createShieldLog = (
    dateStr: string,
    shieldDelta: number, // -1, -2, -3
    currentShieldSnap: number,
    description: string,
  ) => {
    const timestamp = new Date(dateStr).getTime();
    habitLogs.push({
      id: `habit_shield_${dateStr}`,
      log_date: dateStr,
      fast_id: `fast_session_${dateStr}`,
      type: "shield",
      shield_delta: shieldDelta,
      shield_snap: currentShieldSnap,
      habit_retain: 0,
      habit_snap: 100,
      description: description,
      is_deleted: 0,
      sync_status: "synced" as SyncStatus,
      created_at: timestamp,
      updated_at: timestamp,
    });
  };

  const runMultiDayFast = (
    startDateStr: string,
    daysCount: number,
    totalFastHours: 16 | 18 | 20 | 23 | 36 | 48 | 72,
  ) => {
    const [y, m, d] = startDateStr.split("-").map(Number);

    for (let i = 0; i < daysCount; i++) {
      let start = new Date(Date.UTC(y, m - 1, d + i));
      const d1 = start.toISOString().split("T")[0];
      start.setUTCDate(start.getUTCDate() + 1);
      const d2 = start.toISOString().split("T")[0];
      start.setUTCDate(start.getUTCDate() + 1);
      const d3 = start.toISOString().split("T")[0];
      if (totalFastHours < 24) {
        createLog(d1, d1, 4, 4, totalFastHours);
        createNote(d1, Math.floor(Math.random() * 4), "Bắt đầu nhịn tối");

        createLog(d2, d1, totalFastHours - 4, totalFastHours, totalFastHours);
        createNote(
          d2,
          Math.floor(Math.random() * 3),
          "Ngày thứ 2 mệt, cồn cào",
        );
      }

      if (totalFastHours === 36) {
        createLog(d1, d1, 4.0, 4.0, 36);
        createNote(d1, 2, "Bắt đầu nhịn tối");

        createLog(d2, d1, 24.0, 28.0, 36);
        createNote(d2, 1, "Ngày thứ 2 mệt, cồn cào");

        createLog(d3, d1, 8.0, 36.0, 36);
        createNote(d3, 4, "Hoàn thành 36h Titan Fast!");
      } else if (totalFastHours === 48) {
        createLog(d1, d1, 4.0, 4.0, 48);
        createNote(d1, 2, "Khởi động 48h Master Fast");

        createLog(d2, d1, 24.0, 28.0, 48);
        createNote(d2, 1, "Đốt mỡ sâu ngày 2");

        createLog(d3, d1, 20.0, 48.0, 48);
        createNote(d3, 4, "Cúp vô địch 48h!");
      } else if (totalFastHours === 72) {
        start.setUTCDate(start.getUTCDate() + 1);
        const d4 = start.toISOString().split("T")[0];

        createLog(d1, d1, 4.0, 4.0, 72);
        createLog(d2, d1, 24.0, 28.0, 72);
        createLog(d3, d1, 24.0, 52.0, 72);
        createLog(d4, d1, 20.0, 72.0, 72);
        createNote(d4, 4, "Đỉnh cao 72h Extended Fast!");
      }

      start.setUTCDate(start.getUTCDate() + 1);
    }
  };

  // ===========================================================================
  // TẠO DỮ LIỆU KÍN NĂM 2026 (THÁNG 1 -> THÁNG 8)
  // ===========================================================================

  // ----- THÁNG 1 -----
  runMultiDayFast("2026-01-02", 6, 16);
  runMultiDayFast("2026-01-09", 5, 16);
  runMultiDayFast("2026-01-15", 7, 18);
  runMultiDayFast("2026-01-23", 6, 16);
  // Dùng 1 khiên gánh ngày 2026-01-30 bị cúp
  createShieldLog(
    "2026-01-30",
    -1,
    4,
    "Tự động kích hoạt 1 khiên gánh ngày 29/01",
  );

  // ----- THÁNG 2 -----
  runMultiDayFast("2026-02-01", 6, 18);
  runMultiDayFast("2026-02-08", 5, 20);
  runMultiDayFast("2026-02-14", 6, 18);
  runMultiDayFast("2026-02-21", 5, 16);

  // ----- THÁNG 3 -----
  runMultiDayFast("2026-03-01", 5, 16);
  runMultiDayFast("2026-03-08", 1, 36);
  runMultiDayFast("2026-03-13", 6, 18);
  runMultiDayFast("2026-03-20", 7, 20);
  // Dùng 2 khiên gánh liền 2 ngày đi du lịch (2026-03-28 và 2026-03-29)
  createShieldLog(
    "2026-03-29",
    -2,
    2,
    "Dùng 2 khiên bảo vệ chuỗi trong chuyến đi du lịch",
  );

  // ----- THÁNG 4 -----
  runMultiDayFast("2026-04-01", 5, 18);
  runMultiDayFast("2026-04-07", 6, 18);
  createNote("2026-04-13", 0, "Tiệc sinh nhật, xả giàn không fast");
  runMultiDayFast("2026-04-15", 6, 16);
  runMultiDayFast("2026-04-22", 6, 18);

  // ----- THÁNG 5 -----
  runMultiDayFast("2026-05-01", 5, 20);
  runMultiDayFast("2026-05-08", 1, 48);
  runMultiDayFast("2026-05-14", 6, 18);
  runMultiDayFast("2026-05-21", 5, 20);
  // Dùng 3 khiên gánh chuỗi 3 ngày bị ốm (2026-05-27 -> 2026-05-29)
  createShieldLog(
    "2026-05-29",
    -3,
    1,
    "Bật 3 khiên bảo vệ chuỗi do sốt nghỉ ngơi",
  );

  // ----- THÁNG 6 -----
  runMultiDayFast("2026-06-01", 6, 18);
  runMultiDayFast("2026-06-08", 5, 23); // OMAD
  runMultiDayFast("2026-06-14", 6, 18);
  runMultiDayFast("2026-06-22", 1, 36);
  runMultiDayFast("2026-06-26", 4, 16);

  // ----- THÁNG 7 -----
  runMultiDayFast("2026-07-01", 5, 20);
  runMultiDayFast("2026-07-07", 6, 18);
  runMultiDayFast("2026-07-14", 1, 72); // Lần đầu chạm mốc 72h
  runMultiDayFast("2026-07-19", 6, 20);
  runMultiDayFast("2026-07-26", 5, 18);

  // ----- THÁNG 8 (Gần hiện tại) -----
  runMultiDayFast("2026-08-01", 6, 18);
  runMultiDayFast("2026-08-08", 5, 20);
  runMultiDayFast("2026-08-14", 5, 18);

  // Tuần 34 & 35
  createLog("2026-08-20", "2026-08-20", 23.0, 23.0, 23);
  createNote("2026-08-20", 3, "OMAD 23h xuất sắc");
  createLog("2026-08-21", "2026-08-21", 23.0, 23.0, 23);
  createNote("2026-08-21", 2, "Duy trì OMAD ngày 2");
  createLog("2026-08-22", "2026-08-22", 16.0, 16.0, 16);
  createNote("2026-08-22", 4, "Chuyển sang 16h nhẹ nhàng");
  createLog("2026-08-23", "2026-08-23", 16.0, 16.0, 16);
  createNote("2026-08-23", 1, "Hơi oải nhưng vẫn đạt 16h");

  // Đang chạy 36h từ ngày 24/08
  runMultiDayFast("2026-08-24", 1, 36);

  return { notes, logs, habitLogs };
};

const PixelScreen = () => {
  // ------------------------------------------------------------
  // 1. Custom Hooks & Global Stores
  // ------------------------------------------------------------
  const dbService = useDBService();
  const { present, hide } = useBottomSheet();
  const { width, height } = useWindowDimensions();
  const { userProfile, currentFastSession, settings, updateSetting, theme } =
    useAppStore();

  // ------------------------------------------------------------
  // 2. Refs
  // ------------------------------------------------------------
  const sectionListRef = useRef<SectionList>(null);
  const flatListRef = useRef<FlatList>(null);
  const yIndexRef = useRef(0);

  // ------------------------------------------------------------
  // 3. Local States
  // ------------------------------------------------------------
  const todayStr = getLocalTodayStr();
  const currentYear = new Date().getFullYear();

  const [year, setYear] = useState(currentYear);
  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr);
  const [viewMode, setViewMode] = useState<ViewMode>(
    settings?.pixel_view_mode || "fasting",
  );

  // Scroll States
  const [enableScroll, setEnableScroll] = useState(true);
  const [yIndex, setYIndex] = useState(0);
  const [isScrollUp, setIsScrollUp] = useState(false);

  // Data States
  const [isLoading, setIsLoading] = useState(true);
  const [yearPixelData, setYearPixelData] = useState<YearPixelDataMap>({});
  const [stats, setStats] = useState<PixelStats>({
    fastDays: 0,
    fastHour: 0,
    logDays: 0,
  });

  // ------------------------------------------------------------
  // 4. Memos & Derived State
  // ------------------------------------------------------------
  const gridData = useMemo(() => {
    return generateYearGrid(year);
  }, [year]);

  const currentWeekY = useMemo(() => {
    const currentWeek = getWeek(new Date());
    return Math.max(0, currentWeek);
  }, [width]);

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
      setSelectedDate(date);
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

  // ------------------------------------------------------------
  // 6. Data Fetching
  // ------------------------------------------------------------
  const getYearData = useCallback(
    async (targetYear: number) => {
      setIsLoading(true);

      const {
        logs,
        notes,
        habitLogs: shieldUsed,
      } = generateRealisticYearData(targetYear);

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

      setYearPixelData(yearMap);
      setStats(newStats);
      setIsLoading(false);
    },
    [currentFastSession],
  );

  // ------------------------------------------------------------
  // 7. Effects & Screen Lifecycle
  // ------------------------------------------------------------
  // Save View Mode setting
  useEffect(() => {
    dbService.setting("pixel_view_mode", viewMode || "fasting");
    updateSetting({ pixel_view_mode: viewMode });
  }, [viewMode]);

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

      // return () => {
      //   task.cancel();
      // };
    }, [year, getYearData]),
  );

  useEffect(() => {
    console.log("yIndex", yIndex);
  }, [yIndex]);

  return (
    <ThemedView className="flex-1 bg-main">
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
        className="h-full w-full px-3"
      >
        <SectionList
          ref={sectionListRef}
          onScroll={(e) => {
            const newY = e.nativeEvent.contentOffset.y;
            setIsScrollUp(newY < yIndex);
            setYIndex(e.nativeEvent.contentOffset.y);
          }}
          getItemLayout={(data, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          sections={[{ key: "calendar", data: gridData }]}
          ListHeaderComponent={
            <PixelHeader
              stats={stats}
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
                  <ThemedText className="text-[12px]! py-1 text-white! font-bold">
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
                        <ThemedText className="text-[10px]! text-white! opacity-70">
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
