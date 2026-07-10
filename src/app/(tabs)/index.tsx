import HomeBodyProgress from "@/components/home/BodyProgress";
import HomeHeader from "@/components/home/Header";
import { SwapButton } from "@/components/home/SwapButton";
import HomeTimeCounter from "@/components/home/TimeCounter";
import { ThemedText } from "@/components/themed-text";
import { DailyNote, FastSession } from "@/interfaces/db.type";
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
  const [startTime, setStartTime] = useState<number | null>(null);
  const [lastSession, setLastSession] = useState<FastSession | null>(null);
  const [todayNote, setTodayNote] = useState<DailyNote | null>(null);

  const { setGlobalModal } = useModalStore();

  const { dbService } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);

  const [isCounting, setIsCounting] = useState(false);
  const toggleCounting = async () => {
    //Kết thúc đếm
    if (isCounting && startTime && lastSession) {
      setGlobalModal({
        type: "confirm",
        title: "Finish",
        message: "Are you sure you want to finish your session?",
        onOk: async () => {
          setIsCounting(!isCounting);
          const now = new Date().getTime();
          const timeDiff = Math.floor(Math.abs(now - startTime) / 1000);
          // Lấy thời gian, nếu nhỏ hơn x thì cho thành false nếu thời gian > 2 tiếng hoặc xóa luôn nếu dưới
          if (timeDiff < 4 * 60 * 60) {
            // Clear current session by id
          } else {
            // Qua 4 giờ là ghi hết, có gì filter bằng where
            dbService?.finishLastSession(lastSession?.id, now, timeDiff);
            // Tính toán lưu giờ nhịn theo ngày của người dùng
            const parsedDays = splitSessionIntoDays(startTime, now);

            // 🌟 BƯỚC 3: Lưu toàn bộ các khúc đã bẻ nhỏ vào bảng daily_logs
            // Chạy vòng lặp để insert (Vì mối quan hệ là 1:N nên cứ thoải mái dội lệnh vào)
            for (const dayData of parsedDays) {
              await dbService?.addDailyLogs({
                log_date: dayData.log_date,
                fast_id: lastSession.id,
                hours_in_day: dayData.hours_in_day,
                hour_in_fast: parseFloat((timeDiff / 60 / 60).toFixed(2)),
                // user_id, mood_level, note có thể bổ sung tùy thuộc form điền sau khi nhịn
              });
            }
          }
        },
      });
    } else {
      // Bắt đầu đếm
      setIsCounting(!isCounting);
      const now = new Date().getTime() - 12 * 60 * 60 * 1000;
      dbService?.startNewSession(now);
      setCounter(12 * 60 * 60 * 1000);
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

  const detectLastSession = async () => {
    const lastSession = await dbService?.getLastFastSession();
    const allSession = await dbService?.getFastSessions();
    console.log("lastSession", lastSession, allSession);
    if (!lastSession || lastSession?.end_time) {
      // Nếu không có hoặc phiên cuối đã kết thúc
      setIsCounting(false);
    } else {
      setLastSession(lastSession);
      setIsCounting(true);
      setStartTime(lastSession.start_time);
    }
  };

  const detectTodayNote = async () => {
    const todayNote = await dbService?.getDailyNote();
    console.log("todayNote", todayNote);
    setTodayNote(todayNote || null);
  };

  useEffect(() => {
    if (!dbService) return;
    setIsLoading(false);
    detectLastSession();
    detectTodayNote();
  }, [dbService]);

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
        {isLoading && (
          <View className="flex-1 items-center justify-center absolute top-0 left-0">
            <ThemedText>Loading...</ThemedText>
          </View>
        )}
        <ScrollView keyboardShouldPersistTaps="handled">
          <View className="px-3">
            <HomeHeader />
            <View className="py-4 mt-4">
              <HomeTimeCounter isCounting={isCounting} counter={counter} />
            </View>

            <View className="py-4 mt-4 items-center justify-center">
              <SwapButton
                todayNote={todayNote}
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
