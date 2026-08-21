import PixelHeader from "@/components/pixel/Header";
import PixelInYear from "@/components/pixel/PixelInYear";
import PixelStatistic from "@/components/pixel/Statistic";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useDBService } from "@/hooks/useDBService";
import { Feather } from "@expo/vector-icons";
import { getWeek } from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
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

const FASTING_GUIDES: EmojiGuide[] = [
  { emoji: "🔥", label: "72+" },
  { emoji: "🔥", label: "<72H" },
  { emoji: "🔥", label: "<48H" },
  { emoji: "✅", label: "<36H" },
  { emoji: "⚠️", label: "<24H" },
  { emoji: "🍕", label: "<16H" },
];

const MOOD_GUIDES: EmojiGuide[] = [
  { emoji: "🥰", label: "Tuyệt vời" },
  { emoji: "🙂", label: "Ổn" },
  { emoji: "😐", label: "Bình thường" },
  { emoji: "😮‍💨", label: "Oải" },
  { emoji: "😫", label: "Tệ" },
];

// 2. Tạo Mock Data cho 53 tuần (365 ngày) để test layout
const generateMockYearData = () => {
  const weeks = [];
  const totalWeeks = 53;
  const daysOfWeek = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  const months = [
    "T1",
    "T2",
    "T3",
    "T4",
    "T5",
    "T6",
    "T7",
    "T8",
    "T9",
    "T10",
    "T11",
    "T12",
  ];

  for (let w = 0; w < totalWeeks; w++) {
    const weekDays = [];
    // Giả lập tháng ngẫu nhiên đổi dần theo tiến độ tuần để test nhãn rìa trái
    const currentMonthIndex = Math.min(Math.floor(w / 4.4), 11);

    for (let d = 0; d < 7; d++) {
      // Random dữ liệu hiển thị mẫu
      const randomFasting =
        FASTING_GUIDES[Math.floor(Math.random() * FASTING_GUIDES.length)];
      const randomMood =
        MOOD_GUIDES[Math.floor(Math.random() * MOOD_GUIDES.length)];

      weekDays.push({
        dayIndex: d,
        fastingEmoji: randomFasting.emoji,
        moodEmoji: randomMood.emoji,
        // Chỉ hiện nhãn Tháng ở ngày đầu tuần của tuần đầu tiên trong tháng đó
        isMonthStart: d === 0 && w % 4 === 0,
        monthLabel: months[currentMonthIndex],
      });
    }
    weeks.push({ weekIndex: w, days: weekDays });
  }
  return weeks;
};

const PixelScreen = () => {
  const dbService = useDBService();
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

  // Cache dữ liệu mock tránh re-render sinh data mới liên tục
  const yearData = useMemo(() => generateMockYearData(), []);

  const currentGuides = viewMode === "fasting" ? FASTING_GUIDES : MOOD_GUIDES;

  const scrollTo = (y: number, animated: boolean = true) => {
    scrollRef.current?.scrollTo({
      y: y,
      animated: animated,
    });
  };

  const getYearData = async ()=>{
    // const res = await dbService.();
  }

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
            <PixelStatistic />
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
          <PixelInYear />
        </ScrollView>
      </View>
    </ThemedView>
  );
};

export default PixelScreen;
