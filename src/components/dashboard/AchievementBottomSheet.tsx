import { Ionicons } from "@expo/vector-icons";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import React, { useCallback, useMemo } from "react";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Achievement } from "@/constants/achievements";
import { useDBService } from "@/hooks/useDBService";
import {
  UserAchievement,
  UserAchievementMilestone,
} from "@/interfaces/db.type";
import { useAppStore } from "@/stores/appStore";
import { claimAchievementMilestone } from "@/stores/dashboardAction";
import { useDashboardStore } from "@/stores/dashboardStore";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";

export type AchievementItem = {
  id: string;
  target: number | boolean;
  title: string;
  image?: string;
};

export type AchievementType = "progress" | "max" | "boolean";

export type AchievementInput =
  | "duration"
  | "shield"
  | "habit"
  | "maxHabit"
  | "streakGain"
  | "maxStreak"
  | "retain"
  | "retainCircle";

type AchievementBottomSheetProps = {
  onSelect?: (
    achievement: Achievement,
    userAchievement: UserAchievement | undefined,
  ) => void;
};
// Giả định props truyền vào đã được join hoặc map thêm trạng thái từ DB
interface Props {
  achievement: Achievement;
  userAchievement?: UserAchievement;
  userMilestone?: UserAchievementMilestone[]; // Danh sách milestone chưa confirm (is_confirmed === 0)
  onPress?: () => void;
  onClaim?: (milestoneId: string) => void; // Callback xử lý claim trực tiếp
}

