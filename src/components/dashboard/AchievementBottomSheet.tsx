import { Ionicons } from "@expo/vector-icons";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import {
  Achievement,
  ACHIEVEMENTS,
  getUserAchievements,
} from "@/constants/achievements";
import { useDBService } from "@/hooks/useDBService";
import {
  UserAchievement,
  UserAchievementMilestone,
} from "@/interfaces/db.type";
import { useAppStore } from "@/stores/appStore";

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

  // Đếm số item đã ĐẠT MỤC TIÊU (kể cả đã claim hay chưa)
  const completedCount = achievement.items.filter((item: any) => {
    if (typeof item.target === "boolean") {
      return item.target === true && currentValue >= 1;
    }
    return currentValue >= item.target;
  }).length;

  const totalCount = achievement.items.length;
  const isCompleted = completedCount === totalCount;
  const unconfirmedMilestones = userMilestone.filter(
    (item: any) => item.is_confirmed === 0,
  );

  const unclaimedItem = userMilestone.find((item) => item.is_confirmed === 0);

  const hasUnclaimed = !!unclaimedItem;

  const nextItem = numericItems.find((item: any) => currentValue < item.target);
  const { theme, userProfile } = useAppStore();
  const dbService = useDBService();

  const handleCardPress = async () => {
    if (onClaim && unclaimedItem && userProfile) {
      await dbService?.confirmAchievementMilestone({
        userId: userProfile?.id,
        achievementId: unclaimedItem.achievement_item_id,
        milestoneItemId: unclaimedItem.id,
      });
      onClaim(unclaimedItem.achievement_item_id);
    } else {
      onPress?.();
    }
  };

  return (
    <View className="overflow-hidden rounded-2xl border border-text-base/5 bg-background2">
      <Pressable onPress={handleCardPress} className="active:opacity-80">
        <View className="px-4 py-3.5">
          {/* Main row */}
          <View className="flex-row items-center">
            {/* Icon */}
            <View
              className="relative mr-3.5 h-11 w-11 items-center justify-center rounded-xl"
              style={{
                backgroundColor: hasUnclaimed
                  ? theme.warning + "15"
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
                    ? theme.warning
                    : isCompleted
                      ? theme.primary
                      : theme.text
                }
                style={{
                  opacity: isCompleted || hasUnclaimed ? 1 : 0.45,
                }}
              />

              {/* Unclaimed indicator */}
              {hasUnclaimed && (
                <View
                  className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2"
                  style={{
                    backgroundColor: theme.warning,
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
                    hasUnclaimed ? "warning" : isCompleted ? "primary" : "title"
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
                  ? "Bạn có phần thưởng chưa nhận!"
                  : achievement.description}
              </ThemedText>
            </View>

            {/* Right */}
            <View className="ml-3 items-end">
              {hasUnclaimed ? (
                <Pressable
                  // onPress={handleClam}
                  // hitSlop={6}
                  className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
                  style={{
                    backgroundColor: theme.warning,
                  }}
                >
                  <Ionicons name="gift" size={11} color={theme.background} />

                  <ThemedText size="xxs" weight="bold" color="background">
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
                  <ThemedText
                    size="sm"
                    weight="bold"
                    color={isCompleted ? "success" : "title"}
                  >
                    {formatAchievementValue(currentValue)}
                    {nextItem
                      ? ` / ${formatAchievementValue(
                          nextItem.target as number,
                        )}`
                      : ""}
                  </ThemedText>

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
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(
                      nextItem
                        ? (currentValue / Number(nextItem.target)) * 100
                        : 100,
                      100,
                    )}%`,
                    backgroundColor: hasUnclaimed
                      ? theme.warning
                      : isCompleted
                        ? theme.success
                        : theme.primary,
                  }}
                />
              </View>
            </View>
          )}
        </View>
      </Pressable>
    </View>
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
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>(
    [],
  );
  const [userMilestones, setUserMilestones] = useState<
    UserAchievementMilestone[]
  >([]);

  const achievementList = useMemo(() => {
    return ACHIEVEMENTS.filter((item) => {
      return item.items.length;
    });
  }, [ACHIEVEMENTS]);

  const { userProfile } = useAppStore();
  const dbService = useDBService();

  const loadAchievements = useCallback(async () => {
    if (!userProfile) return;

    const { currentMilestones, userAchievements } = await getUserAchievements(
      dbService,
      userProfile.id,
    );

    setUserAchievements(userAchievements ?? []);
    setUserMilestones(currentMilestones ?? []);
  }, [dbService, userProfile]);

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  const handleClaimMilestone = useCallback(
    async (milestoneId: string) => {
      if (!userProfile) return;

      const milestone = userMilestones.find((item) => item.id === milestoneId);

      if (!milestone || milestone.is_confirmed) return;

      await dbService?.confirmAchievementMilestone({
        userId: userProfile.id,
        achievementId: milestone.achievement_item_id,
        milestoneItemId: milestone.id,
      });

      setUserMilestones((prev) =>
        prev.map((item) =>
          item.id === milestoneId ? { ...item, is_confirmed: 1 } : item,
        ),
      );
    },
    [dbService, userProfile, userMilestones],
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

    for (const milestone of userMilestones) {
      const list = map.get(milestone.achievement_item_id) ?? [];
      list.push(milestone);
      map.set(milestone.achievement_item_id, list);
    }

    return map;
  }, [userMilestones]);

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
