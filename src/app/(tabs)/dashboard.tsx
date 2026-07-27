import DashboardOptions from "@/components/dashboard/DashboardOptions";
import DashboardHeader from "@/components/dashboard/Header";
import WeightLineChart from "@/components/dashboard/WeightLineChart";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  CHART_RANGES,
  ChartRangeConfig,
  ChartRangeKey,
} from "@/constants/data";
import { FastCountType } from "@/database/shema/fast_sessions";
import { useDBService } from "@/hooks/useDBService";
import { useAppStore } from "@/stores/appStore";
import { getBucketKey, initChartData } from "@/util/dashboard/utils";
import { splitSessionIntoDays } from "@/util/home/timespliter";
import { getLocalTodayStr, getStartDateFromRange } from "@/util/timer";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DashboardScreen = () => {
  const { width } = useWindowDimensions();
  const { theme, currentFastSession, weight, settings } = useAppStore();
  const dbService = useDBService();
  const [enableScroll, setEnableScroll] = useState(true);

  const chartRange = useMemo<ChartRangeKey>(() => {
    return settings?.chart_range || "7d";
  }, [settings?.chart_range]);

  const chartType = useMemo<ChartRangeConfig>(
    () => CHART_RANGES.find((r) => r.key === chartRange) || CHART_RANGES[0],
    [chartRange],
  );
  const chartDayRange = useMemo<number>(() => {
    return Math.ceil(
      (new Date(getLocalTodayStr()).getTime() -
        new Date(getStartDateFromRange(chartRange)).getTime()) /
        86400000,
    );
  }, [chartRange]);

  const [weightData, setWeightData] = useState<
    { key: string; x: string; fast: number; weight: number | null }[]
  >([]);
  const [dayFastData, setDayFastData] = useState<
    { key: string; x: string; y: number }[]
  >(initChartData(chartType));

  const getWeightData = async () => {
    console.log(chartDayRange);
    return dbService?.getWeightLogs(chartDayRange);
  };

  const getDayFastData = async () => {
    return dbService?.getDailyLogs(chartDayRange);
  };

  const [fastCount, setFastCount] = useState<FastCountType>({
    above_16: 0,
    above_20: 0,
    above_24: 0,
    above_36: 0,
    above_48: 0,
    above_72: 0,
  });

  const getFastCount = async () => {
    return dbService?.getFastCount();
  };

  const refreshData = async () => {
    const dayPointer = new Date(getStartDateFromRange(chartRange)).getTime(); // Bao gồm ngày hôm nay

    const [weights, dayFasts, fastCountDB] = await Promise.all([
      getWeightData(),
      getDayFastData(),
      getFastCount(),
    ]);

    const weightMap: Record<string, number> = {};
    const fastMap: Record<string, number> = {};

    console.log(weights, dayFasts);

    weights.forEach((item) => {
      const key = getBucketKey(new Date(item.log_date), chartType.unit);
      weightMap[key] = item.weight; // hoặc lấy latest nếu có nhiều record
    });

    dayFasts.forEach((item) => {
      const key = getBucketKey(new Date(item.log_date), chartType.unit);
      fastMap[key] = (fastMap[key] ?? 0) + item.hours_in_day;
    });

    if (currentFastSession) {
      const fasts = splitSessionIntoDays(
        currentFastSession.start_time,
        currentFastSession.end_time ?? Date.now(),
      );

      fasts.forEach((fast) => {
        const key = getBucketKey(new Date(fast.log_date), chartType.unit);
        fastMap[key] = (fastMap[key] ?? 0) + fast.hours_in_day;
      });
    }
    let weightsArr: {
      key: string;
      x: string;
      fast: number;
      weight: number | null;
    }[] = [];

    initChartData(chartType).map((item, index, arr) =>
      weightsArr.push({
        key: item.key,
        x: item.x,
        weight: (weightMap[item.key] ?? weightsArr[index - 1]?.weight) || null,
        fast: Math.round(fastMap[item.key] ?? 0),
      }),
    );

    for (let i = weightsArr.length - 1; i < 0; i--) {
      const item = weightsArr[i];
      if (item.weight === 0) {
        item.weight = weightsArr[i + 1]?.weight ?? 0;
      }
    }

    const dayFastsArr = initChartData(chartType).map((item) => ({
      key: item.key,
      x: item.x,
      y: Math.round(fastMap[item.key] ?? 0),
    }));

    console.log(weightsArr, dayFastsArr);

    setWeightData(weightsArr);
    setDayFastData(dayFastsArr);
    setFastCount(fastCountDB);
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
                style={{ height: 400 }}
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
            {/*  */}

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
                <Text className="text-gray-400 text-xs mb-1">{"16+"}</Text>
                <Text className="text-white text-center text-xl font-semibold">
                  {fastCount.above_16}
                </Text>
              </View>

              {/* Card 2: Total Hours */}
              <View className="bg-black p-2 rounded-2xl flex-1 border border-gray-800 shadow shadow-gray-800">
                <Text className="text-gray-400 text-xs mb-1">{"20+"}</Text>
                <Text className="text-white text-center text-xl font-semibold">
                  {fastCount.above_20}
                </Text>
              </View>
              <View className="bg-black p-2 rounded-2xl flex-1 border border-gray-800 shadow shadow-gray-800">
                <Text className="text-gray-400 text-xs mb-1">{"24+"}</Text>
                <Text className="text-white text-center text-xl font-semibold">
                  {fastCount.above_24}
                </Text>
              </View>

              {/* Card 2: Total Hours */}
              <View className="bg-black p-2 rounded-2xl flex-1 border border-gray-800 shadow shadow-gray-800">
                <Text className="text-gray-400 text-xs mb-1">{"36+"}</Text>
                <Text className="text-white text-center text-xl font-semibold">
                  {fastCount.above_36}
                </Text>
              </View>
              <View className="bg-black p-2 rounded-2xl flex-1 border border-gray-800 shadow shadow-gray-800">
                <Text className="text-gray-400 text-xs mb-1">{"48+"}</Text>
                <Text className="text-white text-center text-xl font-semibold">
                  {fastCount.above_48}
                </Text>
              </View>
              <View className="bg-black p-2 rounded-2xl flex-1 border border-gray-800 shadow shadow-gray-800">
                <Text className="text-gray-400 text-xs mb-1">{"72+"}</Text>
                <Text className="text-white text-center text-xl font-semibold">
                  {fastCount.above_72}
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
