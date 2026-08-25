import { ThemedText } from "@/components/themed-text";
import { FASTING_TARGETS } from "@/constants/data";
import { DailyLog, DailyNote } from "@/interfaces/db.type";
import { useAppStore } from "@/stores/appStore";
import { DissectedDay } from "@/util/home/timespliter";
import { getLocalTodayStr } from "@/util/timer";
import { useMemo, useRef, useState } from "react";
import { FlatList, Text, View } from "react-native";

interface DayItem {
  dateString: string;
  dayOfMonth: number;
  isCurrentYear: boolean;
  data?: DayItemType;
}

interface WeekItem {
  weekIndex: number; // 0, 1, 2... tương ứng với hàng
  weekNumberInYear: number; // Số tuần thực tế trong năm (1, 2, 3...)
  month: string; // Nhãn hiển thị bên trái (W1 hoặc JAN - 1)
  weekOfYear: string; // Nhãn hiển thị bên trái (W1 hoặc JAN - 1)
  isMonthHeader: boolean; // Dùng để xác định xem có cần in đậm label không
  days: DayItem[];
}

// ─── THUẬT TOÁN SINH LƯỚI PIXEL ĐÃ NÂNG CẤP NHÃN BIÊN ───
type DayItemType = {
  dateString: string;
  moodIndex: number;
  fastingHours: number;
  fastingRange: number;
  isCurrentYear: boolean;
};

type DayItemObj = {
  [key: string]: DayItemType;
};

// export const moodArr = [
//   { index: 1, emoji: "😫", label: "Tired", color: "#541A1A" }, // Đỏ bã trầu đậm sâu (Deep Wine)
//   { index: 2, emoji: "😮‍💨", label: "Bad", color: "#5C3A15" }, // Nâu cam đất trầm (Dark Amber)
//   { index: 3, emoji: "🙂", label: "Fine", color: "#544D17" }, // Vàng rêu/Úa tối (Muted Olive) - Đủ phân biệt nhưng không bị chói như vàng chanh
//   { index: 4, emoji: "😃", label: "Good", color: "#164454" }, // Xanh slate/Cyan tối (Deep Ocean Blue)
//   { index: 5, emoji: "🥰", label: "Happy", color: "#2B4C15" }, // Xanh lá cây sẫm (Deep Forest Green)
// ];

export const moodArr = [
  { index: 1, emoji: "😫", label: "Tired", color: "#6E2020" }, // Đỏ trầm nhưng có sắc hồng (Crimson Dark) - Rõ ràng là tiêu cực
  { index: 2, emoji: "😮‍💨", label: "Bad", color: "#874D14" }, // Cam cháy/Hổ phách (Amber Earth) - Tách biệt hẳn với đỏ
  { index: 3, emoji: "🙂", label: "Fine", color: "#3A3F47" }, // Xám Slate trung tính - Đúng nghĩa "Bình thường", giúp các ngày vui/buồn khác nổi bật lên
  { index: 4, emoji: "😃", label: "Good", color: "#1A5C70" }, // Xanh ngọc biển (Deep Teal) - Bắt đầu có năng lượng tích cực
  { index: 5, emoji: "🥰", label: "Happy", color: "#2E6930" }, // Xanh lá Emerald trầm - Trạng thái tốt nhất
];

export const fastArr = [
  { index: 1, emoji: "😫", label: "Tired", color: "#6E2020" }, // Đỏ tràm nhưng cô sắc hồng (Crimson Dark) - Rô ràng là tiêu cúc
];

