import PixelHeader from "@/components/pixel/Header";
import PixelInYear from "@/components/pixel/PixelInYear";
import PixelStatistic from "@/components/pixel/Statistic";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useDBService } from "@/hooks/useDBService";
import { DailyLog, DailyNote } from "@/interfaces/db.type";
import { useAppStore } from "@/stores/appStore";
import { DissectedDay, splitSessionIntoDays } from "@/util/home/timespliter";
import { Feather } from "@expo/vector-icons";
import { getWeek } from "date-fns";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

// 1. Định nghĩa các chế độ xem (View Options)
type ViewMode = "fasting" | "mood";

interface EmojiGuide {
  emoji: string;
  label: string;
}

export const generateMockYearData = (targetYear: number = 2026) => {
  const notes: DailyNote[] = [];
  const logs: DailyLog[] = [];

  // Danh sách các mốc Fasting thực tế (giờ)
  const fastMilestones = [16, 18, 20, 23, 36, 48, 72];

  // Mood levels (0: Rất tồi, 1: Tồi, 2: Bình thường, 3: Tốt, 4: Tuyệt vời)
  const moodLevels = [0, 1, 2, 3, 4] as const;

  // Giả lập dữ liệu từ đầu năm (01/01/2026) đến ngày hiện tại (25/08/2026)
  const startDate = new Date(targetYear, 0, 1);
  const endDate = new Date(targetYear, 7, 25); // Đến ngày 25/08/2026

  let currentDate = new Date(startDate);
  let fastSessionIdCounter = 1000;

  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");
    const dateString = `${year}-${month}-${day}`;

    const timeStamp = currentDate.getTime();

    // Giả lập tần suất user dùng app: ~70% số ngày sẽ có Fasting/Mood
    const shouldLogToday = Math.random() < 0.7;

    if (shouldLogToday) {
      // 1. Random Mood & Note
      const randomMood =
        moodLevels[Math.floor(Math.random() * moodLevels.length)];
      notes.push({
        log_date: dateString,
        mood_level: randomMood,
        note: `Ghi chú cho ngày ${dateString} - Cảm giác ${randomMood >= 3 ? "tốt" : "bình thường"}.`,
        sync_status: "synced" as SyncStatus,
        created_at: timeStamp,
        updated_at: timeStamp,
      });

      // 2. Random Fasting Session
      // Tỷ lệ: 80% chọn mốc ngắn (16-23h), 20% chọn mốc dài (36-72h)
      const isProlonged = Math.random() < 0.2;
      const targetHours = isProlonged
        ? fastMilestones[Math.floor(Math.random() * 3) + 4] // 36, 48, 72
        : fastMilestones[Math.floor(Math.random() * 4)]; // 16, 18, 20, 23

      // Thực tế đạt được (có thể đủ target hoặc chênh lệch nhẹ)
      const actualHours = Math.min(24, targetHours);
      fastSessionIdCounter++;

      logs.push({
        log_date: dateString,
        user_id: "user_alex_01",
        fast_id: `fast_${fastSessionIdCounter}`,
        hours_in_day: actualHours,
        elapsed_hours: targetHours,
        hours_in_fast: targetHours,
        is_deleted: 0,
        sync_status: "synced" as SyncStatus,
        created_at: timeStamp,
        updated_at: timeStamp,
      });
    }

    // Tịnh tiến sang ngày tiếp theo
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return { notes, logs };
};

const testNotes: DailyNote[] = [
  {
    log_date: "2026-08-20",
    mood_level: 3, // Mood Tốt
    note: "Hôm nay chạy bộ nhẹ 3km vào cuối phiên fast, người rất tỉnh táo.",
    image_uri: "file:///storage/emulated/0/Pictures/fast_20260820.jpg",
    sync_status: "synced",
    created_at: 1787184000000,
    updated_at: 1787184000000,
  },
  {
    log_date: "2026-08-21",
    mood_level: 2, // Mood Bình thường
    note: "Hơi thèm đồ ngọt vào khoảng tiếng thứ 14, nhưng uống thêm nước lọc là qua.",
    sync_status: "synced",
    created_at: 1787270400000,
    updated_at: 1787270400000,
  },
  {
    log_date: "2026-08-22",
    mood_level: 4, // Mood Tuyệt vời
    note: "Chinh phục mốc Monk Fast 23h! Cảm giác bụng nhẹ nhàng.",
    image_uri: "file:///storage/emulated/0/Pictures/meal_20260822.jpg",
    sync_status: "pending",
    created_at: 1787356800000,
    updated_at: 1787356800000,
  },
  {
    log_date: "2026-08-23",
    mood_level: 1, // Mood Tồi (do ăn đồ ngọt nhiều)
    note: "Xả giàn hơi quá tay buổi tối, bị đầy bụng.",
    sync_status: "synced",
    created_at: 1787443200000,
    updated_at: 1787443200000,
  },
  {
    log_date: "2026-08-24",
    mood_level: 3, // Mood Tốt
    note: "Bắt đầu lại phiên fast 18h dũng cảm.",
    sync_status: "synced",
    created_at: 1787529600000,
    updated_at: 1787529600000,
  },
  {
    log_date: "2026-08-25",
    mood_level: 2,
    note: "Đang duy trì phiên fast trong ngày.",
    sync_status: "synced",
    created_at: 1787616000000,
    updated_at: 1787616000000,
  },
];

