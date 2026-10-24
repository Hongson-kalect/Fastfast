import { WeekItem } from "@/interfaces/pixel";
import { usePixelStore } from "@/stores/pixelStore";
import { getLocalTodayStr } from "@/util/timer";
import { View } from "react-native";
import WeekRow from "./WeekPixel";

const EXPORT_WIDTH = 600;

type Props = {
  gridData: WeekItem[];
};
const YearExportView = ({ gridData }: Props) => {
  const todayStr = getLocalTodayStr();
  const { viewMode, yearPixelData } = usePixelStore();

  return (
    <View style={{ width: EXPORT_WIDTH, backgroundColor: "#fff" }}>
      <View style={{ flexDirection: "row" }}>
        <View style={{ width: EXPORT_WIDTH / 2 }}>
          {gridData.slice(0, 26).map((week) => (
            <WeekRow
              key={week.weekIndex}
              week={week}
              todayStr={todayStr}
              viewMode={viewMode}
              yearPixelData={yearPixelData}
              onSelectDate={() => {}}
            />
          ))}
        </View>

        <View style={{ width: EXPORT_WIDTH / 2 }}>
          {gridData.slice(26, 52).map((week) => (
            <WeekRow
              key={week.weekIndex}
              week={week}
              todayStr={todayStr}
              viewMode={viewMode}
              yearPixelData={yearPixelData}
              onSelectDate={() => {}}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

export default YearExportView;
