import { ThemedText } from "@/components/themed-text";
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

export const generateMockDataObj = (targetYear: number): DayItemObj => {
  const mockData: DayItemObj = {};

  // Tạo mốc thời gian bắt đầu từ 1/1 và kết thúc ở 31/12
  const startDate = new Date(targetYear, 0, 1);
  const endDate = new Date(targetYear, 11, 31);

  const currentPointer = new Date(startDate);

  while (currentPointer <= endDate) {
    const currentYear = currentPointer.getFullYear();
    const currentMonth = currentPointer.getMonth();
    const currentDate = currentPointer.getDate();

    // Format chuẩn key YYYY-MM-DD
    const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(currentDate).padStart(2, "0")}`;

    // Giả lập: Không phải ngày nào người dùng cũng điền log (tỷ lệ 85% có data)
    if (Math.random() > 0.15) {
      // Random ngẫu nhiên số giờ nhịn từ 14h đến 22h
      const fastingHours = Math.floor(Math.random() * 9) + 14;
      // Random target mục tiêu (ví dụ: 16h, 18h, 20h)
      const targetOptions = [16, 18, 20];
      const targetRange =
        targetOptions[Math.floor(Math.random() * targetOptions.length)];

      mockData[dateString] = {
        dateString,
        moodIndex: Math.floor(Math.random() * 5) + 1, // Random từ 1 -> 5
        fastingHours,
        fastingRange: targetRange, // Giờ mục tiêu nhịn đặt ra ngày đó
        isCurrentYear: true,
      };
    }

    // Tịnh tiến lên 1 ngày
    currentPointer.setDate(currentPointer.getDate() + 1);
  }

  return mockData;
};

const generateYearGrid = (
  targetYear: number,
  dataObj?: DayItemObj,
): WeekItem[] => {
  const weeks: WeekItem[] = [];
  const firstDayOfYear = new Date(targetYear, 0, 1);

  // Tìm Thứ 2 đầu tiên của chuỗi
  let dayOfWeek = firstDayOfYear.getDay();
  let daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const currentPointer = new Date(firstDayOfYear);
  currentPointer.setDate(currentPointer.getDate() - daysToSubtract);

  const lastDayOfYear = new Date(targetYear, 11, 31);
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
  const trackedMonths = new Set<number>(); // Đảm bảo mỗi tháng chỉ kích hoạt nhãn Tháng đúng 1 lần

  let currentWeekNum: number = 1;

  while (currentPointer <= lastDayOfYear || currentPointer.getDay() !== 1) {
    if (currentPointer > lastDayOfYear && currentPointer.getDay() === 1) {
      break;
    }

    const days: DayItem[] = [];
    let monthLabelToUse = "";
    let shouldBeMonthHeader = false;

    // Lưu lại trạng thái của 7 ngày trong tuần này trước khi tịnh tiến pointer
    const tempPointer = new Date(currentPointer);

    // Quét trước 7 ngày của tuần này để tìm xem có ngày mùng 1 đầu tháng nào thuộc năm target không
    for (let i = 0; i < 7; i++) {
      const m = tempPointer.getMonth();
      const d = tempPointer.getDate();
      const y = tempPointer.getFullYear();

      // Nếu tìm thấy ngày mùng 1 đầu tháng (hoặc ngày đầu tiên của năm trong Grid)
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

    // Build dữ liệu thực tế cho 7 ngày
    for (let i = 0; i < 7; i++) {
      const currentYear = currentPointer.getFullYear();
      const currentMonth = currentPointer.getMonth();
      const currentDate = currentPointer.getDate();
      const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(currentDate).padStart(2, "0")}`;

      const data = dataObj?.[dateString];

      days.push({
        dateString,
        dayOfMonth: currentDate,
        isCurrentYear: currentYear === targetYear,
        data,
      });

      currentPointer.setDate(currentPointer.getDate() + 1);
    }

    // Xác định text hiển thị cho rìa trái
    const currentWeekStr = currentWeekNum.toString().padStart(2, "0");
    let finalLabel = currentWeekStr;

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

const PixelGridManager = () => {
  const [inputYear, setInputYear] = useState<string>(
    new Date().getFullYear().toString(),
  );
  const [renderedYear, setRenderedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const flatListRef = useRef(FlatList);

  const gridData = useMemo(() => {
    const dataObj = generateMockDataObj(renderedYear);
    return generateYearGrid(renderedYear, dataObj);
  }, [renderedYear]);

  const handleRender = () => {
    const yearNum = parseInt(inputYear, 10);
    if (!isNaN(yearNum) && yearNum > 1900 && yearNum < 2100) {
      setRenderedYear(yearNum);
    }
  };

  return (
    <View>
      {/* KHU VỰC CONTROLLER */}
      <View className="bg-white/5 rounded-lg pr-1 pb-1 overflow-hidden">
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
                  {week.days.map((day, dIdx) => (
                    <View
                      style={{
                        backgroundColor: day?.data?.moodIndex
                          ? moodArr[day?.data?.moodIndex - 1].color + "dd"
                          : "transparent",
                      }}
                      key={dIdx}
                      className={`flex-1 aspect-square justify-center items-center rounded-md border 
                      ${
                        day.isCurrentYear
                          ? "bg-white/10 border-white/10"
                          : "bg-white/2 border-dashed border-white/5"
                      }`}
                    >
                      <Text
                        className={`text-[16px]! font-medium ${
                          day.isCurrentYear ? "text-white" : "text-white/20"
                        }`}
                      >
                        {/* {day.dayOfMonth} */}
                        {day?.data?.moodIndex
                          ? moodArr[day?.data?.moodIndex - 1].emoji
                          : ""}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          />
        </View>
      </View>
    </View>
  );
};

export default PixelGridManager;
