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
  // Giả lập dữ liệu demo
  const finishTime = useMemo(() => {
    return finishDate?.getTime();
  }, [finishDate]);
  const [fastCounter, setFastCounter] = useState(counter);

  const counterStatus = useMemo(() => {
    const status = getFastingStatus(fastCounter * 1000);

    return `${status.title} ${status.icon}`;
  }, [fastCounter]);

  const progressPercent = useMemo(() => {
    if (!fastTarget) return 100;
    return Math.min(100, Math.floor(fastCounter / fastTarget.hours / 3.6) / 10);
  }, [fastCounter, fastTarget?.hours]);

  const targetReward = useMemo(() => {
    if (!fastTarget)
      return {
        finishTime: "--:--",
        habitGain: 0,
        shieldBonus: 0,
      };
    const habitGain = 3 + (fastTarget?.hours - 16) * 0.2;
    const shieldBonus = Math.min(
      2,
      Math.max(0, Math.floor(fastTarget.hours / 24 - 1)),
    );
    return {
      finishTime: finishTime ? getRelativeTime(new Date(finishTime)) : "--:--",
      habitGain: fixed(habitGain),
      shieldBonus: shieldBonus,
    };
  }, []);
  const currentReward = useMemo(() => {
    const currentHour = Math.floor(fastCounter / 3600);
    const habitGain = currentHour >= 16 ? 3 + (currentHour - 16) * 0.2 : 0;
    const shieldBonus = Math.min(
      2,
      Math.max(0, Math.floor(currentHour / 24 - 1)),
    );
    return {
      // achievedLabel: `Đạt mốc ${currentHour}/${fastTarget.hours}`,
      habitGain: fixed(habitGain),
      shieldBonus: shieldBonus,
    };
  }, []);

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

  const { hide } = useBottomSheet();
  const finishFasting = () => {
    hide();
    if (onStopFasting) onStopFasting();
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setFastCounter((prev) => prev + 1);
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [finishTime]);

  return (
    <View className="gap-5 px-5 pb-12">
  {/* Progress summary */}
  <View className="mt-4 gap-3">
    <View className="flex-row items-end justify-between">
      <View>
        <ThemedText size="xxs" color="text" opacity="medium">
          Tiến độ
        </ThemedText>

        <View className="mt-0.5 flex-row items-baseline gap-1">
          <ThemedText size="xxl" weight="bold">
            {progressPercent}%
          </ThemedText>

          <ThemedText size="xs" color="text" opacity="medium">
            · {timeString(fastCounter)}
            {fastTarget?.hours ? ` / ${fastTarget.hours}h` : ""}
          </ThemedText>
        </View>
      </View>

      <ThemedText
        size="xs"
        weight="semibold"
        colorHex={fastTarget?.colors.accent || theme.primary}
        style={{ textTransform: "uppercase" }}
      >
        {fastTarget?.label || "FREE MODE"}
      </ThemedText>
    </View>

    <View className="h-3 overflow-hidden rounded-full bg-text-base/20">
      <LinearGradient
        style={{
          width: `${progressPercent}%`,
          borderRadius: 100,
        }}
        className="h-full"
        colors={[
          (fastTarget?.colors.accent || theme.primary) + "50",
          fastTarget?.colors.accent || theme.primary,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
    </View>

    <View className="flex-row justify-between">
      <ThemedText size="xxs" color="text" opacity="medium">
        Bắt đầu {getRelativeTime(new Date(currentFast.start_time))}
      </ThemedText>

      {settings?.target && finishTime ? (
        counter >= settings.target * 3_600 ? (
          <ThemedText size="xxs" color="success">
            Đã hoàn thành
          </ThemedText>
        ) : (
          <ThemedText size="xxs" color="text" opacity="medium">
            Hoàn thành: {getRelativeTime(new Date(finishTime))}
          </ThemedText>
        )
      ) : (
        <ThemedText size="xxs" color="text" opacity="medium">
          Free mode
        </ThemedText>
      )}
    </View>
  </View>

  {/* Result */}
  <View className="gap-3">
    <ThemedText size="sm" weight="bold" color="primary">
      Kết quả
    </ThemedText>

    <View className="flex-row gap-3">
      {/* Current */}
      <View
        style={{
          borderColor:
            theme.success +
            Math.floor(
              Math.min(
                fastCounter / ((fastTarget?.hours || 16) * 3_600),
                1,
              ) * 99,
            )
              .toString(16)
              .padStart(2, "0"),

          backgroundColor:
            theme.success +
            Math.floor(
              Math.min(
                fastCounter / ((fastTarget?.hours || 16) * 3_600),
                1,
              ) * 15,
            )
              .toString(16)
              .padStart(2, "0"),
        }}
        className="flex-1 gap-2 rounded-2xl border p-3.5"
      >
        <ThemedText size="xxs" weight="bold" color="text" opacity="medium">
          HIỆN TẠI
        </ThemedText>

        <ThemedText
          size="sm"
          weight="semibold"
          color={
            fastCounter >= (fastTarget?.hours || 16) * 3_600
              ? "success"
              : "text"
          }
        >
          {timeString(fastCounter)}
        </ThemedText>

        <View className="flex-row justify-between">
          <ThemedText size="xs" color="text" opacity="medium">
            Habit
          </ThemedText>

          <ThemedText
            size="xs"
            weight="semibold"
            color={currentReward.habitGain ? "success" : "text"}
            opacity={currentReward.habitGain ? "full" : "medium"}
          >
            {currentReward.habitGain
              ? `+${currentReward.habitGain}%`
              : "—"}
          </ThemedText>
        </View>

        <View className="flex-row justify-between">
          <ThemedText size="xs" color="text" opacity="medium">
            Shield
          </ThemedText>

          <ThemedText
            size="xs"
            weight="semibold"
            color={currentReward.shieldBonus ? "primary" : "text"}
            opacity={currentReward.shieldBonus ? "full" : "medium"}
          >
            {currentReward.shieldBonus
              ? `+${currentReward.shieldBonus}`
              : "—"}
          </ThemedText>
        </View>
      </View>

      {/* Target result */}
      <View
        style={{
          borderColor: fastTarget?.colors.accent || theme.primary,
          backgroundColor:
            (fastTarget?.colors.accent || theme.primary) + "30",
        }}
        className="flex-1 gap-2 rounded-2xl border p-3.5"
      >
        <ThemedText
          size="xxs"
          weight="bold"
          colorHex={fastTarget?.colors.accent || theme.primary}
        >
          HOÀN THÀNH
        </ThemedText>

        <ThemedText size="sm" weight="semibold">
          {targetReward.finishTime}
        </ThemedText>

        <View className="flex-row justify-between">
          <ThemedText size="xs" color="text" opacity="medium">
            Habit
          </ThemedText>

          <ThemedText
            size="xs"
            weight="semibold"
            color={targetReward.habitGain ? "success" : "text"}
            opacity={targetReward.habitGain ? "full" : "medium"}
          >
            {targetReward.habitGain
              ? `+${targetReward.habitGain}%`
              : "—"}
          </ThemedText>
        </View>

        <View className="flex-row justify-between">
          <ThemedText size="xs" color="text" opacity="medium">
            Shield
          </ThemedText>

          <ThemedText
            size="xs"
            weight="semibold"
            color={targetReward.shieldBonus ? "primary" : "text"}
            opacity={targetReward.shieldBonus ? "full" : "medium"}
          >
            {targetReward.shieldBonus
              ? `+${targetReward.shieldBonus}`
              : "—"}
          </ThemedText>
        </View>
      </View>
    </View>
  </View>

  {/* Actions */}
  <View className="mt-2 gap-2">
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={finishFasting}
      className="items-center rounded-[14px] bg-error py-3.5"
    >
      <ThemedText size="md" weight="bold" colorHex="#FFFFFF">
        Kết thúc Fasting
      </ThemedText>
    </TouchableOpacity>
  </View>
</View>
  );
};

export default FastingSheet;
