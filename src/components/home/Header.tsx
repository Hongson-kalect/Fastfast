import { FASTING_TARGETS } from "@/constants/data";
import { useDBService } from "@/hooks/useDBService";
import { FastSession, HabitLog } from "@/interfaces/db.type";
import { useBottomSheet } from "@/provider/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { useEffect, useMemo, useState } from "react";
import { Dimensions, Pressable, Text, View } from "react-native";
import CircularProgress from "../circleProgress";
import { ThemedText } from "../themed-text";
import HabitBottomSheet, { HabitLogComponent } from "./HabitBottomSheet";
import { HabitDetailModal } from "./HabitDetailModal";

const radius = 50;

const HomeHeader = () => {
  const { theme, settings, userProfile, habit } = useAppStore();
  const { present } = useBottomSheet();

  const maxHeight = useMemo(
    () => Dimensions.get("window").height * 0.5,
    [0.3, 0.8],
  );

  const [habitLogs, setHabitLogs] = useState<(HabitLog & FastSession)[]>([]);
  const dbService = useDBService();

  const getHabitLogs = async () => {
    const res = await dbService?.getHabitLogs();
    setHabitLogs(res);
  };

  useEffect(() => {
    getHabitLogs();
  }, []);

  const { addModal } = useModalStore();
  const handleSelectHabit = (
    log: HabitLog & FastSession,
    target?: (typeof FASTING_TARGETS)[0],
  ) => {
    console.log("log", log, target);
    addModal({
      type: "custom",
      render: <HabitDetailModal log={log} targetInfo={target} />,
    });
  };

  const openHabitModal = () => {
    console.log("Vừng mở ra");
    present(<HabitBottomSheet />, {
      list: {
        data: habitLogs,
        renderItem: ({ item }) => (
          <View className="px-4">
            <HabitLogComponent onPress={handleSelectHabit} log={item} />
          </View>
        ),
        keyExtractor(item, index) {
          return String(index);
        },
        empty: (
          <View className="mt-8 gap-3 items-center">
            <Text className="italic text-text-base/40">
              Chưa có lịch sử phiên gần đây
            </Text>
          </View>
        ),
      },
    });
  };

  return (
    <View className="flex-row justify-between items-center">
      <View>
        <ThemedText type="subtitle" color="white">
          {/* Hi, Kalect */}
          FastFast
        </ThemedText>
      </View>
      <Pressable hitSlop={10} onPress={openHabitModal}>
        <CircularProgress value={habit?.habit_snap || 0} />
      </Pressable>
    </View>
  );
};

export default HomeHeader;
