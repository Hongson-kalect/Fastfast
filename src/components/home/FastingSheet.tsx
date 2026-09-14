import { FastingTargetItem, getFastingStatus } from "@/constants/data";
import { FastSession } from "@/interfaces/db.type";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { fixed } from "@/util/numberLimit";
import { getRelativeTime, timeString } from "@/util/timer";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";

interface FastingSheetProps {
  counter: number;
  fastTarget: FastingTargetItem | null;
  currentFast: FastSession;
  finishDate: Date | null;
  onStopFasting?: () => void;
  onCancelFasting?: () => void;
  onChangeTarget: () => void;
}

const FastingSheet = ({
  counter,
  currentFast,
  fastTarget,
  finishDate,
  onStopFasting,
  onCancelFasting,
  onChangeTarget,
}: FastingSheetProps) => {
  const { theme } = useAppStore();
  const { addModal } = useModalStore();
  // Giả lập dữ liệu demo
  const finishTime = useMemo(() => {
    return finishDate?.getTime();
  }, [finishDate]);
  const [fastCounter, setFastCounter] = useState(Math.floor(counter / 1000));

  console.log("counter", counter, fastCounter);

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

  useEffect(() => {
    const interval = setInterval(() => {
      setFastCounter((prev) => prev + 1);
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [finishTime]);

  return (
    <View className="px-5 pb-12 gap-5">
      {/* Progress summary */}
      <View className="gap-3 mt-4">
        <View className="flex-row items-end justify-between">
          <View>
            <ThemedText type="small" className="text-zinc-400! text-[11px]!">
              Tiến độ
            </ThemedText>

            <View className="flex-row items-baseline gap-1 mt-0.5">
              <ThemedText className="text-2xl! font-bold!">
                {progressPercent}%
              </ThemedText>

              <ThemedText className="text-xs! text-zinc-500!">
                · {timeString(fastCounter * 1000)}
                {fastTarget?.hours ? ` / ${fastTarget.hours}h` : ""}
              </ThemedText>
            </View>
          </View>

          <ThemedText
            style={{ color: fastTarget?.colors.accent || theme.primary }}
            className="text-xs! font-semibold! uppercase"
          >
            {fastTarget?.label || "FREE MODE"}
          </ThemedText>
        </View>

        <View className="h-3 bg-zinc-700/80 rounded-full overflow-hidden">
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
          <ThemedText className="text-[11px]! text-zinc-500!">
            Bắt đầu {getRelativeTime(new Date(currentFast.start_time))}
          </ThemedText>

          {finishTime && (
            <ThemedText className="text-[11px]! text-zinc-500!">
              Đạt mục tiêu {getRelativeTime(new Date(finishTime))}
            </ThemedText>
          )}
        </View>
      </View>

      {/* Result */}
      <View className="gap-3">
        <ThemedText type="small" className="text-primary! font-bold!">
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
            className="flex-1 rounded-2xl p-3.5 border gap-2"
          >
            <ThemedText className="text-[10px]! font-extrabold! text-zinc-400!">
              HIỆN TẠI
            </ThemedText>

            <ThemedText
              className={`text-sm! font-semibold! ${
                fastCounter >= (fastTarget?.hours || 16) * 3_600
                  ? "text-success!"
                  : ""
              }`}
            >
              {timeString(fastCounter * 1000)}
            </ThemedText>

            <View className="flex-row justify-between">
              <ThemedText className="text-xs! text-zinc-500!">Habit</ThemedText>

              <ThemedText
                className={`text-xs! font-semibold! ${
                  currentReward.habitGain ? "text-success!" : "text-zinc-500!"
                }`}
              >
                {currentReward.habitGain ? `+${currentReward.habitGain}%` : "—"}
              </ThemedText>
            </View>

            <View className="flex-row justify-between">
              <ThemedText className="text-xs! text-zinc-500!">
                Shield
              </ThemedText>

              <ThemedText
                className={`text-xs! font-semibold! ${
                  currentReward.shieldBonus ? "text-primary!" : "text-zinc-500!"
                }`}
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
            className="flex-1 rounded-2xl p-3.5 border gap-2"
          >
            <ThemedText
              style={{ color: fastTarget?.colors.accent || theme.primary }}
              className="text-[10px]! font-extrabold!"
            >
              HOÀN THÀNH
            </ThemedText>

            <ThemedText className="text-sm! font-semibold!">
              {targetReward.finishTime}
            </ThemedText>

            <View className="flex-row justify-between">
              <ThemedText className="text-xs! text-zinc-500!">Habit</ThemedText>

              <ThemedText
                className={`text-xs! font-semibold! ${
                  targetReward.habitGain ? "text-success!" : "text-zinc-500!"
                }`}
              >
                {targetReward.habitGain ? `+${targetReward.habitGain}%` : "—"}
              </ThemedText>
            </View>

            <View className="flex-row justify-between">
              <ThemedText className="text-xs! text-zinc-500!">
                Shield
              </ThemedText>

              <ThemedText
                className={`text-xs! font-semibold! ${
                  targetReward.shieldBonus ? "text-primary!" : "text-zinc-500!"
                }`}
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
      <View className="gap-2 mt-2">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onStopFasting}
          className="bg-red-500 rounded-[14px] py-3.5 items-center"
        >
          <ThemedText className="text-white! font-bold! text-[15px]!">
            Kết thúc Fasting
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onCancelFasting}
          className="py-3 items-center"
        >
          <ThemedText className="text-zinc-400! text-sm! opacity-80">
            Từ bỏ phiên nhịn
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default FastingSheet;
