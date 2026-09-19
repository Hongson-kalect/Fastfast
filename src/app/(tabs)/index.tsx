import HomeBodyProgress from "@/components/home/BodyProgress";
import CircleCounter from "@/components/home/CircleCounter";
import HomeHeader from "@/components/home/Header";
import { SwapButton } from "@/components/home/SwapButton";
import {
  MIN_FAST_DURATION,
  TOO_QUICK_DURATION,
} from "@/database/shema/fast_sessions";
import { useDBService } from "@/hooks/useDBService";
import { useBottomSheet } from "@/provider/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { finishFast } from "@/util/home/fast";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StatusBar, View } from "react-native";

const rating = [
  {
    rating: "0",
    hours: 0,
  },
];

const HomeScreen = () => {
  const {
    currentFastSession,
    setCurrentFastSession,
    settings,
    userProfile,
    habit,
    updateProfile,
  } = useAppStore();
  const [startTime, setStartTime] = useState<number | null>(
    currentFastSession?.start_time || null,
  );

  const { addModal, modalQueue } = useModalStore();
  const { hide } = useBottomSheet();
  const dbService = useDBService();

  const isCounting = useMemo(() => {
    if (!currentFastSession) return false;
    return currentFastSession.end_time ? false : true;
  }, [currentFastSession]);

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
    // const isValid = true;
    console.log(
      "target",
      currentFastSession?.target_duration,
      duration,
      duration / 3600,
    );
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
    setStartTime(now);

    const newSession = await dbService?.startNewSession(now, settings?.target);
    console.log("new", newSession?.id);
    setCurrentFastSession(newSession);
  };
  const toggleCounting = async (delay?: number) => {
    //Kết thúc đếm
    if (isCounting && startTime && currentFastSession) {
      handleFinishFast(delay);
    } else {
      startFast(delay);
    }
    // lấy dữ liệu fast lần này để xem ghi vào db
  };

  const [counter, setCounter] = useState(0);
  const handleCounter = () => {
    if (!startTime) return;

    const now = new Date().getTime();
    setCounter(Math.floor(Math.abs(now - startTime) / 1000));
  };

  useEffect(() => {
    let interval = undefined;
    if (!isCounting) {
      setCounter(0);
      return;
    }
    handleCounter();

    interval = setInterval(() => {
      handleCounter();
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isCounting]);

  return (
    <View className="flex-1 bg-main">
      <View
        style={{ paddingTop: StatusBar.currentHeight || 0 }}
        className="h-full w-full"
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          <View className="px-3">
            <HomeHeader />
            {/* <View className="pb-2 mt-4">
              <HomeTimeCounter
                finishFasting={handleFinishFast}
                isCounting={isCounting}
                counter={counter}
                currentFast={currentFastSession}
              />
            </View> */}

            <View className="">
              <CircleCounter
                finishFasting={handleFinishFast}
                isCounting={isCounting}
                counter={counter}
                currentFast={currentFastSession}
              />
            </View>

            <View className="-mt-26 items-center justify-center">
              <SwapButton
                currentFast={currentFastSession}
                isCounting={isCounting}
                toggleCounting={toggleCounting}
                variant="primary"
              />
            </View>
            <View className="mt-4">
              {/* These indicators reflect general biological stages based on fasting duration. Always listen to your body and consult a healthcare professional before attempting prolonged fasts */}
              <HomeBodyProgress counter={counter} />
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default HomeScreen;