export const generateYearGrid = (
  targetYear: number,
  sundayFirst: boolean = false,
): WeekItem[] => {
  const weeks: WeekItem[] = [];
  const firstDayOfYear = new Date(targetYear, 0, 1);

  // Tìm ngày bắt đầu tuần đầu tiên
  const dayOfWeek = firstDayOfYear.getDay(); // 0: Sun, 1: Mon, ...
  let daysToSubtract = 0;

  if (sundayFirst) {
    // Nếu Chủ Nhật là ngày đầu tuần -> Chủ Nhật lùi 0 ngày
    daysToSubtract = dayOfWeek;
  } else {
    // Nếu Thứ 2 là ngày đầu tuần -> Chủ Nhật lùi 6 ngày, Thứ 2 lùi 0 ngày
    daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  }

  const currentPointer = new Date(firstDayOfYear);
  currentPointer.setDate(currentPointer.getDate() - daysToSubtract);

  const lastDayOfYear = new Date(targetYear, 11, 31);
  const targetStartDay = sundayFirst ? 0 : 1; // 0: Sun, 1: Mon

  const shortMonths = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  const trackedMonths = new Set<number>();

  let currentWeekNum: number = 1;

  while (
    currentPointer <= lastDayOfYear ||
    currentPointer.getDay() !== targetStartDay
  ) {
    if (
      currentPointer > lastDayOfYear &&
      currentPointer.getDay() === targetStartDay
    ) {
      break;
    }

    const days: DayItem[] = [];
    let monthLabelToUse = "";
    let shouldBeMonthHeader = false;

    // Quét trước 7 ngày của tuần này để đặt Label Tháng
    const tempPointer = new Date(currentPointer);
    for (let i = 0; i < 7; i++) {
      const m = tempPointer.getMonth();
      const d = tempPointer.getDate();
      const y = tempPointer.getFullYear();

      if (
        y === targetYear &&
        (d === 1 || (m === 0 && d === firstDayOfYear.getDate() && i === 0))
      ) {
        if (!trackedMonths.has(m)) {
          monthLabelToUse = shortMonths[m];
          shouldBeMonthHeader = true;
          trackedMonths.add(m);
        }
      }
      tempPointer.setDate(tempPointer.getDate() + 1);
    }

    // Build 7 ngày thực tế
    for (let i = 0; i < 7; i++) {
      const currentYear = currentPointer.getFullYear();
      const currentMonth = currentPointer.getMonth();
      const currentDate = currentPointer.getDate();
      const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(currentDate).padStart(2, "0")}`;

      days.push({
        dateString,
        dayOfMonth: currentDate,
        isCurrentYear: currentYear === targetYear,
      });

      currentPointer.setDate(currentPointer.getDate() + 1);
    }

    weeks.push({
      weekIndex: currentWeekNum - 1,
      weekNumberInYear: currentWeekNum,
      month: monthLabelToUse,
      weekOfYear: currentWeekNum.toString().padStart(2, "0"),
      isMonthHeader: shouldBeMonthHeader,
      days,
    });

    currentWeekNum++;
  }

  return weeks;
};

type Props = {
  displayType: "mood" | "fasting";
  year: number;
  noteData: { [key: string]: DailyNote };
  logData: { [key: string]: (DailyLog | DissectedDay)[] };
};

const PixelGridManager = (props: Props) => {
  const [inputYear, setInputYear] = useState<string>(
    new Date().getFullYear().toString(),
  );
  const [renderedYear, setRenderedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const flatListRef = useRef(FlatList);

  const gridData = useMemo(() => {
    return generateYearGrid(renderedYear);
  }, [renderedYear]);

  const todayStr = useMemo(() => {
    return getLocalTodayStr();
  }, []);

  const handleRender = () => {
    const yearNum = parseInt(inputYear, 10);
    if (!isNaN(yearNum) && yearNum > 1900 && yearNum < 2100) {
      setRenderedYear(yearNum);
    }
  };

  return (
    <View>
      {/* KHU VỰC CONTROLLER */}
      <View className="bg-background/5 rounded-lg pr-1 py-1 overflow-hidden">
        {/* Header Thứ (T2 -> CN) */}

        {/* Danh sách các tuần */}
        <View className="gap-y-1.5">
          <FlatList
            scrollEnabled={false}
            data={gridData}
            contentContainerClassName="gap-1"
            keyExtractor={(week) => week.weekIndex.toString()}
            renderItem={({ item: week }) => (
              <View key={week.weekIndex} className="flex-row items-center">
                {/* CỘT RIỀA TRÁI TỐI GIẢN (w-12) */}
                <View className="w-15 pl-1 justify-center items-center">
                  {week.isMonthHeader && (
                    <View className="absolute -top-2 left-0 -rotate-45">
                      <ThemedText className="text-[8px]! text-emerald-400! opacity-100">
                        {week.month}
                      </ThemedText>
                    </View>
                  )}
                  <ThemedText
                    className={
                      "text-center text-[10px]! font-regular text-white/70!"
                    }
                  >
                    {week.weekOfYear}
                  </ThemedText>
                </View>

                {/* Hàng 7 ô pixel ngày */}
                <View className="flex-1 flex-row justify-between gap-x-1">
                  {week.days.map((day, dIdx) => {
                    const isToday = day.dateString === todayStr;
                    if (props.displayType === "mood") {
                      const pixelData = props.noteData[day.dateString];
                      if (!pixelData)
                        return <EmptyPixel isToday={isToday} key={dIdx} />;
                      return (
                        <MoodPixel
                          isToday={isToday}
                          key={dIdx}
                          data={pixelData}
                          isCurrentYear={day.isCurrentYear}
                        />
                      );
                    } else {
                      const pixelData = props.logData[day.dateString];
                      if (!pixelData)
                        return <EmptyPixel isToday={isToday} key={dIdx} />;
                      return (
                        <FastPixel
                          isToday={isToday}
                          key={dIdx}
                          data={pixelData}
                          isCurrentYear={day.isCurrentYear}
                        />
                      );
                    }
                  })}
                </View>
              </View>
            )}
          />
        </View>
      </View>
    </View>
  );
};

const EmptyPixel = ({ isToday }: { isToday: boolean }) => {
  const { theme } = useAppStore();
  return (
    <View
      style={{
        backgroundColor: "transparent",
        boxShadow: isToday ? "0 0 0 1px " + theme.primary + "80" : "none",
      }}
      className={`flex-1 aspect-square justify-center items-center rounded-md border 
                      `}
    ></View>
  );
};

const MoodPixel = ({
  data,
  isCurrentYear,
  isToday,
}: {
  data: DailyNote;
  isCurrentYear: boolean;
  isToday: boolean;
}) => {
  const pixel = moodArr[data?.mood_level || 0];
  const { theme } = useAppStore();
  return (
    <View
      style={{
        backgroundColor: pixel.color + "88",
        boxShadow: isToday ? "0 0 0 1px " + theme.primary + "80" : "none",
      }}
      className={`flex-1 aspect-square justify-center items-center rounded-md border 
                      ${
                        isCurrentYear
                          ? "border-white/10"
                          : "border-dashed border-white/5"
                      }`}
    >
      <Text
        className={`text-[14px]! font-medium ${
          isCurrentYear ? "text-white" : "text-white/20"
        }`}
      >
        {pixel.emoji}
      </Text>
    </View>
  );
};

const FastPixel = ({
  data,
  isCurrentYear,
  isToday,
}: {
  data: (DailyLog | DissectedDay)[];
  isCurrentYear: boolean;
  isToday: boolean;
}) => {
  const fast = useMemo(() => {
    let maxFast = data[0];
    data.forEach((fast) => {
      if (fast.hours_in_fast > maxFast.hours_in_fast) maxFast = fast;
    });
    return maxFast;
  }, [data]);

  const pixel = FASTING_TARGETS.find(
    (target) =>
      target.hours <= fast.hours_in_fast &&
      (!target.toHours || target.toHours >= fast.hours_in_fast),
  );
  const progress = fast.elapsed_hours / fast.hours_in_fast;
  const baseOpacity = 0.5;
  const opacity = baseOpacity + (1 - baseOpacity) * progress;
  const { theme } = useAppStore();

  if (!pixel) return <EmptyPixel isToday={isToday} />;

  return (
    <View
      style={{
        opacity,
        backgroundColor: pixel.colors.accent + "88",
        boxShadow: isToday ? "0 0 0 1px " + theme.primary + "80" : "none",
      }}
      className={`flex-1 aspect-square justify-center items-center rounded-md border 
                      ${
                        isCurrentYear
                          ? "bg-white/10 border-white/10"
                          : "bg-white/2 border-dashed border-white/5"
                      }`}
    >
      <Text
        // style={{ opacity }}
        className={`text-[14px]! font-medium ${
          isCurrentYear ? "text-white" : "text-white/20"
        }`}
      >
        {pixel.emoji}
      </Text>
    </View>
  );
};

export default PixelGridManager;
