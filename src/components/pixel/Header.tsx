import { ViewMode } from "@/interfaces/pixel";
import { useAppStore } from "@/stores/appStore";
import { Feather } from "@expo/vector-icons";
import { TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";
import PixelStatistic from "./Statistic";

type Props = {
  stats: { fastDays: number; fastHour: number; logDays: number };
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
};
const PixelHeader = ({ stats, viewMode, setViewMode }: Props) => {
  const { theme } = useAppStore();
  return (
    <>
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center gap-2">
          <ThemedText size="xxxl" weight="semibold">
            Journey
          </ThemedText>

          {/* <Feather name="chevron-down" size={36} color="white" /> */}
        </View>
        <View className="p-1 flex-row items-center gap-2">
          <Feather name="chevron-left" size={20} color={theme.text} />
          <TouchableOpacity
            activeOpacity={0.7}
            className="h-10 w-12 justify-center items-center relative"
          >
            {/* Số target hiển thị (thêm z-10 để luôn nổi lên trên dấu chấm mờ nếu cần) */}
            <ThemedText weight="medium">2026</ThemedText>
          </TouchableOpacity>
          <Feather name="chevron-right" size={20} color={theme.text} />
        </View>
      </View>

      <View className="mt-4 mb-6">
        <PixelStatistic
          stats={stats}
          trackingType={viewMode}
          setTrackingType={setViewMode}
        />
      </View>
    </>
  );
};

export default PixelHeader;