export const AchievementCard = ({
  achievement,
  userAchievement,
  userMilestone = [],
  onPress,
  onClaim,
}: Props) => {
  if (!achievement?.items.length) return null;

  const currentValue = userAchievement?.current_value ?? 0;

  const numericItems = achievement.items.filter(
    (item) => typeof item.target === "number",
  );

  const completedCount = achievement.items.filter((item: any) => {
    if (typeof item.target === "boolean") {
      return item.target === true && currentValue >= 1;
    }

    return currentValue >= item.target;
  }).length;

  const totalCount = achievement.items.length;
  const isCompleted = completedCount === totalCount;

  const unconfirmedMilestones = userMilestone
    .filter((item: any) => item.is_confirmed === 0)
    .sort((a: UserAchievementMilestone, b: UserAchievementMilestone) =>
      a.id.localeCompare(b.id),
    );

  const unclaimedItem = unconfirmedMilestones[0];

  console.log(
    "unclaimedItem",
    unclaimedItem,
    unconfirmedMilestones,
    userMilestone,
  );

  const unclaimedMilestone = achievement.items.find(
    (item) => item.id === unclaimedItem?.achievement_item_id,
  );

  const hasUnclaimed = !!unclaimedItem;

  const nextItem = numericItems.find((item: any) => currentValue < item.target);

  const { theme } = useAppStore();
  const dbService = useDBService();

  // --------------------------------------------------
  // Progress animation
  // --------------------------------------------------

  const progress = useSharedValue(0);

  const progressTarget = hasUnclaimed
    ? 100
    : Math.min(
        nextItem ? (currentValue / Number(nextItem.target)) * 100 : 100,
        100,
      );

  React.useEffect(() => {
    progress.value = withTiming(progressTarget, {
      duration: 450,
      easing: Easing.out(Easing.cubic),
    });
  }, [progressTarget]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  // --------------------------------------------------
  // Claim animation
  // --------------------------------------------------

  const cardProgress = useSharedValue(1);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardProgress.value,
    transform: [
      {
        translateY: (1 - cardProgress.value) * 12,
      },
    ],
  }));

  const handleClaim = () => {
    if (!unclaimedItem) return;

    // 1. Chạy Animation mờ/thu nhỏ dần (Out)
    cardProgress.value = withTiming(
      0,
      {
        duration: 180,
        easing: Easing.in(Easing.cubic),
      },
      (finished) => {
        if (finished) {
          // 👈 BẮT BUỘC dùng runOnJS để gọi hàm JS/Update State/Store
          runOnJS(processClaim)();
        }
      },
    );
  };

  // 2. Hàm xử lý logic Claim trên JS Thread sau khi animation out hoàn tất
  const processClaim = () => {
    if (!unclaimedItem) return;

    // Gọi callback cập nhật DB / Store
    onClaim?.(unclaimedItem.id);

    // Animate hiện lại Card (In)
    cardProgress.value = withTiming(1, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
    });
  };

  return (
    <Animated.View
      style={cardAnimatedStyle}
      className="overflow-hidden rounded-2xl border border-text-base/5 bg-background2"
    >
      <Pressable onPress={onPress} className="active:opacity-80">
        <View className="px-4 py-3.5">
          {/* Main row */}
          <View className="flex-row items-center">
            {/* Icon */}
            <View
              className="relative mr-3.5 h-11 w-11 items-center justify-center rounded-xl"
              style={{
                backgroundColor: hasUnclaimed
                  ? theme.success + "15"
                  : isCompleted
                    ? theme.primary + "12"
                    : theme.text + "0D",
              }}
            >
              <Ionicons
                name={
                  hasUnclaimed
                    ? "gift"
                    : isCompleted
                      ? "trophy"
                      : "trophy-outline"
                }
                size={19}
                color={
                  hasUnclaimed
                    ? theme.success
                    : isCompleted
                      ? theme.primary
                      : theme.text
                }
                style={{
                  opacity: isCompleted || hasUnclaimed ? 1 : 0.45,
                }}
              />

              {hasUnclaimed && (
                <View
                  className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2"
                  style={{
                    backgroundColor: theme.success,
                    borderColor: theme.background2,
                  }}
                />
              )}
            </View>

            {/* Info */}
            <View className="min-w-0 flex-1">
              <View className="flex-row items-center gap-1.5">
                <ThemedText
                  size="sm"
                  weight="semibold"
                  color={
                    hasUnclaimed ? "success" : isCompleted ? "primary" : "title"
                  }
                  numberOfLines={1}
                  className="flex-1"
                >
                  {achievement.name}
                </ThemedText>

                {isCompleted && !hasUnclaimed && (
                  <Ionicons
                    name="checkmark-circle"
                    size={13}
                    color={theme.success}
                  />
                )}
              </View>

              <ThemedText
                size="xxs"
                weight="medium"
                color="text"
                opacity="medium"
                numberOfLines={1}
                className="mt-1"
              >
                {hasUnclaimed
                  ? (unclaimedMilestone?.title ?? achievement.description)
                  : (nextItem?.title ?? achievement.description)}
              </ThemedText>
            </View>

            {/* Right */}
            <View className="ml-3 items-end">
              {hasUnclaimed ? (
                <Pressable
                  onPress={handleClaim}
                  className="flex-row items-center gap-1.5 rounded-full px-3 py-2"
                  style={{
                    backgroundColor: theme.success,
                  }}
                >
                  <Ionicons name="gift" size={11} color="white" />

                  <ThemedText size="xs" weight="bold" colorHex="white">
                    Nhận
                  </ThemedText>
                </Pressable>
              ) : achievement.type === "boolean" ? (
                <ThemedText
                  size="xxs"
                  weight="semibold"
                  color={isCompleted ? "success" : "text"}
                  opacity={isCompleted ? "full" : "medium"}
                >
                  {isCompleted ? "Đã đạt" : "Chưa đạt"}
                </ThemedText>
              ) : (
                <View className="items-end">
                  <View className="flex-row items-center gap-0.5">
                    <ThemedText
                      size="sm"
                      weight="bold"
                      color={isCompleted ? "success" : "title"}
                    >
                      {formatAchievementValue(
                        achievement.input === "duration"
                          ? currentValue / 3600
                          : currentValue,
                      )}
                    </ThemedText>

                    <ThemedText
                      size="sm"
                      weight="bold"
                      color={isCompleted ? "success" : "title"}
                    >
                      {nextItem
                        ? `/ ${formatAchievementValue(
                            achievement.input === "duration"
                              ? (nextItem.target as number) / 3600
                              : (nextItem.target as number),
                          )}`
                        : ""}
                    </ThemedText>
                  </View>

                  <ThemedText
                    size="xxs"
                    weight="medium"
                    color="text"
                    opacity="low"
                    className="mt-0.5"
                  >
                    {completedCount}/{totalCount}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>

          {/* Milestone progress */}
          {achievement.type !== "boolean" && (
            <View className="mt-3">
              <View className="h-1.5 overflow-hidden rounded-full bg-text-base/10">
                <Animated.View
                  className="h-full rounded-full"
                  style={[
                    progressStyle,
                    {
                      backgroundColor: hasUnclaimed
                        ? theme.success
                        : isCompleted
                          ? theme.success
                          : theme.primary,
                    },
                  ]}
                />
              </View>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

const formatAchievementValue = (value: number) => {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(1);
};

export const AchievementBottomSheet = ({
  onSelect,
}: AchievementBottomSheetProps) => {
  const dbService = useDBService();
  const userId = useAppStore((state) => state.userProfile)?.id;
  const userAchievements = useDashboardStore((state) => state.userAchievements);

  const currentMilestones = useDashboardStore(
    (state) => state.currentMilestones,
  );

  const achievements = useDashboardStore((state) => state.achievements);
  console.log("currentMilestones On Sheet", currentMilestones);
  const achievementList = useMemo(() => {
    return achievements.filter((item) => {
      return item.items.length;
    });
  }, [achievements]);

  const { userProfile } = useAppStore();

  const handleClaimMilestone = useCallback(
    async (milestoneId: string) => {
      console.log("Vào nhận hàng nè");
      if (!userId || !currentMilestones?.length) return;
      await claimAchievementMilestone(
        dbService,
        userId,
        milestoneId,
        currentMilestones,
      );
    },
    [dbService, userProfile, currentMilestones],
  );

  const userAchievementMap = useMemo(() => {
    const map = new Map<string, UserAchievement>();

    for (const item of userAchievements) {
      map.set(item.achievement_id, item);
    }

    return map;
  }, [userAchievements]);

  const userMilestoneMap = useMemo(() => {
    const map = new Map<string, UserAchievementMilestone[]>();

    if (!currentMilestones) return map;

    for (const milestone of currentMilestones) {
      const list = map.get(milestone.achievement_id) ?? [];
      list.push(milestone);
      map.set(milestone.achievement_id, list);
    }

    return map;
  }, [currentMilestones]);

  const total = achievementList.length;

  const unlocked = achievementList.filter((achievement) => {
    const userAchievement = userAchievementMap.get(achievement.id);

    if (!userAchievement) return false;

    return achievement.items.every((item) => {
      if (typeof item.target === "boolean") {
        return item.target && userAchievement.current_value >= 1;
      }

      return userAchievement.current_value >= item.target;
    });
  }).length;

  return (
    <BottomSheetFlatList
      data={achievementList}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const userAchievement = userAchievementMap.get(item.id);
        const milestones = userMilestoneMap.get(item.id) ?? [];

        return (
          <View className="px-3">
            <AchievementCard
              achievement={item}
              userAchievement={userAchievement}
              userMilestone={milestones}
              onPress={() => onSelect?.(item, userAchievement)}
              onClaim={handleClaimMilestone}
            />
          </View>
        );
      }}
      contentContainerStyle={{
        gap: 8,
        paddingBottom: 40,
      }}
      ListHeaderComponent={
        <AchievementBottomSheetHeader total={total} unlocked={unlocked} />
      }
      ListEmptyComponent={
        <View className="items-center justify-center px-3 py-10">
          <ThemedText
            color="text"
            opacity="medium"
            style={{ textAlign: "center" }}
          >
            Không có thành tựu
          </ThemedText>
        </View>
      }
    />
  );
};

type AchievementBottomSheetHeaderProps = {
  total: number;
  unlocked: number;
};

export const AchievementBottomSheetHeader = ({
  total,
  unlocked,
}: AchievementBottomSheetHeaderProps) => {
  const progress = total > 0 ? unlocked / total : 0;
  const percentage = Math.round(progress * 100);

  return (
    <View className="px-3 pb-4">
      <View className="flex-row items-end justify-between px-1">
        <View className="flex-1">
          <ThemedText color="title" size="xxl" weight="bold">
            Achievements
          </ThemedText>

          <ThemedText
            color="text"
            opacity="medium"
            size="xs"
            className="mt-0.5"
          >
            {unlocked} / {total} unlocked
          </ThemedText>
        </View>

        <View className="flex-row items-baseline">
          <ThemedText color="primary" size="xxl" weight="bold">
            {percentage}
          </ThemedText>

          <ThemedText
            color="primary"
            size="xs"
            weight="bold"
            className="ml-0.5"
          >
            %
          </ThemedText>
        </View>
      </View>

      <View className="mt-3 h-2 overflow-hidden rounded-full bg-text-base/10">
        <View
          className="h-full rounded-full bg-primary"
          style={{
            width: `${Math.min(percentage, 100)}%`,
          }}
        />
      </View>
    </View>
  );
};
