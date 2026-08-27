import { ThemedText } from "@/components/themed-text";
import { EMOTIONS, FASTING_TARGETS } from "@/constants/data";
import { DailyLog, DailyNote, HabitLog } from "@/interfaces/db.type";
import { useBottomSheet } from "@/provider/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import { DissectedDay } from "@/util/home/timespliter";
import { getLocalTodayStr } from "@/util/timer";
import { FontAwesome5 } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import PixelDetailSheet from "./PixelDetailSheet";

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
  shieldLogs: { [key: string]: HabitLog };
};

const PixelGridManager = (props: Props) => {
  const [inputYear, setInputYear] = useState<string>(
    new Date().getFullYear().toString(),
  );
  const [renderedYear, setRenderedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const flatListRef = useRef(FlatList);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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

  const { present, close } = useBottomSheet();
  useEffect(() => {
    if (selectedDate) {
      // show sheet
      const logData = props.logData[selectedDate];
      const noteData = props.noteData[selectedDate];

      console.log("props", logData, noteData);

      if (logData || noteData) {
        present({
          render: () => (
            <PixelDetailSheet
              dateString={selectedDate}
              note={noteData}
              log={logData}
            />
          ),
          title: "",
          size: "long",
          onClose: () => {
            setSelectedDate(null);
            close();
          },
        });
      } else {
        const shieldLogs = props.shieldLogs[selectedDate];

        if (shieldLogs) {
          //show shield log
        }
      }
    }
  }, [selectedDate]);

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
                    if (day.dateString > todayStr)
                      return <EmptyPixel isToday={false} key={dIdx} />;

                    const isToday = day.dateString === todayStr;
                    if (props.displayType === "mood") {
                      const pixelData = props.noteData[day.dateString];
                      if (!pixelData)
                        return <EmptyPixel isToday={isToday} key={dIdx} />;
                      return (
                        <MoodPixel
                          onPress={() => setSelectedDate(day.dateString)}
                          isToday={isToday}
                          key={dIdx}
                          data={pixelData}
                          isCurrentYear={day.isCurrentYear}
                        />
                      );
                    } else {
                      const pixelData = props.logData[day.dateString];
                      if (!pixelData) {
                        const logs = props.shieldLogs[day.dateString];
                        if (logs)
                          return (
                            <ShieldPixel
                              onPress={() => setSelectedDate(day.dateString)}
                              key={dIdx}
                              shieldLogs={logs}
                            />
                          );
                        return <EmptyPixel isToday={isToday} key={dIdx} />;
                      }

                      let fast = pixelData[0];
                      pixelData.forEach((data) => {
                        if (data.hours_in_fast > fast.hours_in_fast)
                          fast = data;
                      });
                      return (
                        <FastPixel
                          onPress={() => setSelectedDate(day.dateString)}
                          isToday={isToday}
                          key={dIdx}
                          data={fast}
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
        borderColor: isToday ? theme.primary + "80" : theme.text + "20",
      }}
      className={`flex-1 aspect-square justify-center items-center rounded-md border 
                      `}
    ></View>
  );
};

const ShieldPixel = ({
  shieldLogs,
  onPress,
}: {
  shieldLogs: HabitLog;
  onPress: () => void;
}) => {
  const { theme } = useAppStore();
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: "transparent",
      }}
      className={`flex-1 aspect-square justify-center items-center rounded-md border 
                      border-dashed border-white/5`}
    >
      <FontAwesome5 name="shield-alt" size={14} color={theme.primary} />
    </Pressable>
  );
};

const MoodPixel = ({
  data,
  isCurrentYear,
  isToday,
  onPress,
}: {
  data: DailyNote;
  isCurrentYear: boolean;
  isToday: boolean;
  onPress: () => void;
}) => {
  const pixel = EMOTIONS[data?.mood_level || 0];
  const { theme } = useAppStore();

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: pixel.color,
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
    </Pressable>
  );
};

const FastPixel = ({
  data,
  isCurrentYear,
  isToday,
  onPress,
}: {
  data: DailyLog | DissectedDay;
  isCurrentYear: boolean;
  isToday: boolean;
  onPress: () => void;
}) => {
  const pixel = FASTING_TARGETS.find(
    (target) =>
      target.hours <= data.hours_in_fast &&
      (!target.toHours || target.toHours >= data.hours_in_fast),
  );
  const progress = data.elapsed_hours / data.hours_in_fast;
  const baseOpacity = 0.5;
  const opacity = baseOpacity + (1 - baseOpacity) * progress;
  const { theme } = useAppStore();

  if (!pixel) return <EmptyPixel isToday={isToday} />;

  return (
    <Pressable
      onPress={onPress}
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
    </Pressable>
  );
};

type PixelType =
  | {
      type: "note";
      data: DailyNote;
    }
  | {
      type: "log";
      data: DailyLog | DissectedDay;
    }
  | {
      type: "shield";
      data: HabitLog;
    };

const NoteContent = ({ note }: { note: DailyNote }) => {};

const ShieldContent = ({ shieldLogs }: { shieldLogs: HabitLog }) => {
  return (
    <View>
      <Text className="text-white!">{JSON.stringify(shieldLogs)}</Text>
    </View>
  );
};

export default PixelGridManager;
