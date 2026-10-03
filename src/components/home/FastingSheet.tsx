import { FastingTargetItem, getFastingStatus } from "@/constants/data";
import { FastSession } from "@/interfaces/db.type";
import { useBottomSheet } from "@/provider/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { fixed } from "@/util/numberLimit";
import { getRelativeTime, timeString } from "@/util/timer";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";

interface FastingSheetProps {
  counter: number;
  fastTarget: FastingTargetItem | null;
  currentFast: FastSession;
  finishDate: Date | null;
  onStopFasting?: () => void;
  onChangeTarget: () => void;
}
const FastingSheet = ({
  counter,
  currentFast,
  fastTarget,
  finishDate,
  onStopFasting,
  onChangeTarget,
}: FastingSheetProps) => {
  const { theme, settings } = useAppStore();
  const { addModal } = useModalStore();
  const { hide } = useBottomSheet();

  const [fastCounter, setFastCounter] = useState(counter);

  const finishTime = finishDate?.getTime();

  const targetSeconds = (fastTarget?.hours ?? settings?.target ?? 0) * 3_600;

  const hasTarget = targetSeconds > 0;

  const progressPercent = hasTarget
    ? Math.min(100, Math.floor((fastCounter / targetSeconds) * 100))
    : 100;

  const getReward = (hours: number) => {
    if (hours < 16) {
      return {
        habitGain: 0,
        shieldBonus: 0,
      };
    }

    return {
      habitGain: fixed(3 + (hours - 16) * 0.2),
      shieldBonus: Math.min(
        2,
        Math.max(0, Math.floor(hours / 24 - 1)),
      ),
    };
  };

  const currentHours = fastCounter / 3_600;

  const currentReward = getReward(currentHours);

  const targetReward = fastTarget
    ? getReward(fastTarget.hours)
    : {
        habitGain: 0,
        shieldBonus: 0,
      };

  const targetFinishTime = finishTime
    ? getRelativeTime(new Date(finishTime))
    : "--:--";

  const isTargetReached =
    hasTarget && fastCounter >= targetSeconds;

  const accentColor = fastTarget?.colors.accent || theme.primary;

  const changeTargetConfirm = () => {
    addModal({
      type: "confirm",
      title: "Change Target",
      message: "Are you sure to change target?",
      onOk: async () => {
        onChangeTarget();
      },
    });
  };

  const finishFasting = () => {
    hide();
    onStopFasting?.();
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setFastCounter((prev) => prev + 1);
    }, 1_000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View className="gap-5 px-5 pb-12">
      {/* Progress */}
      <View className="mt-4 gap-3">
        <View className="flex-row items-end justify-between">
          <View className="flex-1">
            <ThemedText size="xxs" color="text" opacity="medium">
              Tiến độ
            </ThemedText>

            <View className="mt-0.5 flex-row items-baseline gap-1">
              <ThemedText size="xxl" weight="bold">
                {progressPercent}%
              </ThemedText>

              <ThemedText
                size="xs"
                color="text"
                opacity="medium"
              >
                · {timeString(fastCounter)}
                {fastTarget?.hours
                  ? ` / ${fastTarget.hours}h`
                  : ""}
              </ThemedText>
            </View>
          </View>

          <ThemedText
            size="xs"
            weight="semibold"
            colorHex={accentColor}
            style={{ textTransform: "uppercase" }}
          >
            {fastTarget?.label || "FREE MODE"}
          </ThemedText>
        </View>

        <View className="h-3 overflow-hidden rounded-full bg-text-base/10">
          <LinearGradient
            className="h-full"
            style={{
              width: `${progressPercent}%`,
              borderRadius: 100,
            }}
            colors={[
              `${accentColor}50`,
              accentColor,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>

        <View className="flex-row justify-between">
          <ThemedText
            size="xxs"
            color="text"
            opacity="medium"
          >
            Bắt đầu{" "}
            {getRelativeTime(new Date(currentFast.start_time))}
          </ThemedText>

          {hasTarget && finishTime ? (
            isTargetReached ? (
              <ThemedText size="xxs" color="success">
                Đã hoàn thành
              </ThemedText>
            ) : (
              <ThemedText
                size="xxs"
                color="text"
                opacity="medium"
              >
                Hoàn thành:{" "}
                {getRelativeTime(new Date(finishTime))}
              </ThemedText>
            )
          ) : (
            <ThemedText
              size="xxs"
              color="text"
              opacity="medium"
            >
              Free mode
            </ThemedText>
          )}
        </View>
      </View>

      {/* Result */}
      <View className="gap-3">
        <ThemedText
          size="sm"
          weight="bold"
          color="primary"
        >
          Kết quả
        </ThemedText>

        <View className="flex-row gap-3">
          {/* Current */}
          <View
            className="flex-1 gap-2 rounded-2xl border p-3.5"
            style={{
              borderColor: `${theme.success}${Math.floor(
                Math.min(
                  fastCounter / (targetSeconds || 57_600),
                  1,
                ) * 99,
              )
                .toString(16)
                .padStart(2, "0")}`,
              backgroundColor: `${theme.success}${Math.floor(
                Math.min(
                  fastCounter / (targetSeconds || 57_600),
                  1,
                ) * 15,
              )
                .toString(16)
                .padStart(2, "0")}`,
            }}
          >
            <ThemedText
              size="xxs"
              weight="bold"
              color="text"
              opacity="medium"
            >
              HIỆN TẠI
            </ThemedText>

            <ThemedText
              size="sm"
              weight="semibold"
              color={isTargetReached ? "success" : "text"}
            >
              {timeString(fastCounter)}
            </ThemedText>

            <View className="flex-row justify-between">
              <ThemedText
                size="xs"
                color="text"
                opacity="medium"
              >
                Habit
              </ThemedText>

              <ThemedText
                size="xs"
                weight="semibold"
                color={
                  currentReward.habitGain
                    ? "success"
                    : "text"
                }
                opacity={
                  currentReward.habitGain
                    ? "full"
                    : "medium"
                }
              >
                {currentReward.habitGain
                  ? `+${currentReward.habitGain}%`
                  : "—"}
              </ThemedText>
            </View>

            <View className="flex-row justify-between">
              <ThemedText
                size="xs"
                color="text"
                opacity="medium"
              >
                Shield
              </ThemedText>

              <ThemedText
                size="xs"
                weight="semibold"
                color={
                  currentReward.shieldBonus
                    ? "primary"
                    : "text"
                }
                opacity={
                  currentReward.shieldBonus
                    ? "full"
                    : "medium"
                }
              >
                {currentReward.shieldBonus
                  ? `+${currentReward.shieldBonus}`
                  : "—"}
              </ThemedText>
            </View>
          </View>

          {/* Target */}
          <View
            className="flex-1 gap-2 rounded-2xl border p-3.5"
            style={{
              borderColor: accentColor,
              backgroundColor: `${accentColor}20`,
            }}
          >
            <ThemedText
              size="xxs"
              weight="bold"
              colorHex={accentColor}
            >
              HOÀN THÀNH
            </ThemedText>

            <ThemedText
              size="sm"
              weight="semibold"
            >
              {targetFinishTime}
            </ThemedText>

            <View className="flex-row justify-between">
              <ThemedText
                size="xs"
                color="text"
                opacity="medium"
              >
                Habit
              </ThemedText>

              <ThemedText
                size="xs"
                weight="semibold"
                color={
                  targetReward.habitGain
                    ? "success"
                    : "text"
                }
                opacity={
                  targetReward.habitGain
                    ? "full"
                    : "medium"
                }
              >
                {targetReward.habitGain
                  ? `+${targetReward.habitGain}%`
                  : "—"}
              </ThemedText>
            </View>

            <View className="flex-row justify-between">
              <ThemedText
                size="xs"
                color="text"
                opacity="medium"
              >
                Shield
              </ThemedText>

              <ThemedText
                size="xs"
                weight="semibold"
                color={
                  targetReward.shieldBonus
                    ? "primary"
                    : "text"
                }
                opacity={
                  targetReward.shieldBonus
                    ? "full"
                    : "medium"
                }
              >
                {targetReward.shieldBonus
                  ? `+${targetReward.shieldBonus}`
                  : "—"}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>

      {/* Action */}
      <View className="mt-2">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={finishFasting}
          className="items-center rounded-2xl bg-error py-3.5"
        >
          <ThemedText
            size="md"
            weight="bold"
            color="background"
          >
            Kết thúc Fasting
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
};
export default FastingSheet;
