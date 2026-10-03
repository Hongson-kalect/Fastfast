import { FastLevelBarChart } from "@/components/dashboard/FastLevelChart";
import { GoalCard } from "@/components/dashboard/GoalCard";
import DashboardHeader from "@/components/dashboard/Header";
import { StatisticsSection } from "@/components/dashboard/StatisticSession";
import WeightLineChart from "@/components/dashboard/WeightLineChart";
import { ThemedView } from "@/components/themed-view";
import { getUserAchievements } from "@/constants/achievements";
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
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, StatusBar, useWindowDimensions, View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";

const DashboardScreen = () => {
  const { width } = useWindowDimensions();
  const { currentFastSession, settings } = useAppStore();
  const { userProfile } = useAppStore();

  const dbService = useDBService();
  const [enableScroll, setEnableScroll] = useState(true);

  const chartRange: ChartRangeKey = settings?.chart_range || "7d";

  const chartType =
    CHART_RANGES.find((item) => item.key === chartRange) ||
    CHART_RANGES[0];

  const chartDayRange = Math.ceil(
    (new Date(getLocalTodayStr()).getTime() -
      new Date(getStartDateFromRange(chartRange)).getTime()) /
      86400000,
  );

  const [weightData, setWeightData] = useState<
    { key: string; x: string; fast: number; weight: number | null }[]
  >(initChartData(chartType));

  const [fastStatistics, setFastStatistics] =
    useState<FastStatsSummary>({
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

  const [hasUnclamMilestones, setHasUnclamMilestones] =
    useState(false);

  const refreshData = useCallback(async () => {
    const [weights, dayFasts, fastStatisticsDB] = await Promise.all([
      dbService?.getWeightLogs(chartDayRange),
      dbService?.getDailyLogs(chartDayRange),
      dbService?.getFastStatsSummary(),
    ]);

    const weightMap: Record<string, number> = {};
    const fastMap: Record<string, number> = {};

    weights.forEach((item) => {
      const key = getBucketKey(
        new Date(item.log_date),
        chartType.unit,
      );

      weightMap[key] = item.weight;
    });

    dayFasts.forEach((item) => {
      const key = getBucketKey(
        new Date(item.log_date),
        chartType.unit,
      );

      fastMap[key] =
        (fastMap[key] ?? 0) + item.hours_in_day;
    });

    if (currentFastSession) {
      const fasts = splitSessionIntoDays(
        currentFastSession.start_time,
        currentFastSession.end_time ?? Date.now(),
        "fast_id",
      );

      fasts.forEach((fast) => {
        const key = getBucketKey(
          new Date(fast.log_date),
          chartType.unit,
        );

        fastMap[key] =
          (fastMap[key] ?? 0) + fast.hours_in_day;
      });
    }

    const weightsArr: {
      key: string;
      x: string;
      fast: number;
      weight: number | null;
    }[] = [];

    initChartData(chartType).forEach((item, index) => {
      let weight =
        weightMap[item.key] ??
        weightsArr[index - 1]?.weight ??
        null;

      if (
        !weight &&
        weights?.[0]?.log_date <= item.date
      ) {
        weight = weights[0].weight;
      }

      weightsArr.push({
        key: item.key,
        x: item.x,
        weight,
        fast: Math.round(fastMap[item.key] ?? 0),
      });
    });

    setWeightData(weightsArr);
    setFastStatistics(fastStatisticsDB);
  }, [
    dbService,
    chartDayRange,
    chartType,
    currentFastSession,
  ]);

  const refreshMilestones = useCallback(async () => {
    if (!userProfile) {
      setHasUnclamMilestones(false);
      return;
    }

    const { currentMilestones } = await getUserAchievements(
      dbService,
      userProfile.id,
    );

    const hasUnclaimed = currentMilestones.some(
      (milestone) => !milestone.is_confirmed,
    );

    setHasUnclamMilestones(hasUnclaimed);
  }, [dbService, userProfile]);

  useFocusEffect(
    useCallback(() => {
      const task = requestIdleCallback(async () => {
        await refreshData();
        await refreshMilestones();
      });

      return () => {
        cancelIdleCallback(task);
      };
    }, [refreshData, refreshMilestones]),
  );

  return (
    <ThemedView className="flex-1 bg-background">
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
            <DashboardHeader
              hasUnclamMilestones={hasUnclamMilestones}
            />

            <Animated.View className="mt-3" layout={LinearTransition.duration(300)}>
              <GoalCard />
            </Animated.View>

            <WeightLineChart
              onInteractionStart={() => setEnableScroll(false)}
              onInteractionEnd={() => setEnableScroll(true)}
              data={weightData}
            />

            <FastLevelBarChart
              fastStatistics={fastStatistics}
            />

            <StatisticsSection
              fastStatistics={fastStatistics}
            />
          </View>
        </ScrollView>
      </View>
    </ThemedView>
  );
};

export default DashboardScreen;
