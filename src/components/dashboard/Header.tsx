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

  console.log("hasUnclamMilestones", props.hasUnclamMilestones);

  return (
    <View className="flex-row justify-between items-center">
      <View>
        <ThemedText size="xxxl" weight="semibold">
          Dashboard
        </ThemedText>
      </View>

      <Pressable onPress={openAchievement} hitSlop={10}>
        {props.hasUnclamMilestones && (
          <View className="absolute top-0 -right-2 h-2 w-2 rounded-full bg-warning"></View>
        )}
        <Ionicons name="trophy-outline" size={26} color={theme.warning} />
      </Pressable>
    </View>
  );
};

export default DashboardHeader;
