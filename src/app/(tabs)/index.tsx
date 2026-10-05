import HomeBodyProgress from "@/components/home/BodyProgress";
import CircleCounter from "@/components/home/CircleCounter";
import HomeHeader from "@/components/home/Header";
import { RecentFastCard } from "@/components/home/LastFastLog";
import { SwapButton } from "@/components/home/SwapButton";
import { ThemedText } from "@/components/themed-text";
import {
  MIN_FAST_DURATION,
  TOO_QUICK_DURATION,
} from "@/database/shema/fast_sessions";
import { useDBService } from "@/hooks/useDBService";
import { useBottomSheet } from "@/provider/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { finishFast } from "@/util/home/fast";
import { FontAwesome6 } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const rating = [
  {
    rating: "0",
    hours: 0,
  },
];

const HomeScreen = () => {
  const setCurrentFastSession = useAppStore(
    (state) => state.setCurrentFastSession,
  );

  const settings = useAppStore((state) => state.settings);
  const theme = useAppStore((state) => state.theme);

  const currentFastSession = useAppStore((state) => state.currentFastSession);
  const startTime = currentFastSession?.start_time ?? null;
  const { addModal, modalQueue } = useModalStore();
  const { hide } = useBottomSheet();
  const dbService = useDBService();

  const isCounting = !!currentFastSession && !currentFastSession.end_time;

  const handleFinishFast = async (now: number = Date.now()) => {
    if (!(isCounting && startTime && currentFastSession))
      return alert("Invalid action");

    if (startTime >= now) {
      return addModal({
        type: "alert",
        title: "Invalid",
        message: "Time finish must be greater than start time",
      });
    }
    let message = "Are you sure you want to finish your session?";
    let subMessage = "";
    const duration = Math.floor(Math.abs(now - startTime) / 1000);
    const isTooFast = duration < TOO_QUICK_DURATION;
    const isValid = duration > MIN_FAST_DURATION;

    const isReachTarget = currentFastSession?.target_duration
      ? duration / 3600 > currentFastSession.target_duration
      : null;

    if (isTooFast) {
      message = "This session too fast, it will be deleted, are you sure?";
      subMessage = "The duration is less than 2 hours.";
    } else if (!isValid) {
      message = "This session will marked as FAILED, are you sure?";
      subMessage = "The duration is less than 16 hours.";
    }

    if (isReachTarget) {
      message = "You got the target, finish now?";
    }

    if (isReachTarget === false) {
      message = "You not reach the target, are you sure to finish?";
    }

    addModal({
      type: "confirm",
      title: "Finish",
      message: message,

      subMessage: subMessage || "",
      onOk: async () => {
        await finishFast({
          dbService,
          currentFast: currentFastSession,
          endTime: now,
        });
      },
    });
  };

  const startFast = async (now: number = Date.now()) => {
    if (currentFastSession?.end_time && now <= currentFastSession?.end_time) {
      return addModal({
        type: "alert",
        title: "Invalid",
        message: "Start time must be greater than the last session",
      });
    }
    // Bắt đầu đếm
    // const now = new Date().getTime();
    setCounter(0);

    const newSession = await dbService?.startNewSession(now, settings?.target);
    console.log("new", newSession?.id);
    setCurrentFastSession(newSession);
  };

  const toggleCounting = useCallback(
    async (delay?: number) => {
      if (isCounting && startTime && currentFastSession) {
        await handleFinishFast(delay);
      } else {
        await startFast(delay);
      }
    },
    [isCounting, startTime, currentFastSession, handleFinishFast, startFast],
  );

  const [counter, setCounter] = useState(0);
  const handleCounter = () => {
    if (!startTime) return;

    const endTime = currentFastSession?.end_time ?? Date.now();

    setCounter(Math.floor((endTime - startTime) / 1000));
  };

  const isFastingActive = isCounting && !currentFastSession?.end_time;

  useEffect(() => {
    let interval = undefined;
    handleCounter();
    if (!isCounting) {
      // setCounter(0);
      return;
    }

    interval = setInterval(() => {
      handleCounter();
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isCounting]);

  return (
    <View className="flex-1 bg-background">
      {/* Tối ưu StatusBar bằng SafeAreaView chuẩn xác */}
      <SafeAreaView className="flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header chứa Profile + Streak Badge */}
          <HomeHeader />

          {/* Hero Section: Circle Counter & Floating Action Button */}
          <View className="items-center justify-center my-4 relative">
            <CircleCounter
              finishFasting={handleFinishFast}
              isCounting={isCounting}
              counter={counter}
              currentFast={currentFastSession}
            />
            {/* Tận dụng absolute positioning để cân bằng chính xác center */}
            <View className="absolute -bottom-2 align-center">
              <SwapButton
                isCounting={isCounting}
                toggleCounting={toggleCounting}
              />
            </View>
          </View>

          {/* Gamified Body Phase Progress (Đưa lên vị trí cao hơn để tăng Dopamine) */}
          <View className="mt-4">
            <View className="flex-row items-center justify-between mb-3">
              <ThemedText
                size="lg"
                weight="bold"
                color="primary"
                className="tracking-tight"
              >
                {isFastingActive
                  ? "Giai đoạn cơ thể "
                  : currentFastSession?.end_time
                    ? "Lần nhịn gần nhất"
                    : "Chuẩn bị nhịn ăn"}
              </ThemedText>

              <TouchableOpacity
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                // onPress={() => handleOpenPhaseInfoModal()}
              >
                <FontAwesome6
                  name="circle-question"
                  size={18}
                  color={theme.text + "80"}
                />
              </TouchableOpacity>
            </View>

            {/* Historical / Recent Activity Card */}
            {!isFastingActive && currentFastSession?.end_time && (
              <RecentFastCard session={currentFastSession} />
            )}

            <HomeBodyProgress counter={counter} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default HomeScreen;