const testLogs: DailyLog[] = [
  // --- PHIÊN 1: Fast 36h kéo dài vắt qua 2 ngày (20/08 đến 21/08) ---
  {
    log_date: "2026-08-20",
    user_id: "user_alex_01",
    fast_id: "fast_session_101",
    hours_in_day: 12.0, // 12 giờ rơi vào ngày 20
    elapsed_hours: 12.0, // Tính đến cuối ngày 20 đã nhịn được 12h
    hours_in_fast: 36.0, // Tổng thời lượng của cả phiên gốc là 36h
    is_deleted: 0,
    sync_status: "synced",
    created_at: 1787184000000,
    updated_at: 1787184000000,
  },
  {
    log_date: "2026-08-21",
    user_id: "user_alex_01",
    fast_id: "fast_session_101",
    hours_in_day: 24.0, // 24 giờ còn lại rơi vào ngày 21
    elapsed_hours: 36.0, // Cột mốc hoàn tất phiên 36h
    hours_in_fast: 36.0,
    is_deleted: 0,
    sync_status: "synced",
    created_at: 1787270400000,
    updated_at: 1787270400000,
  },

  // --- PHIÊN 2 & 3: Hai phiên ngắn diễn ra trong cùng ngày 22/08 ---
  {
    log_date: "2026-08-22",
    user_id: "user_alex_01",
    fast_id: "fast_session_102",
    hours_in_day: 16.0,
    elapsed_hours: 16.0,
    hours_in_fast: 16.0,
    is_deleted: 0,
    sync_status: "synced",
    created_at: 1787356800000,
    updated_at: 1787356800000,
  },
  {
    log_date: "2026-08-22",
    user_id: "user_alex_01",
    fast_id: "fast_session_103",
    hours_in_day: 4.5, // Phiên nhịn thêm buổi tối trong cùng ngày
    elapsed_hours: 4.5,
    hours_in_fast: 4.5,
    is_deleted: 0,
    sync_status: "synced",
    created_at: 1787380000000,
    updated_at: 1787380000000,
  },

  // --- PHIÊN 4: Nhịn gián đoạn 18h ngày 23/08 ---
  {
    log_date: "2026-08-23",
    user_id: "user_alex_01",
    fast_id: "fast_session_104",
    hours_in_day: 18.0,
    elapsed_hours: 18.0,
    hours_in_fast: 18.0,
    is_deleted: 0,
    sync_status: "synced",
    created_at: 1787443200000,
    updated_at: 1787443200000,
  },

  // --- PHIÊN 5: Nhịn gián đoạn 16h ngày 24/08 ---
  {
    log_date: "2026-08-24",
    user_id: "user_alex_01",
    fast_id: "fast_session_105",
    hours_in_day: 16.0,
    elapsed_hours: 16.0,
    hours_in_fast: 16.0,
    is_deleted: 0,
    sync_status: "synced",
    created_at: 1787529600000,
    updated_at: 1787529600000,
  },
];

