import { Ionicons } from "@expo/vector-icons";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import React, { useEffect, useMemo, useState } from "react";
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
  achievement: any;
  userAchievement: any;
  userMilestone?: UserAchievementMilestone[]; // Danh sách milestone chưa confirm (is_confirmed === 0)
  onPress?: () => void;
  onClaim?: (milestoneId: string) => void; // Callback xử lý claim trực tiếp
}

export const AchievementCard: React.FC<Props> = ({
  achievement,
  userAchievement,
  userMilestone = [],
  onPress,
  onClaim,
}) => {
  const { theme } = useAppStore();

  if (!achievement?.items.length) return null;

  const currentValue = userAchievement?.current_value ?? 0;

  const numericItems = achievement.items.filter(
    (item: any) => typeof item.target === "number",
  );

  // Đếm số item đã ĐẠT MỤC TIÊU (kể cả đã claim hay chưa)
  const completedCount = achievement.items.filter((item: any) => {
    if (typeof item.target === "boolean") {
      return item.target === true && currentValue >= 1;
    }
    return currentValue >= item.target;
  }).length;

  const totalCount = achievement.items.length;
  const isCompleted = totalCount > 0 && completedCount === totalCount;
  const unconfirmedMilestones = userMilestone.filter(
    (item: any) => item.is_confirmed === 0,
  );

  // 🌟 KIỂM TRA TRẠNG THÁI CẦN XÁC NHẬN (UNCLAIMED)
  const hasUnclaimed = unconfirmedMilestones.length > 0;
  // Lấy milestone đầu tiên chưa claim để làm target cho nút bấm nhận nhanh
  const unclaimedItem = unconfirmedMilestones[0];

  const nextItem = numericItems.find((item: any) => currentValue < item.target);
  const dbService = useDBService();
  const { userProfile } = useAppStore();

  const handleCardPress = async () => {
    if (onClaim && unclaimedItem && userProfile) {
      // Ưu tiên trigger claim nếu user bấm vào card đang có thưởng chờ
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
    <View className="mb-2 overflow-hidden rounded-xl border border-text-base/20 bg-background2">
      <Pressable
        className="flex-row items-center justify-between p-3.5 active:opacity-80"
        onPress={handleCardPress}
      >
        {/* Left Section */}
        <View className="flex-1 flex-row items-center gap-3 pr-2">
          {/* Icon Trophy / Gift */}
          <View
            className={`h-10 w-10 items-center justify-center rounded-xl border ${
              hasUnclaimed
                ? "border-amber-500/30 bg-amber-500/10"
                : "border-text-base/5 bg-background2/80"
            }`}
          >
            <Ionicons
              name={
                hasUnclaimed
                  ? "gift"
                  : isCompleted
                    ? "trophy"
                    : "trophy-outline"
              }
              size={18}
              color={
                hasUnclaimed
                  ? "#F59E0B"
                  : isCompleted
                    ? theme.primary
                    : theme.text
              }
              style={{
                opacity: isCompleted || hasUnclaimed ? 1 : 0.55,
              }}
            />

            {/* Dấu chấm đỏ báo hiệu có quà chưa nhận */}
            {hasUnclaimed && (
              <View className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-red-500 border border-background2" />
            )}
          </View>

          {/* Info */}
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5">
              <ThemedText
                size="sm"
                weight="bold"
                color={
                  hasUnclaimed ? "warning" : isCompleted ? "primary" : "title"
                }
                numberOfLines={1}
              >
                {achievement.name}
              </ThemedText>

              {isCompleted && !hasUnclaimed && (
                <Ionicons
                  name="checkmark-circle"
                  size={12}
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
              style={{ marginTop: 2 }}
            >
              {hasUnclaimed
                ? "Bạn có phần thưởng chưa xác nhận!"
                : achievement.description}
            </ThemedText>
          </View>
        </View>

        {/* Right Section */}
        <View className="items-end gap-1">
          {/* 🌟 NẾU CÓ THƯỞNG CHƯA NHẬN -> HIỂN THỊ NÚT NHẬN */}
          {hasUnclaimed ? (
            <View className="flex-row items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1">
              <Ionicons name="sparkles" size={10} color="#FFFFFF" />
              <ThemedText size="xxs" weight="bold" style={{ color: "#FFFFFF" }}>
                Nhận
              </ThemedText>
            </View>
          ) : achievement.type === "boolean" ? (
            <ThemedText
              size="xxs"
              weight="bold"
              color={isCompleted ? "success" : "text"}
              opacity={isCompleted ? undefined : "medium"}
            >
              {isCompleted ? "Đã đạt" : "Chưa đạt"}
            </ThemedText>
          ) : (
            <>
              <ThemedText
                size="xs"
                weight="bold"
                color={isCompleted ? "success" : "title"}
              >
                {formatAchievementValue(currentValue)}
                {nextItem
                  ? ` / ${formatAchievementValue(nextItem.target as number)}`
                  : ""}
              </ThemedText>

              <ThemedText size="xxs" weight="medium" color="text" opacity="low">
                {completedCount}/{totalCount}
              </ThemedText>
            </>
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

export const AchievementBottomSheet: React.FC<AchievementBottomSheetProps> = ({
  onSelect,
}) => {
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>(
    [],
  );
  const [userMilestones, setUserMilestones] = useState<
    UserAchievementMilestone[]
  >([]);

  const { userProfile } = useAppStore();

  const dbService = useDBService();

  if (!userProfile) return null;
  const getAchievements = async () => {
    const { currentMilestones, userAchievements } = await getUserAchievements(
      dbService,
      userProfile.id,
    );

    setUserAchievements(userAchievements ?? []);
    setUserMilestones(currentMilestones ?? []);
  };

  const handleClaimMilestone = (milestoneItemId: string) => {
    console.log("claim milestone", milestoneItemId);
    const confirmMileStone = userMilestones.find(
      (milestone) =>
        milestone.id === milestoneItemId && !milestone.is_confirmed,
    );
    if (!confirmMileStone) return;
    confirmMileStone.is_confirmed = 1;
    setUserMilestones(
      userMilestones.map((milestone) => {
        if (milestone.id !== milestoneItemId) return milestone;
        return confirmMileStone;
      }),
    );
  };

  useEffect(() => {
    getAchievements();
  }, []);

  const userAchievementMap = useMemo(() => {
    const map = new Map<string, UserAchievement>();

    for (const item of userAchievements) {
      map.set(item.achievement_id, item);
    }

    return map;
  }, [userAchievements]);

  return (
    <BottomSheetFlatList
      data={ACHIEVEMENTS}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View className="px-3">
          <AchievementCard
            achievement={item}
            userAchievement={userAchievementMap.get(item.id)}
            userMilestone={userMilestones.filter(
              (milestone) => milestone.achievement_item_id === item.id,
            )}
            onPress={() => onSelect?.(item, userAchievementMap.get(item.id))}
            onClaim={() => handleClaimMilestone(item.id)}
          />
        </View>
      )}
      contentContainerStyle={{
        gap: 2,
        paddingBottom: 40,
      }}
      ListHeaderComponent={
        <AchievementBottomSheetHeader
          total={
            ACHIEVEMENTS.filter((achievement) => achievement?.items?.length)
              .length
          }
          unlocked={
            ACHIEVEMENTS.filter((achievement) => {
              const user = userAchievementMap.get(achievement.id);
              if (!user) return false;

              return achievement.items.every((item) => {
                if (typeof item.target === "boolean") {
                  return item.target === true && user.current_value >= 1;
                }

                return user.current_value >= item.target;
              });
            }).length
          }
        />
      }
      ListEmptyComponent={
        <View className="items-center justify-center px-3">
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

  return (
    <View className="px-3 pb-3">
      <View className="rounded-2xl border border-background2 bg-background2 px-4 py-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <ThemedText color="success" size="xxl" weight="bold">
              Achievements
            </ThemedText>

            <ThemedText
              color="text"
              opacity="medium"
              size="sm"
              className="mt-0.5"
            >
              {unlocked}/{total} unlocked
            </ThemedText>
          </View>

          <View className="ml-3 h-14 w-14 items-center justify-center rounded-full bg-primary/15">
            <ThemedText color="primary" weight="bold" size="xl">
              {Math.round(progress * 100)}
            </ThemedText>
            <View className="absolute bottom-1 right-1/2 translate-x-1/2">
              <ThemedText color="primary" className="" size="xxs">
                %
              </ThemedText>
            </View>
          </View>
        </View>

        <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-background">
          <View
            className="h-full rounded-full bg-primary"
            style={{
              width: `${progress * 100}%`,
            }}
          />
        </View>
      </View>
    </View>
  );
};
