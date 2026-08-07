import HomeBodyProgress from "@/components/home/BodyProgress";
import HomeHeader from "@/components/home/Header";
import { SwapButton } from "@/components/home/SwapButton";
import HomeTimeCounter from "@/components/home/TimeCounter";
import { useDBService } from "@/hooks/useDBService";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { splitSessionIntoDays } from "@/util/home/timespliter";
import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const rating = [
  {
    rating: "0",
    hours: 0,
  },
];

const HomeScreen = () => {
  const { currentFastSession, setCurrentFastSession, updateHabit } =
    useAppStore();
  const [startTime, setStartTime] = useState<number | null>(
    currentFastSession?.start_time || null,
  );

  const { setGlobalModal } = useModalStore();

  const dbService = useDBService();

  const [isCounting, setIsCounting] = useState(
    currentFastSession ? true : false,
  );
  const toggleCounting = async () => {
    //Kết thúc đếm
    if (isCounting && startTime && currentFastSession) {
      let message = "Are you sure you want to finish your session?";
      let subMessage =''
      const now = new Date().getTime();
      const duration = Math.floor(Math.abs(now - startTime) / 1000);
      const isValid = duration > 16 * 3600;
      const isReachTarget = currentFastSession?.target_duration ?duration > currentFastSession.target_duration:null
      if (!isValid) {
        message =
          "This session will marked as FAILED, are you sure?";
          subMessage = "The duration is less than 16 hours."
      }

      if(isReachTarget){
        message ='You got the target, well done!';
      }

      if(isReachTarget === false){
        message = "You not reach the target, finish it?";
      }

      setGlobalModal({
        type: "confirm",
        title: "Finish",
        message: message,

        subMessage: subMessage || '',
        onOk: async () => {
          setIsCounting(!isCounting);
          // Lấy thời gian, nếu nhỏ hơn x thì cho thành false nếu thời gian > 2 tiếng hoặc xóa luôn nếu dưới

          const { lastSession, habitLog } = await dbService?.finishLastSession(
            currentFastSession?.id,
            now,
            duration,
            isValid,
          );
          if (habitLog) {
            updateHabit({
              habit_percent: habitLog?.habit_snap,
              shield: habitLog?.shield_snap,
            });
          }

          setCurrentFastSession(null);
          // Tính toán lưu giờ nhịn theo ngày của người dùng

          // 🌟 BƯỚC 3: Lưu toàn bộ các khúc đã bẻ nhỏ vào bảng daily_logs
          // Chạy vòng lặp để insert (Vì mối quan hệ là 1:N nên cứ thoải mái dội lệnh vào)
          if (isValid) {
            const parsedDays = splitSessionIntoDays(startTime, now);

            for (const dayData of parsedDays) {
              await dbService?.addDailyLogs({
                log_date: dayData.log_date,
                fast_id: currentFastSession.id,
                hours_in_day: dayData.hours_in_day,
                elapsed_times: dayData.elapsed_hours,
                hour_in_fast: parseFloat((duration / 60 / 60).toFixed(2)),
                // user_id, mood_level, note có thể bổ sung tùy thuộc form điền sau khi nhịn
              });
            }
          }
        },
      });
    } else {
      // Bắt đầu đếm
      setIsCounting(!isCounting);
      const now = new Date().getTime();
      // const now = new Date().getTime() - 50 * 60 * 60 * 1000;
      const newSession = await dbService?.startNewSession(now);
      setCurrentFastSession(newSession);
      setCounter(0);
      setStartTime(now);
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
      <SafeAreaView>
        <ScrollView keyboardShouldPersistTaps="handled">
          <View className="px-3">
            <HomeHeader />
            <View className="py-4 mt-4">
              <HomeTimeCounter isCounting={isCounting} counter={counter} currentFast={currentFastSession} />
            </View>

            <View className="py-4 mt-4 items-center justify-center">
              <SwapButton
                isCounting={isCounting}
                toggleCounting={toggleCounting}
                variant="primary"
              />
            </View>
            <View className="mt-12">
              {/* These indicators reflect general biological stages based on fasting duration. Always listen to your body and consult a healthcare professional before attempting prolonged fasts */}
              <HomeBodyProgress counter={counter} />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default HomeScreen;
