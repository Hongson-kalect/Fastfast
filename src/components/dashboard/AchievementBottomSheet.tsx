import { Ionicons } from "@expo/vector-icons";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import React, { useCallback, useMemo } from "react";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import AchievementBadge from "@/components/AchievementBadge";
import { Achievement } from "@/constants/achievements";
import { RADIUS } from "@/constants/design";
import { useDBService } from "@/hooks/useDBService";
import {
  UserAchievement,
  UserAchievementMilestone,
} from "@/interfaces/db.type";
import { useAppStore } from "@/stores/appStore";
import { claimAchievementMilestone } from "@/stores/dashboardAction";
import { feedback } from "@/utils/feedback";
import { useDashboardStore } from "@/stores/dashboardStore";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";
import { getContrastTextColor } from "@/utils/color";

export type AchievementItem = {
  id: string;
  target: number | boolean;
  title: string;
  image?: number;
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

  const unclaimedMilestone = achievement.items.find(
    (item) => item.id === unclaimedItem?.achievement_item_id,
  );

  const hasUnclaimed = !!unclaimedItem;

  // Huy hiệu hiển thị: mốc cao nhất đã nhận, chưa nhận mốc nào thì mốc 1 (mờ)
  const confirmedIds = new Set(
    userMilestone
      .filter((item) => item.is_confirmed === 1)
      .map((item) => item.achievement_item_id),
  );
  const badgeItem =
    [...achievement.items].reverse().find((item) => confirmedIds.has(item.id)) ??
    achievement.items[0];
  const isBadgeLocked = !badgeItem || !confirmedIds.has(badgeItem.id);

  const nextItem = numericItems.find((item: any) => currentValue < item.target);

  const theme = useAppStore((state) => state.theme);
  const tier = getTier(completedCount, totalCount);
  const tierColor = tier?.color ?? theme.text;

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
    feedback("reward");

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

  // Đặt sau mọi hook để thứ tự hook không đổi giữa các lần render
  if (!badgeItem) return null;

  return (
    <Animated.View
      className="overflow-hidden border bg-card"
      // Viền theo tầng đã đạt (đồng/bạc/vàng/kim cương), xám khi chưa đạt mốc nào
      style={[
        cardAnimatedStyle,
        {
          borderRadius: RADIUS.lg,
          borderColor: hasUnclaimed
            ? theme.success + "55"
            : tier
              ? tierColor + "40"
              : theme.text + "0F",
        },
      ]}
    >
      <Pressable onPress={onPress} className="active:opacity-80">
        <View className="px-4 py-4">
          {/* Main row */}
          <View className="flex-row items-center">
            {/* Huy hiệu */}
            <View className="relative mr-3.5">
              <AchievementBadge
                achievement={achievement}
                item={badgeItem}
                size={52}
                locked={isBadgeLocked}
              />

              {hasUnclaimed && (
                <View
                  className="absolute -right-0.5 top-0 h-3 w-3 rounded-full border-2"
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

                {tier && !hasUnclaimed && (
                  <View
                    className="px-2 py-0.5"
                    style={{
                      borderRadius: RADIUS.pill,
                      backgroundColor: tierColor + "26",
                    }}
                  >
                    <ThemedText size="tiny" weight="extrabold" colorHex={tierColor}>
                      {tier.label}
                    </ThemedText>
                  </View>
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
                  <Ionicons
                    name="gift"
                    size={11}
                    color={getContrastTextColor(theme.success)}
                  />

                  <ThemedText size="xs" weight="bold" colorHex={getContrastTextColor(theme.success)}>
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
                        : tier
                          ? tierColor
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

// Tầng huy hiệu theo tỉ lệ mốc đã đạt
const TIERS = [
  { min: 0, label: "BRONZE", color: "#D08A4E" },
  { min: 0.34, label: "SILVER", color: "#B8C4D6" },
  { min: 0.67, label: "GOLD", color: "#F5C542" },
  { min: 1, label: "DIAMOND", color: "#7DD3FC" },
];

const getTier = (completed: number, total: number) => {
  if (!completed || !total) return null;
  const ratio = completed / total;
  if (ratio >= 1) return TIERS[3];
  if (ratio >= TIERS[2].min) return TIERS[2];
  if (ratio >= TIERS[1].min) return TIERS[1];
  return TIERS[0];
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
  const achievementList = useMemo(() => {
    return achievements.filter((item) => {
      return item.items.length;
    });
  }, [achievements]);

  const userProfile = useAppStore((state) => state.userProfile);

  const handleClaimMilestone = useCallback(
    async (milestoneId: string) => {
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
