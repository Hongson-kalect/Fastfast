import { TAB_BAR_SPACE } from "@/constants/design";
import HomeBodyProgress from "@/components/home/BodyProgress";
import CircleCounter from "@/components/home/CircleCounter";
import HomeHeader from "@/components/home/Header";
import { RecentFastCard } from "@/components/home/LastFastLog";
import { SwapButton } from "@/components/home/SwapButton";
import { SectionTitle } from "@/components/SectionTitle";
import { RADIUS } from "@/constants/design";
import {
  MIN_FAST_DURATION,
  TOO_QUICK_DURATION,
} from "@/database/schema/fast_sessions";
import { useDBService } from "@/hooks/useDBService";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { feedback } from "@/utils/feedback";
import { finishFast } from "@/utils/home/fast";
import { scheduleTargetReached } from "@/utils/notifications";
import { FontAwesome6 } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HomeScreen = () => {
  const setCurrentFastSession = useAppStore(
    (state) => state.setCurrentFastSession,
  );

  const settings = useAppStore((state) => state.settings);
  const theme = useAppStore((state) => state.theme);

  const currentFastSession = useAppStore((state) => state.currentFastSession);
  const startTime = currentFastSession?.start_time ?? null;
  const { addModal } = useModalStore();
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
    setCounter(0);

    const newSession = await dbService?.startNewSession(now, settings?.target);
    setCurrentFastSession(newSession);
    feedback("fastStart");
    if (newSession) scheduleTargetReached(dbService, newSession);
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

    // Giờ bắt đầu ở tương lai (chỉnh giờ máy, đổi múi giờ) không được thành đếm ngược
    setCounter(Math.max(0, Math.floor((endTime - startTime) / 1000)));
  };

  const isFastingActive = isCounting && !currentFastSession?.end_time;

  useEffect(() => {
    let interval = undefined;
    handleCounter();
    if (!isCounting) {
      return;
    }

    interval = setInterval(() => {
      handleCounter();
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isCounting]);

    const inset = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: inset.top, paddingBottom: inset.bottom }} className="flex-1 bg-background">
      {/* Tối ưu StatusBar bằng SafeAreaView chuẩn xác */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: TAB_BAR_SPACE }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header chứa Profile + Streak Badge */}
          <HomeHeader />

          {/* Hero: vòng tròn đếm giờ */}
          <View className="mt-5">
            <CircleCounter
              finishFasting={handleFinishFast}
              isCounting={isCounting}
              counter={counter}
              currentFast={currentFastSession}
            />
          </View>

          {/* Hành động chính trong tầm ngón cái */}
          <View className="mt-4">
            <SwapButton isCounting={isCounting} toggleCounting={toggleCounting} />
          </View>

          {/* Lần nhịn gần nhất (khi chưa nhịn) */}
          {!isFastingActive && currentFastSession?.end_time && (
            <View className="mt-7">
              <SectionTitle title="Lần nhịn gần nhất" />
              <RecentFastCard session={currentFastSession} />
            </View>
          )}

          {/* Giai đoạn cơ thể */}
          <View className="mt-7">
            <SectionTitle
              title={isFastingActive ? "Giai đoạn cơ thể" : "Các giai đoạn khi nhịn"}
              right={
                <TouchableOpacity activeOpacity={0.7} hitSlop={10}>
                  <FontAwesome6
                    name="circle-question"
                    size={16}
                    color={theme.text + "66"}
                  />
                </TouchableOpacity>
              }
            />
            <View
              className="bg-card p-4"
              style={{
                borderRadius: RADIUS.lg,
                borderWidth: 1,
                borderColor: theme.text + "0F",
              }}
            >
              <HomeBodyProgress counter={counter} />
            </View>
          </View>
        </ScrollView>
    </View>
  );
};

export default HomeScreen;
