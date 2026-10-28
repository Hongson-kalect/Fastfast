import { useBottomSheet } from "@/providers/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import { useDashboardStore } from "@/stores/dashboardStore";
import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { Pressable, View } from "react-native";
import { ThemedText } from "../themed-text";
import { AchievementBottomSheet } from "./AchievementBottomSheet";
import { useShallow } from "zustand/react/shallow";
import { useT } from "@/providers/Language";

const DashboardHeader = () => {
  const t = useT();
  const theme = useAppStore((state) => state.theme);
  const userId = useAppStore((state) => state.userProfile)?.id;
  const { currentMilestones, hasUnclaimedMilestones } = useDashboardStore(
    useShallow((state) => ({
      currentMilestones: state.currentMilestones,
      hasUnclaimedMilestones: state.hasUnclaimedMilestones,
    })),
  );

  const { present } = useBottomSheet();
  const openAchievement = () => {
    if (!userId) return;

    present(<AchievementBottomSheet />, {
      snapPoints: ["100%"],
      isRaw: true,
    });
  };

  useEffect(() => {
  }, [currentMilestones]);

  return (
    <View className="flex-row items-center justify-between">
      <View>
        <ThemedText size="xxxl" weight="bold">
          {t("stats.dashboard")}
        </ThemedText>

        <ThemedText size="xs" color="text" opacity="medium" className="mt-0.5">
          {t("stats.subtitle")}
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