const PixelScreen = () => {
  const dbService = useDBService();
  const { userProfile, currentFastSession } = useAppStore();
  const [trackingType, setTrackingType] = useState<"mood" | "fasting">(
    "fasting",
  );
  const [enableScroll, setEnableScroll] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("fasting");
  const { width, height } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const currentWeekY = useMemo(() => {
    const extraScroll = 100;
    const currentWeek = getWeek(new Date());
    const weekHeight = (width - 21 - (14 * 15) / 4) / 7;
    return Math.max(0, weekHeight * currentWeek - extraScroll);
  }, [width]);

  const [yIndex, setYIndex] = useState(0);
  const [isScrollUp, setIsScrollUp] = useState(false);

  const scrollTo = (y: number, animated: boolean = true) => {
    scrollRef.current?.scrollTo({
      y: y,
      animated: animated,
    });
  };

  const [year, setYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true); // Để hiển thị skeleton

  const [pixelNotes, setPixelNotes] = useState<{ [date: string]: DailyNote }>(
    {},
  );
  const [pixelLogs, setPixelLogs] = useState<{
    [date: string]: (DailyLog | DissectedDay)[];
  }>({});
  const [stats, setStats] = useState({ fastDays: 0, fastHour: 0, logDays: 0 });

  const getYearData = async (year: number) => {
    const { logs, notes } = generateMockYearData(year);
    setIsLoading(true);
    // const notes = (await dbService.getPixelNoteData(year));
    // const logs =(await dbService.getPixelLogData(year));
    const newStats = { fastDays: 0, fastHour: 0, logDays: 0 };
    // const stats = await dbService.getFastStatsSummary()

    const newNotes: typeof pixelNotes = {};
    notes.forEach((note) => {
      newNotes[note.log_date] = note;
      newStats.logDays += 1;
    });

    const newLogs: typeof pixelLogs = {};
    logs.forEach((log) => {
      newStats.fastHour += log.hours_in_day;
      if (newLogs[log.log_date]) {
        newLogs[log.log_date].push(log);
      } else {
        newStats.fastDays += 1;
        newLogs[log.log_date] = [log];
      }
    });

    // Đang có 1 phiên fast diễn ra
    if (currentFastSession?.start_time && !currentFastSession?.end_time) {
      const parsedDays = splitSessionIntoDays(
        currentFastSession.start_time,
        Math.floor(Date.now()),
      );
      console.log(parsedDays.map((x) => x.log_date));

      for (const log of parsedDays) {
        newStats.fastHour += log.hours_in_day;
        if (newLogs[log.log_date]) {
          newLogs[log.log_date].push(log);
        } else {
          newStats.fastDays += 1;
          newLogs[log.log_date] = [log];
        }
      }
    }

    setPixelNotes(newNotes);
    setPixelLogs(newLogs);
    setStats(newStats);
    setIsLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      console.log("focused");
      getYearData(year);
    }, [year]),
  );

  useEffect(() => {
    setTimeout(() => {
      scrollTo(currentWeekY);
    }, 500);
  }, []);

  return (
    <ThemedView className="flex-1 bg-main">
      <View className="absolute bottom-12 right-2 z-10">
        {isScrollUp && yIndex > height ? (
          <Pressable
            onPress={() => scrollTo(0)}
            className="bg-primary h-12 w-12 rounded-full items-center justify-center opacity-60"
          >
            <Feather name="arrow-up" size={20} color="white" />
          </Pressable>
        ) : (
          currentWeekY > height &&
          yIndex < currentWeekY - height && (
            <Pressable
              onPress={() => scrollTo(currentWeekY)}
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
        <ScrollView
          onScroll={(e) => {
            const newY = e.nativeEvent.contentOffset.y;
            setIsScrollUp(newY < yIndex);
            setYIndex(e.nativeEvent.contentOffset.y);
          }}
          ref={scrollRef}
          scrollEnabled={enableScroll}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          className="px-3"
          stickyHeaderIndices={[2]}
        >
          <PixelHeader />
          <View className="mt-4 mb-6">
            <PixelStatistic
              stats={stats}
              trackingType={trackingType}
              setTrackingType={setTrackingType}
            />
          </View>
          {/* <View className="py-4">
              <PixelOptions
                viewMode={viewMode}
                setViewMode={setViewMode}
                currentGuides={currentGuides}
              />
            </View> */}

          <View className="bg-background rounded-lg pr-1 pb-1 overflow-hidden">
            {/* Header Thứ (T2 -> CN) */}
            <View className="flex-row mb-2 items-center">
              {/* Thu gọn chiều rộng xuống w-12 vì nhãn bây giờ rất ngắn (chỉ có 'FEB' hoặc '12') */}
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

          {/* ─── BLOCK 2: PIXEL IN YEAR GRID ─── */}
          <PixelInYear
            displayType={trackingType}
            year={year}
            noteData={pixelNotes}
            logData={pixelLogs}
          />
        </ScrollView>
      </View>
    </ThemedView>
  );
};

export default PixelScreen;
