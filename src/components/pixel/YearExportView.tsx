import { WeekItem } from "@/interfaces/pixel";
import { useAppStore } from "@/stores/appStore";
import { usePixelStore } from "@/stores/pixelStore";
import { fixed } from "@/utils/numberLimit";
import { getLocalTodayStr } from "@/utils/timer";
import { View } from "react-native";
import AchievementShowcase from "../AchievementShowcase";
import { ThemedText } from "../themed-text";
import MonthPixel, { MONTH_LABELS, MonthDayItem } from "./MonthPixel";
import PixelLegend from "./PixelLegend";
import WeekPixel from "./WeekPixel";
import { useShallow } from "zustand/react/shallow";

// Khớp gap-1 và w-15/h-12 trong WeekPixel/MonthPixel
const GAP = 4;
const LABEL_SIZE = 60;
const HEADER_SIZE = 48;
const PADDING = 24;

// Kích thước ô theo từng layout, đủ lớn để emoji không tràn ô
const CELL = {
  weekVertical: 30,
  weekHorizontal: 26,
  monthVertical: 40,
  monthHorizontal: 36,
};

type Props = {
  gridData: WeekItem[];
  monthGrid: MonthDayItem[];
  viewType: "week" | "month";
  orientation: "vertical" | "horizontal";
  weekdays: string[];
};

/** Ảnh xuất cả năm, vẽ đúng layout đang chọn trên màn Journey. */
const YearExportView = ({
  gridData,
  monthGrid,
  viewType,
  orientation,
  weekdays,
}: Props) => {
  const todayStr = getLocalTodayStr();
  const { theme, settings } = useAppStore(
    useShallow((state) => ({ theme: state.theme, settings: state.settings })),
  );
  const showcase =
    settings?.showcase_in_export === false
      ? []
      : (settings?.showcase_achievements ?? []);
  const { viewMode, yearPixelData, year, stats } = usePixelStore(
    useShallow((state) => ({
      viewMode: state.viewMode,
      yearPixelData: state.yearPixelData,
      year: state.year,
      stats: state.stats,
    })),
  );

  const isMonth = viewType === "month";
  const isHorizontal = orientation === "horizontal";

  const common = {
    todayStr,
    viewMode,
    yearPixelData,
    orientation,
    onSelectDate: () => {},
  };

  const renderItem = (item: WeekItem | MonthDayItem, size: number) =>
    "day" in item ? (
      <MonthPixel key={`d${item.day}`} size={size} item={item} year={year} {...common} />
    ) : (
      <WeekPixel key={`w${item.weekIndex}`} size={size} week={item} {...common} />
    );

  let grid: React.ReactNode;
  let gridWidth: number;

  if (isHorizontal) {
    // Cột nhãn cố định bên trái, các tuần/ngày trải ngang
    const size = isMonth ? CELL.monthHorizontal : CELL.weekHorizontal;
    const items = isMonth ? monthGrid : gridData;
    const axisLabels = isMonth ? MONTH_LABELS : weekdays;
    gridWidth = LABEL_SIZE + items.length * (size + GAP);

    grid = (
      <View style={{ flexDirection: "row" }}>
        <View style={{ width: LABEL_SIZE, paddingTop: HEADER_SIZE, gap: GAP }}>
          {axisLabels.map((label) => (
            <View
              key={label}
              style={{ height: size }}
              className="items-center justify-center"
            >
              <ThemedText size="xxs" color="text" opacity="medium">
                {label}
              </ThemedText>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: GAP }}>
          {items.map((item) => renderItem(item, size))}
        </View>
      </View>
    );
  } else if (isMonth) {
    // 31 hàng ngày × 12 cột tháng
    const size = CELL.monthVertical;
    gridWidth = LABEL_SIZE + 12 * size + 11 * GAP;

    grid = (
      <View style={{ gap: GAP }}>
        <View style={{ flexDirection: "row", paddingLeft: LABEL_SIZE, gap: GAP }}>
          {MONTH_LABELS.map((label) => (
            <View key={label} style={{ width: size }} className="items-center">
              <ThemedText size="xxs" color="text" opacity="medium">
                {label}
              </ThemedText>
            </View>
          ))}
        </View>
        {monthGrid.map((item) => renderItem(item, size))}
      </View>
    );
  } else {
    // Tuần dọc: chia đôi thành 2 cột để ảnh không quá dài.
    // Chia theo số tuần thực tế để năm có 53 tuần không bị mất tuần cuối.
    const size = CELL.weekVertical;
    const columnWidth = LABEL_SIZE + 7 * size + 6 * GAP;
    gridWidth = columnWidth * 2 + PADDING;

    const half = Math.ceil(gridData.length / 2);
    const columns = [gridData.slice(0, half), gridData.slice(half)];

    grid = (
      <View style={{ flexDirection: "row", gap: PADDING }}>
        {columns.map((weeks, columnIndex) => (
          <View key={columnIndex} style={{ width: columnWidth, gap: GAP }}>
            <View style={{ flexDirection: "row", paddingLeft: LABEL_SIZE, gap: GAP }}>
              {weekdays.map((label) => (
                <View key={label} style={{ width: size }} className="items-center">
                  <ThemedText size="tiny" color="text" opacity="medium">
                    {label}
                  </ThemedText>
                </View>
              ))}
            </View>
            {weeks.map((week) => renderItem(week, size))}
          </View>
        ))}
      </View>
    );
  }

  return (
    <View
      style={{
        width: gridWidth + PADDING * 2,
        padding: PADDING,
        gap: 20,
        backgroundColor: theme.background,
      }}
    >
      {/* Tiêu đề */}
      <View className="flex-row items-end justify-between">
        <View>
          <ThemedText size="xxl" weight="bold" color="title">
            Journey {year}
          </ThemedText>
          <ThemedText size="xs" color="text" opacity="medium">
            {viewMode === "mood" ? "Emotion" : "Fast process"}
          </ThemedText>
        </View>
        <ThemedText size="xs" color="text" opacity="medium">
          {stats.fastDays} days · {fixed(stats.fastHour)} hours ·{" "}
          {stats.logDays} logs
        </ThemedText>
      </View>

      {grid}

      {/* Chú thích + huy hiệu khoe + chữ ký */}
      <View style={{ maxWidth: 560, width: "100%", alignSelf: "center" }}>
        <PixelLegend viewMode={viewMode} />
      </View>
      {showcase.length > 0 && <AchievementShowcase itemIds={showcase} size={64} />}
      <ThemedText
        size="xxs"
        color="text"
        opacity="low"
        style={{ textAlign: "center" }}
      >
        FastFast
      </ThemedText>
    </View>
  );
};

export default YearExportView;
