import { useBottomSheet } from "@/provider/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import { ThemedText } from "../themed-text";
import { AchievementBottomSheet } from "./AchievementBottomSheet";

type Props = {
  hasUnclamMilestones: boolean;
};
const DashboardHeader = (props: Props) => {
  const { theme } = useAppStore();

  const { present } = useBottomSheet();
  const openAchievement = () => {
    present(<AchievementBottomSheet />, {
      snapPoints: ["100%"],
      isRaw: true,
    });
  };

  return (
    <View className="flex-row items-center justify-between">
      <View>
        <ThemedText size="xxxl" weight="bold" color="title">
          Dashboard
        </ThemedText>

        <ThemedText size="xs" color="text" opacity="medium" className="mt-0.5">
          Theo dõi tiến trình của bạn
        </ThemedText>
      </View>

      <Pressable
        onPress={openAchievement}
        hitSlop={10}
        className="relative h-14 w-14 items-center justify-center rounded-xl bg-warning/20"
      >
        <Ionicons name="trophy-outline" size={26} color={theme.warning} />

        {props.hasUnclamMilestones && (
          <View className="absolute right-2 top-2 h-2 w-2 rounded-full bg-warning" />
        )}
      </Pressable>
    </View>
  );
};

export default DashboardHeader;
