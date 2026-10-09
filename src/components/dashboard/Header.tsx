import { useDBService } from "@/hooks/useDBService";
import { useBottomSheet } from "@/provider/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import { useDashboardStore } from "@/stores/dashboardStore";
import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { Pressable, View } from "react-native";
import { ThemedText } from "../themed-text";
import { AchievementBottomSheet } from "./AchievementBottomSheet";

const DashboardHeader = () => {
  const { theme } = useAppStore();
  const userId = useAppStore((state) => state.userProfile)?.id;
  const { userAchievements, currentMilestones, hasUnclaimedMilestones } =
    useDashboardStore();
  const dbService = useDBService();

  const { present } = useBottomSheet();
  const openAchievement = () => {
    if (!userId) return;

    console.log("userAchievements on call", userAchievements);

    present(<AchievementBottomSheet />, {
      snapPoints: ["100%"],
      isRaw: true,
    });
  };

  useEffect(() => {
    console.log("currentMilestones", currentMilestones);
  }, [currentMilestones]);

  return (
    <View className="flex-row items-center justify-between">
      <View>
        <ThemedText size="xxxl" weight="bold">
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

        {hasUnclaimedMilestones && (
          <View className="absolute right-2 top-2 h-2 w-2 rounded-full bg-warning" />
        )}
      </Pressable>
    </View>
  );
};

export default DashboardHeader;
