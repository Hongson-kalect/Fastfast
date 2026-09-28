import { useBottomSheet } from "@/provider/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import { ThemedText } from "../themed-text";
import { AchievementBottomSheet } from "./AchievementBottomSheet";

const DashboardHeader = () => {
  const { theme } = useAppStore();

  const { present } = useBottomSheet();
  const openAchievement = () => {
    present(<AchievementBottomSheet />, {
      snapPoints: ["100%"],
      isRaw: true,
    });
  };

  return (
    <View className="flex-row justify-between items-center">
      <View>
        <ThemedText size="xxxl" weight="semibold">
          Dashboard
        </ThemedText>
      </View>

      <Pressable onPress={openAchievement} hitSlop={10}>
        <View className="absolute top-0 -left-2 h-2 w-2 rounded-full bg-warning"></View>
        <Ionicons name="trophy-outline" size={26} color={theme.warning} />
      </Pressable>
    </View>
  );
};

export default DashboardHeader;
