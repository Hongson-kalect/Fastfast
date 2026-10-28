import { TAB_BAR_SPACE } from "@/constants/design";
import HomeBodyProgress from "@/components/home/BodyProgress";
import CircleCounter from "@/components/home/CircleCounter";
import HomeHeader from "@/components/home/Header";
import { BodyProgressInfo } from "@/components/home/InfoContent";
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
import { useCallback } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useT } from "@/providers/Language";

const HomeScreen = () => {
  const setCurrentFastSession = useAppStore(
    (state) => state.setCurrentFastSession,
  );

  const settings = useAppStore((state) => state.settings);
  const theme = useAppStore((state) => state.theme);

  const currentFastSession = useAppStore((state) => state.currentFastSession);
  const startTime = currentFastSession?.start_time ?? null;
  const addModal = useModalStore((state) => state.addModal);
  const dbService = useDBService();
  const t = useT();

  const isCounting = !!currentFastSession && !currentFastSession.end_time;

  const handleFinishFast = async (now: number = Date.now()) => {
    if (!(isCounting && startTime && currentFastSession))
      return alert("Invalid action");

    if (startTime >= now) {
      return addModal({
        type: "alert",
        title: t("common.invalid"),
        message: t("finish.endBeforeStart"),
      });
    }
    let message = t("finish.confirm");
    let subMessage = "";
    const duration = Math.floor(Math.abs(now - startTime) / 1000);
    const isTooFast = duration < TOO_QUICK_DURATION;
    const isValid = duration > MIN_FAST_DURATION;

    const isReachTarget = currentFastSession?.target_duration
      ? duration / 3600 > currentFastSession.target_duration
      : null;

    if (isTooFast) {
      message = t("finish.tooQuick");
      subMessage = t("finish.tooQuickSub");
    } else if (!isValid) {
      message = t("finish.failed");
      subMessage = t("finish.failedSub");
    }

    if (isReachTarget) {
      message = t("finish.reached");
    }

    if (isReachTarget === false) {
      message = t("finish.notReached");
    }

    addModal({
      type: "confirm",
      title: t("finish.title"),
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
        title: t("common.invalid"),
        message: t("finish.startBeforeLast"),
      });
    }
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

  const openBodyProgressInfo = () => {
    feedback("tap");
    addModal({
      type: "alert",
      title: t("info.body.title"),
      message: t("info.body.message"),
      middle: <BodyProgressInfo />,
      okText: t("common.gotIt"),
    });
  };
  const isFastingActive = isCounting && !currentFastSession?.end_time;

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
              <SectionTitle title={t("home.lastFast")} />
              <RecentFastCard session={currentFastSession} />
            </View>
          )}

          {/* Giai đoạn cơ thể */}
          <View className="mt-7">
            <SectionTitle
              title={isFastingActive ? t("home.bodyPhases") : t("home.fastingPhases")}
              right={
                <TouchableOpacity
                  activeOpacity={0.7}
                  hitSlop={10}
                  onPress={openBodyProgressInfo}
                >
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
              <HomeBodyProgress />
            </View>
          </View>
        </ScrollView>
    </View>
  );
};

export default HomeScreen;
