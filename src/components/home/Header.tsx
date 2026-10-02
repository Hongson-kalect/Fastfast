import { FASTING_TARGETS } from "@/constants/data";
import { useDBService } from "@/hooks/useDBService";
import { FastSession, HabitLog } from "@/interfaces/db.type";
import { useBottomSheet } from "@/provider/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { useEffect, useMemo, useState } from "react";
import { Dimensions, Pressable, View } from "react-native";
import CircularProgress from "../circleProgress";
import { ThemedText } from "../themed-text";
import HabitBottomSheet from "./HabitBottomSheet";
import { HabitDetailModal } from "./HabitDetailModal";

const radius = 50;

const HomeHeader = () => {
  const {  habit } = useAppStore();
  const { present } = useBottomSheet();

  const openHabitModal = () => {
      return present(<HabitBottomSheet />, {
        isRaw: true,
        snapPoints: ["100%"],
      });
  };

  return (
    <View className="flex-row justify-between items-center">
      <View>
        <ThemedText size="xxxl" weight="semibold">
          {/* Hi, Kalect */}
          FastFast
        </ThemedText>
      </View>
      <Pressable className="z-10" hitSlop={10} onPress={openHabitModal}>
        <CircularProgress value={habit?.habit_snap || 0} />
      </Pressable>
    </View>
  );
};

export default HomeHeader;
