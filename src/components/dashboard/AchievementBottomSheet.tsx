import { Ionicons } from "@expo/vector-icons";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import React, { useEffect, useMemo, useState } from "react";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Achievement, ACHIEVEMENTS } from "@/constants/achievements";
import { useDBService } from "@/hooks/useDBService";
import { UserAchievement } from "@/interfaces/db.type";
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

type AchievementCardProps = {
  achievement: Achievement;
  userAchievement?: UserAchievement;
  onPress?: () => void;
};

const AchievementCard = ({
  achievement,
  userAchievement,
  onPress,
}: AchievementCardProps) => {
  const { theme } = useAppStore();

  if (!achievement?.items.length) return null;

  const currentValue = userAchievement?.current_value ?? 0;

  const numericItems = achievement.items.filter(
    (item) => typeof item.target === "number",
  );

  const completedCount = achievement.items.filter((item) => {
    if (typeof item.target === "boolean") {
      return item.target === true && currentValue >= 1;
    }

    return currentValue >= item.target;
  }).length;

  const totalCount = achievement.items.length;

  const nextItem = numericItems.find((item) => currentValue < item.target);

  const isCompleted = totalCount > 0 && completedCount === totalCount;

  return (
    <View className="mb-2 overflow-hidden rounded-xl border border-text-base/20 bg-background2">
      <View
        className="flex-row items-center justify-between p-3.5"
        onTouchEnd={onPress}
      >
        {/* Left */}
        <View className="flex-1 flex-row items-center gap-3 pr-2">
          {/* Achievement Icon */}
          <View className="h-10 w-10 items-center justify-center rounded-xl border border-text-base/5 bg-background2/80">
            <Ionicons
              name={isCompleted ? "trophy" : "trophy-outline"}
              size={17}
              color={isCompleted ? theme.primary : theme.text}
              style={{
                opacity: isCompleted ? 1 : 0.55,
              }}
            />
          </View>

          {/* Info */}
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5">
              <ThemedText
                size="xs"
                weight="bold"
                color={isCompleted ? "primary" : "title"}
                numberOfLines={1}
              >
                {achievement.name}
              </ThemedText>

              {isCompleted && (
                <Ionicons
                  name="checkmark-circle"
                  size={11}
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
              {achievement.description}
            </ThemedText>
          </View>
        </View>

        {/* Right */}
        <View className="items-end gap-1">
          {achievement.type === "boolean" ? (
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

              <ThemedText
                size="xxs"
                weight="medium"
                color="text"
                opacity="medium"
              >
                {completedCount}/{totalCount}
              </ThemedText>
            </>
          )}
        </View>
      </View>

      {/* Milestones */}
      {!!achievement.items.length && (
        <View className="border-t border-text-base/10 px-3.5 py-2.5">
          <View className="flex-row items-center gap-1.5">
            {achievement.items.map((item) => {
              const unlocked =
                typeof item.target === "boolean"
                  ? item.target === true && currentValue >= 1
                  : currentValue >= item.target;

              return (
                <View
                  key={item.id}
                  className={`h-1.5 flex-1 rounded-full ${
                    unlocked ? "bg-primary" : "bg-text-base/10"
                  }`}
                />
              );
            })}
          </View>
        </View>
      )}
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

  const { userProfile } = useAppStore();

  const dbService = useDBService();

  if (!userProfile) return null;
  const getAchievements = async () => {
    const res = await dbService?.getUserAchievements(userProfile.id);

    setUserAchievements(res ?? []);
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
            onPress={() => onSelect?.(item, userAchievementMap.get(item.id))}
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

          <View className="ml-3 h-11 w-11 items-center justify-center rounded-full bg-primary/15">
            <ThemedText color="primary" weight="bold" size="xl">
              {Math.round(progress * 100)}%
            </ThemedText>
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
