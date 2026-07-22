import DashboardOptions from "@/components/dashboard/DashboardOptions";
import { FastBarChart } from "@/components/dashboard/FastBarChart";
import DashboardHeader from "@/components/dashboard/Header";
import WeightLineChart from "@/components/dashboard/WeightLineChart";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useDBService } from "@/hooks/useDBService";
import { useAppStore } from "@/stores/appStore";
import { splitSessionIntoDays } from "@/util/home/timespliter";
import { getLocalTodayStr } from "@/util/timer";
import { useEffect, useState } from "react";
import {
  Animated,
  LayoutChangeEvent,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Tạo mảng thời gian 20 ngày liên tiếp (đếm ngược từ hôm nay)
export const MOCK_DASHBOARD_DATA = Array.from({ length: 20 }).map(
  (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (19 - index)); // Sắp xếp từ xa nhất đến hôm nay
    const dateString = date.toISOString().split("T")[0]; // Định dạng YYYY-MM-DD

    // 1. Khởi tạo hiệu suất nhịn (Giờ nhịn ngẫu nhiên từ 14h đến 24h)
    const fastingHours = Math.floor(Math.random() * 11) + 14;

    // 2. Tạo logic cân nặng với các điều kiện đặc biệt của bạn:
    // Xu hướng cân nặng giả định giảm dần từ 72kg về 70kg
    const baseWeight =
      Math.floor((72 - index * 0.2 + (Math.random() * 0.4 - 0.2)) * 10) / 10;
    let weightLogs: number | null = Number(baseWeight.toFixed(1));

    // Điều kiện: 2 ngày không có dữ liệu (Ví dụ ngày index 5 và index 12)
    // if (
    //   [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].includes(
    //     index,
    //   )
    // ) {
    //   weightLogs = null;
    // }
    // Điều kiện: 2 ngày có 2 lần nhập dữ liệu (Ví dụ ngày index 8 và index 15)

    return {
      x: dateString,
      y: baseWeight,
    };
  },
);

type ChartValue = {
  days?: number;
  showType?: "days" | "week" | "month";
};
type ChartType = "week" | "month" | "3month" | "6month" | "year" | "all";

const chartType: { [key in ChartType]: ChartValue } = {
  week: {
    days: 7,
    showType: "days",
  },
  month: {
    days: 30,
    showType: "days",
  },
  "3month": {
    days: 90,
    showType: "week",
  },
  "6month": {
    days: 180,
    showType: "week",
  },
  year: {
    days: 365,
    showType: "month",
  },
  all: {
    days: undefined,
    showType: undefined,
  },
};

const initChartData = (range: number) => {
  const dayPointer = new Date(getLocalTodayStr());
  dayPointer.setDate(dayPointer.getDate() - range + 1); // Bao gồm ngày hôm nay

  const res = [];

  for (let i = 0; i < range; i++) {
    const day = getLocalTodayStr(dayPointer);
    res.push({
      x: day,
      y: 0,
    });
    dayPointer.setDate(dayPointer.getDate() + 1);
  }

  return res;
};

