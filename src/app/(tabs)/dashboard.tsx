import { FastLevelBarChart } from "@/components/dashboard/FastLevelChart";
import { GoalCard } from "@/components/dashboard/GoalCard";
import DashboardHeader from "@/components/dashboard/Header";
import { StatisticsSection } from "@/components/dashboard/StatisticSession";
import WeightLineChart from "@/components/dashboard/WeightLineChart";
import { ThemedView } from "@/components/themed-view";
import { CHART_RANGES, ChartRangeKey } from "@/constants/data";
import { useDBService } from "@/hooks/useDBService";
import { useAppStore } from "@/stores/appStore";
import { refreshDashboard } from "@/stores/dashboardAction";
import { useDashboardStore } from "@/stores/dashboardStore";
import { getLocalTodayStr, getStartDateFromRange } from "@/util/timer";
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const DashboardScreen = () => {
  const { width } = useWindowDimensions();
  const { currentFastSession, settings } = useAppStore();
  const { userProfile } = useAppStore();

  const dbService = useDBService();
  const [enableScroll, setEnableScroll] = useState(true);

  const chartRange: ChartRangeKey = settings?.chart_range || "7d";

  const chartType =
    CHART_RANGES.find((item) => item.key === chartRange) || CHART_RANGES[0];

  const chartDayRange = Math.ceil(
    (new Date(getLocalTodayStr()).getTime() -
      new Date(getStartDateFromRange(chartRange)).getTime()) /
      86400000,
  );

  const { weightData, hasUnclaimedMilestones, fastStatistics } =
    useDashboardStore();

  const db = useSQLiteContext();
  useFocusEffect(
    useCallback(() => {
      const task = requestIdleCallback(() => {
        Promise.all([refreshDashboard(db, chartType)]);
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

  return (
    <ThemedView className="flex-1 bg-background">
      <SafeAreaView className="flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <DashboardHeader hasUnclamMilestones={hasUnclaimedMilestones} />

          <View className="mt-4">
            <GoalCard />
          </View>

          <Animated.View
            layout={LinearTransition.springify().damping(18).stiffness(180)}
          >
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
      </SafeAreaView>
    </ThemedView>
  );
};

export default DashboardScreen;
