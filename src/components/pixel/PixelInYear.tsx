import { ThemedText } from "@/components/themed-text";
import { useMemo, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

interface DayItem {
  dateString: string;
  dayOfMonth: number;
  isCurrentYear: boolean;
}

interface WeekItem {
  weekIndex: number; // 0, 1, 2... tương ứng với hàng
  weekNumberInYear: number; // Số tuần thực tế trong năm (1, 2, 3...)
  label: string; // Nhãn hiển thị bên trái (W1 hoặc JAN - 1)
  isMonthHeader: boolean; // Dùng để xác định xem có cần in đậm label không
  days: DayItem[];
}

// ─── THUẬT TOÁN SINH LƯỚI PIXEL ĐÃ NÂNG CẤP NHÃN BIÊN ───
const generateYearGrid = (targetYear: number): WeekItem[] => {
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

      days.push({
        dateString,
        dayOfMonth: currentDate,
        isCurrentYear: currentYear === targetYear,
      });

      currentPointer.setDate(currentPointer.getDate() + 1);
    }

    // Xác định text hiển thị cho rìa trái
    const currentWeekStr = currentWeekNum.toString().padStart(2, "0");
    let finalLabel = currentWeekStr;
    if (shouldBeMonthHeader && monthLabelToUse) {
      finalLabel = monthLabelToUse;
    }

    weeks.push({
      weekIndex: currentWeekNum - 1,
      weekNumberInYear: currentWeekNum,
      label: finalLabel,
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

  const gridData = useMemo(
    () => generateYearGrid(renderedYear),
    [renderedYear],
  );

  const handleRender = () => {
    const yearNum = parseInt(inputYear, 10);
    if (!isNaN(yearNum) && yearNum > 1900 && yearNum < 2100) {
      setRenderedYear(yearNum);
    }
  };

  return (
    <View className="p-3 bg-transparent">
      {/* KHU VỰC CONTROLLER */}
      <View className="bg-white/5 p-4 rounded-2xl border border-white/10 mb-4 flex-row items-center gap-3">
        <View className="flex-1">
          <ThemedText className="text-xs opacity-60 mb-1">
            Nhập năm cần xem
          </ThemedText>
          <TextInput
            value={inputYear}
            onChangeText={setInputYear}
            keyboardType="number-pad"
            maxLength={4}
            className="bg-black/30 text-white font-bold text-base px-3 py-2 rounded-xl border border-white/5"
          />
        </View>
        <TouchableOpacity
          onPress={handleRender}
          className="bg-emerald-600 active:opacity-80 px-5 py-3 rounded-xl justify-center h-[50px] mt-4"
        >
          <Text className="text-white font-bold text-sm">Render Bảng</Text>
        </TouchableOpacity>
      </View>

      {/* BẢNG PIXEL IN YEAR */}
      <View className="bg-white/5 rounded-2xl p-3 border border-white/10">
        <ThemedText className="text-center font-bold text-sm mb-4 text-secondary">
          SƠ ĐỒ PIXEL NĂM {renderedYear}
        </ThemedText>

        {/* Header Thứ (T2 -> CN) */}
        <View className="flex-row mb-2 items-center">
          {/* Thu gọn chiều rộng xuống w-12 vì nhãn bây giờ rất ngắn (chỉ có 'FEB' hoặc '12') */}
          <View className="w-10 mr-2">
            <ThemedText className="text-[11px]! font-semibold opacity-40">
              Week
            </ThemedText>
          </View>
          <View className="flex-1 flex-row justify-between">
            {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day, idx) => (
              <View key={idx} className="flex-1 items-center justify-center">
                <ThemedText className="text-[11px]! font-semibold opacity-40">
                  {day}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Danh sách các tuần */}
        <View className="gap-y-1.5">
          {gridData.map((week) => (
            <View key={week.weekIndex} className="flex-row items-center">
              {/* CỘT RIỀA TRÁI TỐI GIẢN (w-12) */}
              <View className="w-10 items-start justify-center mr-2">
                <ThemedText
                  className={`text-[11px] ${
                    week.isMonthHeader
                      ? "text-[11px]! font-bold text-emerald-400! opacity-100 text-xs" // Tên tháng: Sáng, Đậm, To hơn một chút
                      : "text-[9px]! font-regular text-white/30" // Số tuần thường: Mờ, Nhẹ
                  }`}
                >
                  {week.label}
                </ThemedText>
              </View>

              {/* Hàng 7 ô pixel ngày */}
              <View className="flex-1 flex-row justify-between gap-x-1.5">
                {week.days.map((day, dIdx) => (
                  <View
                    key={dIdx}
                    className={`flex-1 aspect-square justify-center items-center rounded-md border 
                ${
                  day.isCurrentYear
                    ? "bg-white/10 border-white/10"
                    : "bg-white/[0.02] border-dashed border-white/5"
                }`}
                  >
                    <Text
                      className={`text-[10px] font-medium ${
                        day.isCurrentYear ? "text-white/60" : "text-white/20"
                      }`}
                    >
                      {day.dayOfMonth}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default PixelGridManager;
