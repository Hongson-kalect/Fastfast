import { WeekItem } from "@/interfaces/pixel";
import { usePixelStore } from "@/stores/pixelStore";
import { getLocalTodayStr } from "@/utils/timer";
import { View } from "react-native";
import WeekPixel from "./WeekPixel";

const EXPORT_WIDTH = 600;
const COLUMN_WIDTH = EXPORT_WIDTH / 2;
// WeekPixel (vertical): nhãn tuần w-15 (60px) + 7 ô ngày cách nhau gap-1 (4px)
const WEEK_LABEL_WIDTH = 60;
const DAY_GAP = 4;
const DAY_SIZE = (COLUMN_WIDTH - WEEK_LABEL_WIDTH - DAY_GAP * 6) / 7;

type Props = {
  gridData: WeekItem[];
};

const YearExportView = ({ gridData }: Props) => {
  const todayStr = getLocalTodayStr();
  const { viewMode, yearPixelData } = usePixelStore();

  // Chia đôi theo số tuần thực tế để năm có 53 tuần không bị mất tuần cuối
  const half = Math.ceil(gridData.length / 2);
  const columns = [gridData.slice(0, half), gridData.slice(half)];

  return (
    <View style={{ width: EXPORT_WIDTH, backgroundColor: "#fff" }}>
      <View style={{ flexDirection: "row" }}>
        {columns.map((weeks, columnIndex) => (
          <View key={columnIndex} style={{ width: COLUMN_WIDTH, gap: 2 }}>
            {weeks.map((week) => (
              <WeekPixel
                key={week.weekIndex}
                size={DAY_SIZE}
                orientation="vertical"
                week={week}
                todayStr={todayStr}
                viewMode={viewMode}
                yearPixelData={yearPixelData}
                onSelectDate={() => {}}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

export default YearExportView;