const DashboardScreen = () => {
  const [layout, setLayout] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const { width } = useWindowDimensions();
  const { theme, currentFastSession, weight, settings } = useAppStore();
  const dbService = useDBService();
  const [enableScroll, setEnableScroll] = useState(true);

  const [chartRange, setChartRange] = useState<number>(
    settings?.chart_range || 7,
  );
  const [weightData, setWeightData] = useState<{ x: string; y: number }[]>(
    initChartData(chartRange),
  );
  const [dayFastData, setDayFastData] = useState<{ x: string; y: number }[]>(
    initChartData(chartRange),
  );

  const getWeightData = async () => {
    return dbService?.getWeightLogs(chartRange);
  };

  const getDayFastData = async () => {
    return dbService?.getDailyLogs(chartRange);
  };

  const refreshData = async () => {
    const dayPointer = new Date(getLocalTodayStr());
    dayPointer.setDate(dayPointer.getDate() - chartRange + 1); // Bao gồm ngày hôm nay

    const [weights, dayFasts] = await Promise.all([
      getWeightData(),
      getDayFastData(),
    ]);

    console.log(weights, dayFasts);

    const weightMap: { [day: string]: number } = {};
    const fastMap: { [day: string]: number } = {};
    const weightsArr = [] as { x: string; y: number }[];
    const dayFastsArr = [] as { x: string; y: number }[];

    weights.forEach((item) => {
      weightMap[item.log_date] = item.weight;
    });
    dayFasts.forEach((item) => {
      const currentFast = fastMap[item.log_date] || 0;
      fastMap[item.log_date] = currentFast + item.hours_in_day;
    });

    if (currentFastSession) {
      const fasts = splitSessionIntoDays(
        currentFastSession.start_time,
        currentFastSession.end_time || new Date().getTime(),
      );

      for (const fast of fasts) {
        const currentFast = fastMap[fast.log_date] || 0;
        fastMap[fast.log_date] = currentFast + fast.hours_in_day;
      }
    }

    for (let i = 0; i < chartRange; i++) {
      const day = getLocalTodayStr(dayPointer);

      weightsArr.push({
        x: day,
        y: weightMap[day] || weightsArr.at(-1)?.y || 0,
      });

      dayFastsArr.push({
        x: day,
        y: Math.round(fastMap[day]) || 0,
      });
      dayPointer.setDate(dayPointer.getDate() + 1);
    }

    console.log("chart data ", weightsArr, dayFastsArr);

    setWeightData(weightsArr);
    setDayFastData(dayFastsArr);
  };

  // Khởi tạo giá trị scale cho hiệu ứng bấm FAB
  const scaleValue = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.9, // Thu nhỏ lại 10% khi nhấn giữ
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1, // Trở về kích thước cũ khi nhấc tay
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleOpenAddWeightModal = () => {
    // 💡 Logic mở Bottom Sheet hoặc Modal nhập cân nặng của bạn ở đây
    console.log("Mở modal cập nhật cân nặng...");
  };

  const detectCounterLayout = (e: LayoutChangeEvent) => {
    if (layout) return;
    const { width, height } = e.nativeEvent.layout;
    setLayout({ width: width + 10, height: height + 42 });
  };

  useEffect(() => {
    refreshData();
  }, [chartRange, currentFastSession, weight]);

  return (
    <ThemedView className="flex-1 bg-main">
      <SafeAreaView>
        <ScrollView
          scrollEnabled={enableScroll}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="px-3">
            <DashboardHeader />

            {/* 4. BIỂU ĐỒ 2: XU HƯỚNG CÂN NẶNG (LINE CHART PLACEHOLDER) */}
            <DashboardOptions />
            <View className=" rounded-3xl my-4">
              <View className="flex-row justify-between items-center mb-1">
                <View className="items-center justify-center gap-2">
                  <ThemedText className="text-white!">Weight</ThemedText>
                </View>
              </View>

              {/* Hộp đen đại diện cho Line Chart */}
              <View
                style={{ height: 200 }}
                className="bg-[#1A1C24] py-4 px-2 border border-dashed border-gray-700 rounded-lg"
              >
                <WeightLineChart
                  onInteractionStart={() => setEnableScroll(false)}
                  onInteractionEnd={() => setEnableScroll(true)}
                  layout={{ width: width - 24, height: 200 }}
                  data={weightData}
                />
              </View>
            </View>

            {/* 3. BIỂU ĐỒ 1: TỔNG SỐ GIỜ NHỊN (BAR CHART PLACEHOLDER) */}
            <View className="rounded-3xl my-6">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-white font-semibold text-base">
                  Hiệu suất nhịn ăn
                </Text>
              </View>

              {/* Hộp đen đại diện cho Bar Chart */}
              <View
                style={{ height: 200 }}
                className="bg-[#1A1C24] py-4 px-2 border border-dashed border-gray-700 rounded-lg"
              >
                <FastBarChart data={dayFastData} />
              </View>
            </View>

            {/* 2. QUICK STATS (Thống kê nhanh dạng số) */}
            <Text className="text-white font-semibold text-base">
              Statistics
            </Text>
            <View className="flex-row items-center justify-between flex-wrap my-4 gap-4">
              {/* Card 1: Streak */}
              <View className="bg-black p-4 rounded-2xl flex-1 border border-gray-800 shadow shadow-gray-800">
                <Text className="text-gray-400 text-xs mb-1">
                  Streak hiện tại
                </Text>
                <Text className="text-white text-xl font-semibold">
                  5 ngày 🔥
                </Text>
              </View>

              {/* Card 2: Total Hours */}
              <View className="bg-black p-4 rounded-2xl flex-1 border border-gray-800 shadow shadow-gray-800">
                <Text className="text-gray-400 text-xs mb-1">
                  Tổng giờ nhịn
                </Text>
                <Text className="text-white text-xl font-semibold">
                  128 giờ
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between flex-wrap mb-6 gap-4">
              {/* Card 1: Streak */}
              <View className="bg-black p-4 rounded-2xl flex-1 border border-gray-800 shadow shadow-gray-800">
                <Text className="text-gray-400 text-xs mb-1">Max Streak</Text>
                <Text className="text-white text-xl font-semibold">
                  105 ngày
                </Text>
              </View>

              {/* Card 2: Total Hours */}
              <View className="bg-black p-4 rounded-2xl flex-1 border border-gray-800 shadow shadow-gray-800">
                <Text className="text-gray-400 text-xs mb-1">
                  Trung bình giờ nhịn
                </Text>
                <Text className="text-white text-xl font-semibold">
                  128 giờ
                </Text>
              </View>
            </View>

            <Text className="text-white font-semibold text-base">
              Fast level
            </Text>
            <View className="flex-row items-center justify-between flex-wrap my-4 gap-2">
              {/* Card 1: Streak */}
              <View className="bg-black p-2 rounded-2xl flex-1 border border-gray-800 shadow shadow-gray-800">
                <Text className="text-gray-400 text-xs mb-1">16+</Text>
                <Text className="text-white text-center text-xl font-semibold">
                  5
                </Text>
              </View>

              {/* Card 2: Total Hours */}
              <View className="bg-black p-2 rounded-2xl flex-1 border border-gray-800 shadow shadow-gray-800">
                <Text className="text-gray-400 text-xs mb-1">24+</Text>
                <Text className="text-white text-center text-xl font-semibold">
                  128
                </Text>
              </View>
              <View className="bg-black p-2 rounded-2xl flex-1 border border-gray-800 shadow shadow-gray-800">
                <Text className="text-gray-400 text-xs mb-1">36+</Text>
                <Text className="text-white text-center text-xl font-semibold">
                  5
                </Text>
              </View>

              {/* Card 2: Total Hours */}
              <View className="bg-black p-2 rounded-2xl flex-1 border border-gray-800 shadow shadow-gray-800">
                <Text className="text-gray-400 text-xs mb-1">48+</Text>
                <Text className="text-white text-center text-xl font-semibold">
                  128
                </Text>
              </View>
              <View className="bg-black p-2 rounded-2xl flex-1 border border-gray-800 shadow shadow-gray-800">
                <Text className="text-gray-400 text-xs mb-1">72+</Text>
                <Text className="text-white text-center text-xl font-semibold">
                  128
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
};

export default DashboardScreen;
