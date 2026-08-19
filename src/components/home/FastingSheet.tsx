import { FastingTargetItem, getFastingStatus } from "@/constants/data";
import { FastSession } from "@/interfaces/db.type";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { getRelativeTime, timeString } from "@/util/timer";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { Pressable, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";
import { fixed } from "@/util/numberLimit";

interface FastingSheetProps {
  fastTarget: FastingTargetItem;
  currentFast: FastSession;
  counter: number;
  onStopFasting?: () => void;
  onCancelFasting?: () => void;
  onChangeTarget: () => void;
}

const FastingSheet = ({
  counter,
  currentFast,
  fastTarget,
  onStopFasting,
  onCancelFasting,
  onChangeTarget,
}: FastingSheetProps) => {
  const { theme } = useAppStore();
  const { setGlobalModal } = useModalStore();
  // Giả lập dữ liệu demo
  const finishTime = useMemo(() => {
    return currentFast?.start_time + fastTarget.hours * 3600_000;
  }, [fastTarget, currentFast]);
  const [downCounter, setDownCounter] = useState(() => {
    return finishTime - new Date().getTime();
  });

  const remainCounter = useMemo(() => {
    return fastTarget.hours * 3600_000 - downCounter;
  }, [downCounter]);

  const counterStatus = useMemo(() => {
    const status = getFastingStatus(remainCounter);

    return `${status.title} ${status.icon}`;
  }, [remainCounter]);

  const getDownCounter = () => {
    return finishTime - new Date().getTime();
  };

  const progressPercent = useMemo(() => {
    return Math.min(
      100,
      Math.round((counter / fastTarget.hours / 3600_000) * 1000) / 10,
    );
  }, [counter, fastTarget.hours]);

  const targetReward = useMemo(() => {
    const habitGain = 3 + (fastTarget.hours - 16) * 0.2;
    const shieldBonus = Math.min(
      2,
      Math.max(0, Math.floor(fastTarget.hours / 24 - 1)),
    );
    const relativeTime = getRelativeTime(new Date(finishTime));
    return {
      finishTime: relativeTime,
      habitGain: fixed(habitGain),
      shieldBonus: shieldBonus,
    };
  }, []);
  const currentReward = useMemo(() => {
    const currentHour = Math.floor(counter / 3600_000);
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
    setGlobalModal({
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
      setDownCounter(getDownCounter());
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [finishTime]);

  return (
    <View className="px-5 pb-6 gap-5">
      {/* 1. Header Status Badge */}
      <View className="flex-row items-center self-center px-3 py-1.5 rounded-full gap-2 mt-4">
        <View className="w-2 h-2 rounded-full bg-success" />
        <ThemedText className="text-xs! font-bold! text-success! tracking-wide">
          {counterStatus}
        </ThemedText>
      </View>

      {/* 2. Timer & Big Progress */}
      <View className="items-center gap-1.5">
        {/* <ThemedText
          type="small"
          className="tracking-widest font-bold!"
          style={{ fontVariant: ["tabular-nums"] }}
        >
          18:24:10
        </ThemedText> */}
        <View className="mt-4 mb-4 w-full gap-1">
          <View className="">
            <View className="w-full flex-row justify-between items-center">
              <ThemedText
                // style={{ color: fastTarget.colors.accent }}
                type="small"
                className="opacity-50! text-xs! font-light!"
              >
                Bắt đầu: {getRelativeTime(new Date(currentFast.start_time))}
              </ThemedText>
              <ThemedText
                style={{ color: fastTarget.colors.accent }}
                type="small"
                className="font-bold!"
              >
                {fastTarget.label} - {fastTarget.hours}H
              </ThemedText>
            </View>
            <View className="flex-row justify-between items-center"></View>
          </View>

          <View className="h-4 bg-gray-600 rounded-full w-full overflow-hidden">
            <LinearGradient
              style={{ width: `${progressPercent}%`, borderRadius: 100 }}
              className="h-full rounded-full"
              colors={[
                fastTarget.colors.accent + "50",
                fastTarget.colors.accent,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            ></LinearGradient>
            {/* <View
              style={{ width: `${progressPercent}%` }}
              className="h-full rounded-full bg-warning"
            ></View> */}
          </View>

          <View className="justify-between flex-row items-center w-full">
            {/* <ThemedText className="opacity-0">{progressPercent}%</ThemedText> */}
            {downCounter > 0 ? (
              <ThemedText type="small" className="opacity-60 text-xs!">
                Còn: {timeString(downCounter)}
              </ThemedText>
            ) : (
              <ThemedText type="small" className="text-success! text-[12px]!">
                Completed
              </ThemedText>
            )}

            <ThemedText
              type="small"
              className={`${downCounter > 0 ? "opacity-60" : "text-success!"} text-xs!`}
            >
              {progressPercent}%
            </ThemedText>
          </View>
        </View>
      </View>

      <View className="gap-3">
        <ThemedText type="small" className="text-primary font-bold!">
          Kết quả
        </ThemedText>
        {/* 3. Comparison Cards (So sánh Kết quả) */}
        <View className="flex-row gap-3">
          {/* Card B: Nếu dừng Ngay lúc này */}
          <View
            style={{
              borderColor:
                theme.success +
                Math.floor(
                  Math.min(counter / fastTarget.hours / 3600_000, 1) * 99,
                )
                  .toString()
                  .padStart(2, "0"),

              backgroundColor:
                theme.success +
                Math.floor(
                  Math.min(counter / fastTarget.hours / 3600_000, 1) * 15,
                )
                  .toString()
                  .padStart(2, "0"),
            }}
            className="flex-1 bg-zinc-900/80 rounded-2xl p-3.5 border border-zinc-800 gap-1.5"
          >
            <View className="mb-0.5">
              <ThemedText className="text-[10px]! font-extrabold! text-gray-400!">
                ⏹️ HIỆN TẠI
              </ThemedText>
            </View>
            <ThemedText
              className={`text-sm! font-semibold! mb-1.5 ${downCounter <= 0 && "text-success"}`}
            >
              Fasting: {timeString(remainCounter)}
            </ThemedText>
            <View className="flex-row justify-between items-center">
              <ThemedText className="text-xs! text-zinc-400!">
                Habit:
              </ThemedText>
              <ThemedText
                className={`text-xs! font-semibold! ${currentReward.habitGain ? "text-success!" : "opacity-50"}`}
              >
                {currentReward.habitGain ? `+${currentReward.habitGain}%` : 0}
              </ThemedText>
            </View>
            <View className="flex-row justify-between items-center">
              <ThemedText className="text-xs! text-zinc-400!">
                Shield Bonus:
              </ThemedText>
              <ThemedText
                className={`text-xs! font-semibold! ${currentReward.shieldBonus ? "text-primary!" : "opacity-50"}`}
              >
                {currentReward.shieldBonus
                  ? `+${currentReward.shieldBonus}`
                  : 0}
              </ThemedText>
            </View>
          </View>

          {/* Card A: Nếu hoàn thành Target */}
          <Pressable
            onPress={changeTargetConfirm}
            style={{
              borderColor: fastTarget.colors.accent,
              backgroundColor: fastTarget.colors.badgeBg,
            }}
            className="flex-1 rounded-2xl p-3.5 border gap-1.5"
          >
            <View className="mb-0.5">
              <ThemedText
                style={{ color: fastTarget.colors.accent }}
                className="text-[10px]! font-extrabold!"
              >
                🏁 HOÀN THÀNH
              </ThemedText>
            </View>
            <ThemedText className="text-sm! font-semibold! mb-1.5">
              {targetReward.finishTime}
            </ThemedText>
            <View className="flex-row justify-between items-center">
              <ThemedText className="text-xs! text-zinc-400!">
                Habit:
              </ThemedText>
              <ThemedText
                className={`text-xs! font-semibold! ${targetReward.habitGain ? "text-success!" : "opacity-50"}`}
              >
                {targetReward.habitGain ? `+${targetReward.habitGain}%` : 0}
              </ThemedText>
            </View>
            <View className="flex-row justify-between items-center">
              <ThemedText className="text-xs! text-zinc-400!">
                Shield Bonus:
              </ThemedText>
              <ThemedText
                className={`text-xs! font-semibold! ${targetReward.shieldBonus ? "text-primary!" : "opacity-50"}`}
              >
                {targetReward.shieldBonus ? `+${targetReward.shieldBonus}` : 0}
              </ThemedText>
            </View>
          </Pressable>
        </View>
      </View>

      {/* 4. Action Buttons */}
      <View className="gap-2.5 mt-3">
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
          className="mt-2 py-3 items-center"
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
