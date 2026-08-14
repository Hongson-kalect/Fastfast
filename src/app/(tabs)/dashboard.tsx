import { FastLevelBarChart } from "@/components/dashboard/FastLevelChart";
import { GoalCard } from "@/components/dashboard/GoalCard";
import DashboardHeader from "@/components/dashboard/Header";
import { StatisticsSection } from "@/components/dashboard/StatisticSession";
import WeightLineChart from "@/components/dashboard/WeightLineChart";
import { ThemedView } from "@/components/themed-view";
import {
  CHART_RANGES,
  ChartRangeConfig,
  ChartRangeKey,
} from "@/constants/data";
import { FastStatsSummary } from "@/database/shema/fast_sessions";
import { useDBService } from "@/hooks/useDBService";
import { useAppStore } from "@/stores/appStore";
import { getBucketKey, initChartData } from "@/util/dashboard/utils";
import { splitSessionIntoDays } from "@/util/home/timespliter";
import { getLocalTodayStr, getStartDateFromRange } from "@/util/timer";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StatusBar, useWindowDimensions, View } from "react-native";

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
  >(initChartData(chartType));

  const getWeightData = async () => {
    console.log(chartDayRange);
    return dbService?.getWeightLogs(chartDayRange);
  };

  const getDayFastData = async () => {
    return dbService?.getDailyLogs(chartDayRange);
  };

  const [fastStatistics, setFastStatistics] = useState<FastStatsSummary>({
    above_16: 0,
    above_20: 0,
    above_24: 0,
    above_36: 0,
    above_48: 0,
    above_72: 0,
    avg_hours: 0,
    max_hours: 0,
    total_hours: 0,
    total_sessions: 0,
  });

  const getFastStatsSummary = async () => {
    return dbService?.getFastStatsSummary();
  };

  const refreshData = async () => {
    const dayPointer = new Date(getStartDateFromRange(chartRange)).getTime(); // Bao gồm ngày hôm nay

    const [weights, dayFasts, fastStatisticsDB] = await Promise.all([
      getWeightData(),
      getDayFastData(),
      getFastStatsSummary(),
    ]);

    const weightMap: Record<string, number> = {};
    const fastMap: Record<string, number> = {};

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

    setWeightData(weightsArr);
    setFastStatistics(fastStatisticsDB);
  };

  useEffect(() => {
    refreshData();
  }, [chartRange, currentFastSession, weight]);

  return (
    <ThemedView className="flex-1 bg-main">
      <View
        style={{ paddingTop: StatusBar.currentHeight || 0 }}
        className="h-full w-full"
      >
        <ScrollView
          scrollEnabled={enableScroll}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="px-3">
            <DashboardHeader />
            <View className="mt-4">
              <GoalCard />
            </View>

            {/* 4. BIỂU ĐỒ 2: XU HƯỚNG CÂN NẶNG (LINE CHART PLACEHOLDER) */}
            {/* <DashboardOptions /> */}

            <WeightLineChart
              onInteractionStart={() => setEnableScroll(false)}
              onInteractionEnd={() => setEnableScroll(true)}
              layout={{ width: width - 24, height: 200 }}
              data={weightData}
            />

            <FastLevelBarChart fastStatistics={fastStatistics} />

            {/* 3. BIỂU ĐỒ 1: TỔNG SỐ GIỜ NHỊN (BAR CHART PLACEHOLDER) */}
            {/*  */}

            {/* 2. QUICK STATS (Thống kê nhanh dạng số) */}
            <StatisticsSection fastStatistics={fastStatistics} />
          </View>
        </ScrollView>
      </View>
    </ThemedView>
  );
};

export default DashboardScreen;
