import { ViewMode } from "@/interfaces/pixel";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { feedback } from "@/utils/feedback";
import { Feather, FontAwesome6 } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import { ThemedText } from "../themed-text";
import { PixelInfo } from "./PixelInfo";
import PixelStatistic from "./Statistic";

type Props = {
  stats: { fastDays: number; fastHour: number; logDays: number };
  year: number;
  setYear: (year: number) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onSaveImage: () => void;
};
const PixelHeader = ({
  stats,
  viewMode,
  setViewMode,
  year,
  setYear,

  onSaveImage,
}: Props) => {
  const theme = useAppStore((state) => state.theme);
  const addModal = useModalStore((state) => state.addModal);

  const openPixelInfo = () => {
    feedback("tap");
    addModal({
      type: "alert",
      title: "Đọc lịch Journey",
      message: "Những điểm mà dải chú thích icon chưa nói hết.",
      middle: <PixelInfo />,
      okText: "Đã hiểu",
    });
  };

  return (
    <>
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center gap-2">
          <ThemedText size="xxxl" weight="semibold">
            Journey
          </ThemedText>
          <Pressable hitSlop={10} onPress={openPixelInfo}>
            <FontAwesome6
              name="circle-question"
              size={16}
              color={theme.text + "66"}
            />
          </Pressable>

        </View>
        <View className="p-1 flex-row items-center gap-2">
          <Pressable hitSlop={10} onPress={() => setYear(year - 1)}>
            <Feather name="chevron-left" size={20} color={theme.text} />
          </Pressable>

          <ThemedText weight="medium">{year}</ThemedText>

          <Pressable hitSlop={10} onPress={() => setYear(year + 1)}>
            <Feather name="chevron-right" size={20} color={theme.text} />
          </Pressable>
        </View>
      </View>

      <View className="mt-4 mb-6">
        <PixelStatistic
          stats={stats}
          trackingType={viewMode}
          setTrackingType={setViewMode}
          onSaveImage={onSaveImage}
        />
      </View>
    </>
  );
};

export default PixelHeader;
