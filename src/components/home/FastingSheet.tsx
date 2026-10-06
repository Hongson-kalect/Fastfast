import { FastingTargetItem } from "@/constants/data";
import { FastSession } from "@/interfaces/db.type";
import { useBottomSheet } from "@/provider/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { fixed } from "@/util/numberLimit";
import { getRelativeTime, timeString } from "@/util/timer";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";
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
      shieldBonus: Math.min(2, Math.max(0, Math.floor(hours / 24 - 1))),
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

  const isTargetReached = hasTarget && fastCounter >= targetSeconds;

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
    <View className="gap-6 px-5 pb-12">
      {/* ==================== PROGRESS ==================== */}
      <View className="mt-3 gap-3">
        {/* Header */}
        <View className="flex-row items-end justify-between">
          <View className="flex-1">
            <ThemedText size="xxs" color="text" opacity="medium">
              Tiến độ
            </ThemedText>

            <View className="mt-0.5 flex-row items-baseline gap-1.5">
              <ThemedText size="xxl" weight="bold">
                {progressPercent}%
              </ThemedText>

              <ThemedText size="xs" color="text" opacity="medium">
                {timeString(fastCounter)}
                {fastTarget?.hours ? ` / ${fastTarget.hours}h` : ""}
              </ThemedText>
            </View>
          </View>

          <View
            className="rounded-full px-2.5 py-1"
            style={{
              backgroundColor: `${accentColor}15`,
            }}
          >
            <ThemedText
              size="xxs"
              weight="bold"
              colorHex={accentColor}
              style={{ textTransform: "uppercase" }}
            >
              {fastTarget?.label || "FREE MODE"}
            </ThemedText>
          </View>
        </View>

        {/* Progress bar */}
        <View className="h-3 overflow-hidden rounded-full bg-text-base/10">
          <LinearGradient
            className="h-full"
            style={{
              width: `${Math.min(progressPercent, 100)}%`,
              borderRadius: 100,
            }}
            colors={[`${accentColor}50`, accentColor]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>

        {/* Timeline */}
        <View className="flex-row justify-between">
          <ThemedText size="xxs" color="text" opacity="medium">
            Bắt đầu {getRelativeTime(new Date(currentFast.start_time))}
          </ThemedText>

          {hasTarget && finishTime ? (
            isTargetReached ? (
              <ThemedText size="xxs" weight="semibold" color="success">
                Đã hoàn thành
              </ThemedText>
            ) : (
              <ThemedText size="xxs" color="text" opacity="medium">
                Hoàn thành {getRelativeTime(new Date(finishTime))}
              </ThemedText>
            )
          ) : (
            <ThemedText size="xxs" color="text" opacity="medium">
              Free mode
            </ThemedText>
          )}
        </View>
      </View>

      {/* ==================== RESULT ==================== */}
      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <ThemedText size="sm" weight="bold" color="primary">
            Kết quả
          </ThemedText>

          {hasTarget && !isTargetReached && (
            <ThemedText size="xxs" color="text" opacity="low">
              Tiếp tục để đạt mục tiêu
            </ThemedText>
          )}
        </View>

        {/* Comparison */}
        <View className="overflow-hidden rounded-2xl bg-background2">
          {/* Current */}
          <View className="px-4 py-4">
            <View className="flex-row items-center justify-between h-7">
              <View className="flex-row items-center gap-2">
                <View
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: isTargetReached
                      ? theme.success
                      : theme.text,
                    opacity: isTargetReached ? 1 : 0.35,
                  }}
                />

                <ThemedText
                  size="xs"
                  weight="semibold"
                  color="text"
                  opacity="medium"
                >
                  HIỆN TẠI
                </ThemedText>
              </View>

              <ThemedText
                size="md"
                weight="bold"
                color={isTargetReached ? "success" : "title"}
              >
                {timeString(fastCounter)}
              </ThemedText>
            </View>

            <View className="mt-4 flex-row gap-3">
              {/* Habit */}
              <View className="flex-1">
                <ThemedText size="xxs" color="text" opacity="medium">
                  Habit
                </ThemedText>

                <ThemedText
                  size="sm"
                  weight="bold"
                  color={currentReward.habitGain ? "success" : "text"}
                  opacity={currentReward.habitGain ? "full" : "medium"}
                  className="mt-0.5"
                >
                  {currentReward.habitGain
                    ? `+${currentReward.habitGain}%`
                    : "—"}
                </ThemedText>
              </View>

              {/* Shield */}
              <View className="flex-1">
                <ThemedText size="xxs" color="text" opacity="medium">
                  Shield
                </ThemedText>

                <ThemedText
                  size="sm"
                  weight="bold"
                  color={currentReward.shieldBonus ? "primary" : "text"}
                  opacity={currentReward.shieldBonus ? "full" : "medium"}
                  className="mt-0.5"
                >
                  {currentReward.shieldBonus
                    ? `+${currentReward.shieldBonus}`
                    : "—"}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Divider */}
          {hasTarget && <View className="h-px bg-text-base/10" />}

          {/* Target */}
          {hasTarget && (
            <View
              className="px-4 py-4"
              style={{
                backgroundColor: `${accentColor}08`,
              }}
            >
              <View className="flex-row items-center justify-between h-7">
                <View className="flex-row items-center gap-2">
                  <View
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: accentColor,
                    }}
                  />

                  <ThemedText
                    size="xs"
                    weight="semibold"
                    colorHex={accentColor}
                  >
                    MỤC TIÊU
                  </ThemedText>
                </View>

                {hasTarget && !isTargetReached ? (
                  <ThemedText size="md" weight="bold" colorHex={accentColor}>
                    {targetFinishTime}
                  </ThemedText>
                ) : (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={accentColor}
                  />
                )}
              </View>

              <View className="mt-4 flex-row gap-3">
                {/* Habit */}
                <View className="flex-1">
                  <ThemedText size="xxs" color="text" opacity="medium">
                    Habit
                  </ThemedText>

                  <ThemedText
                    size="sm"
                    weight="bold"
                    color={targetReward.habitGain ? "success" : "text"}
                    opacity={targetReward.habitGain ? "full" : "medium"}
                    className="mt-0.5"
                  >
                    {targetReward.habitGain
                      ? `+${targetReward.habitGain}%`
                      : "—"}
                  </ThemedText>
                </View>

                {/* Shield */}
                <View className="flex-1">
                  <ThemedText size="xxs" color="text" opacity="medium">
                    Shield
                  </ThemedText>

                  <ThemedText
                    size="sm"
                    weight="bold"
                    color={targetReward.shieldBonus ? "primary" : "text"}
                    opacity={targetReward.shieldBonus ? "full" : "medium"}
                    className="mt-0.5"
                  >
                    {targetReward.shieldBonus
                      ? `+${targetReward.shieldBonus}`
                      : "—"}
                  </ThemedText>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* ==================== ACTION ==================== */}
      <View className="mt-1">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={finishFasting}
          className="items-center rounded-2xl bg-error py-3.5"
        >
          <ThemedText size="md" weight="bold" colorHex="white">
            Kết thúc Fasting
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
};
export default FastingSheet;
