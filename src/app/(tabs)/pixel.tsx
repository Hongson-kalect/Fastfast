import PixelHeader from "@/components/pixel/Header";
import PixelInYear from "@/components/pixel/PixelInYear";
import PixelOptions from "@/components/pixel/PixelOptions";
import { ThemedView } from "@/components/themed-view";
import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  const [enableScroll, setEnableScroll] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("fasting");

  // Cache dữ liệu mock tránh re-render sinh data mới liên tục
  const yearData = useMemo(() => generateMockYearData(), []);

  const currentGuides = viewMode === "fasting" ? FASTING_GUIDES : MOOD_GUIDES;

  return (
    <ThemedView className="flex-1 bg-main">
      <SafeAreaView className="flex-1">
        <ScrollView
          scrollEnabled={enableScroll}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="px-3">
            <PixelHeader />

            <PixelOptions
              viewMode={viewMode}
              setViewMode={setViewMode}
              currentGuides={currentGuides}
            />

            {/* ─── BLOCK 2: PIXEL IN YEAR GRID ─── */}
            <PixelInYear />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
};

export default PixelScreen;
