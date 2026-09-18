import HomeBodyProgress from "@/components/home/BodyProgress";
import CircleCounter from "@/components/home/CircleCounter";
import FullHabitModal from "@/components/home/FullHabitModal";
import HomeHeader from "@/components/home/Header";
import { FastResultData, ResultModal } from "@/components/home/ResultModal";
import { StreakCheckModal } from "@/components/home/StreakModal";
import { SwapButton } from "@/components/home/SwapButton";
import {
  MIN_FAST_DURATION,
  TOO_QUICK_DURATION
} from "@/database/shema/fast_sessions";
import { SHIELD_LIMIT } from "@/database/shema/habit_logs";
import { useDBService } from "@/hooks/useDBService";
import { StreakCheckResult } from "@/interfaces/home.type";
import { useBottomSheet } from "@/provider/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { splitSessionIntoDays } from "@/util/home/timespliter";
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

  const finishFast = async (now: number = Date.now()) => {
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
        setCounter(0);
        // Lấy thời gian, nếu nhỏ hơn x thì cho thành false nếu thời gian > 2 tiếng hoặc xóa luôn nếu dưới
        hide();

        console.log("current ", currentFastSession.id);

        const { lastSession, habitLog, profile, streak } =
          await dbService?.finishLastSession({
            id: currentFastSession?.id,
            endTime: now,
          });

        // update zustand
        const tempProfile = { ...userProfile!, ...profile! };
        if (userProfile && profile) {
          updateProfile({
            ...userProfile,
            ...profile,
          });
        }

        setCurrentFastSession(lastSession || null);

        // Nhập dữ liệu modal result: habit -> ok, lastSession -> duration, target -> ok

        if (!isValid || !lastSession || !habitLog) return;
        const resultData: FastResultData = {
          fastingTime: lastSession?.duration,
          habitDiff: habitLog?.habit_delta || 0,
          habitPercent: habitLog?.habit_snap,
          shields: {
            current: habitLog?.shield_snap,
            max: SHIELD_LIMIT,
            gained: habitLog?.shield_delta || 0,
            detail: habitLog?.shield_detail
              ? JSON.parse(habitLog?.shield_detail)
              : null,
          },
          retainCount: habitLog?.habit_retain || 0,
          retainDiff: habitLog?.retain_delta || 0,
          targetHours: lastSession?.target_duration || null,
          note: habitLog?.description,
        };

        console.log("result data", resultData, habitLog, lastSession);

        addModal({
          type: "custom",
          render: <ResultModal data={resultData} />,
        });

        // Đạt được 100 snap thông báo
        if (habitLog?.habit_snap === 100 && !habitLog?.habit_retain) {
          addModal({
            type: "custom",
            render: <FullHabitModal habitName="Fast" />,
          });
        }

        if (isValid) {
          const parsedDays = splitSessionIntoDays(
            startTime,
            now,
            currentFastSession.id,
          );
          console.log(parsedDays.map((x) => x.log_date));

          for (const dayData of parsedDays) {
            await dbService?.addDailyLogs({
              log_date: dayData.log_date,
              fast_id: currentFastSession.id,
              hours_in_day: dayData.hours_in_day,
              elapsed_times: dayData.elapsed_hours,
              hour_in_fast: parseFloat((duration / 60 / 60).toFixed(1)),
              // user_id, mood_level, note có thể bổ sung tùy thuộc form điền sau khi nhịn
            });
          }
        }
          const {habitLog:finalHabitLog,profile:finalProfile,streak:finalStreak}=await dbService.reconcileStreak({
            lastFast: lastSession,
            profile: tempProfile,
            habitLog,
          });
  
          if (finalProfile) {
            updateProfile({
              ...tempProfile,
              ...finalProfile,
            });
          }

          console.log('reconcile',finalHabitLog,finalProfile,finalStreak);
  
          finalStreak&&checkStreak(finalStreak);
      },
    });
  };

  const checkStreak=(result:StreakCheckResult)=>{
    
        const { streak, habit, retain, shield } = result;
    
        // Login chỉ reconcile trạng thái streak.
        // Không tăng streak ở đây nữa.
    
        const usedShield = shield.previous > shield.current;
        const lostStreak = streak.previous > streak.current;
    
        if (!usedShield && !lostStreak) return;
    
        setTimeout(() => {
          addModal({
            type: "custom",
            render: (
              <StreakCheckModal
                data={{
                  streak: {
                    current: streak.current,
                    max: streak.max,
                    previous: streak.previous,
                  },
                  habit: {
                    currentPercent: habit.currentPercent,
                    previousPercent: habit.previousPercent,
                  },
                  retain: {
                    current: retain.current,
                    previous: retain.previous,
                  },
                  shield: {
                    current: shield.current,
                    previous: shield.previous,
                  },
                }}
              />
            ),
          });
        }, 1000);
  }

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
      finishFast(delay);
    } else {
      startFast(delay);
    }
    // lấy dữ liệu fast lần này để xem ghi vào db
  };

  const [counter, setCounter] = useState(0);
  const handleCounter = () => {
    if (!startTime) return;

    const now = new Date().getTime();
    setCounter(Math.abs(now - startTime));
  };

  useEffect(() => {
    let interval = undefined;
    if (!isCounting) {
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
                finishFasting={finishFast}
                isCounting={isCounting}
                counter={counter}
                currentFast={currentFastSession}
              />
            </View> */}

            <View className="">
              <CircleCounter
                finishFasting={finishFast}
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
