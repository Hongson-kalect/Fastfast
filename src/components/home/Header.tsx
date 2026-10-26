import { useBottomSheet } from "@/providers/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import { Pressable, View } from "react-native";
import CircularProgress from "../CircleProgress";
import { ThemedText } from "../themed-text";
import HabitBottomSheet from "./HabitBottomSheet";

const HomeHeader = () => {
  const {  habit } = useAppStore();
  const { present } = useBottomSheet();

  const openHabitModal = () => {
      return present(<HabitBottomSheet />, {
        isRaw: true,
        snapPoints: ["100%"],
      });
  };

  return (
    <View className="flex-row justify-between items-center">
      <View>
        <ThemedText size="xxxl" weight="semibold">
          {/* Hi, Kalect */}
          FastFast
        </ThemedText>
      </View>
      <Pressable className="z-10" hitSlop={10} onPress={openHabitModal}>
        <CircularProgress value={habit?.habit_snap || 0} />
      </Pressable>
    </View>
  );
};

export default HomeHeader;
