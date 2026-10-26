import { StreakHero } from "@/components/dashboard/StreakHero";
import { TAB_BAR_SPACE } from "@/constants/design";
import { FastLevelBarChart } from "@/components/dashboard/FastLevelChart";
import { GoalCard } from "@/components/dashboard/GoalCard";
import DashboardHeader from "@/components/dashboard/Header";
import { StatisticsSection } from "@/components/dashboard/StatisticSession";
import WeightLineChart from "@/components/dashboard/WeightLineChart";
import { ThemedView } from "@/components/themed-view";
import { CHART_RANGES, ChartRangeKey } from "@/constants/data";
import { useDBService } from "@/hooks/useDBService";
import { useAppStore } from "@/stores/appStore";
import { ChartType, refreshDashboard } from "@/stores/dashboardAction";
import { useDashboardStore } from "@/stores/dashboardStore";
import { getLocalTodayStr, getStartDateFromRange } from "@/utils/timer";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DashboardScreen = () => {
  const { currentFastSession, settings, userProfile } = useAppStore();

  const dbService = useDBService();
  const [, setEnableScroll] = useState(true);

  const chartRange: ChartRangeKey = settings?.chart_range || "7d";

  const chartType =
    CHART_RANGES.find((item) => item.key === chartRange) || CHART_RANGES[0];

  const chartDayRange = Math.ceil(
    (new Date(getLocalTodayStr()).getTime() -
      new Date(getStartDateFromRange(chartRange)).getTime()) /
      86400000,
  );

  const { weightData: baseWeightData, fastStatistics } = useDashboardStore();
  const [weightData, setWeightData] = useState(() => {
    const data: ChartType[] = baseWeightData.map((item) => ({
      fast: 0,
      key: item.key,
      weight: 0,
      x: item.x,
    }));

    return data;
  });

  useEffect(() => {
    setWeightData(baseWeightData);
  }, [baseWeightData]);

  useFocusEffect(
    useCallback(() => {
      const task = requestIdleCallback(() => {
        Promise.all([refreshDashboard(dbService, chartType)]);
      });

      return () => {
        cancelIdleCallback(task);
      };
    }, [
      dbService,
      chartDayRange,
      chartType,
      currentFastSession,
      userProfile?.id,
    ]),
  );

  const inset = useSafeAreaInsets();

  return (
    <ThemedView
      style={{ paddingTop: inset.top, paddingBottom: inset.bottom }}
      className="flex-1 bg-background"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: TAB_BAR_SPACE,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <DashboardHeader />

        <View className="mt-5">
          <StreakHero />
        </View>

        <View className="mt-4">
          <GoalCard />
        </View>

        <Animated.View layout={LinearTransition.duration(200)}>
          <WeightLineChart
            onInteractionStart={() => setEnableScroll(false)}
            onInteractionEnd={() => setEnableScroll(true)}
            data={weightData}
          />

          {fastStatistics && (
            <>
              <FastLevelBarChart fastStatistics={fastStatistics} />
              <StatisticsSection fastStatistics={fastStatistics} />
            </>
          )}
        </Animated.View>
      </ScrollView>
    </ThemedView>
  );
};

export default DashboardScreen;
