import { ChartRangeConfig } from "@/constants/data";
import { FastStatsSummary } from "@/database/shema/fast_sessions";
import {
  FastSession,
  UserAchievement,
  UserAchievementMilestone,
} from "@/interfaces/db.type";
import { getBucketKey, initChartData } from "@/util/dashboard/utils";
import { splitSessionIntoDays } from "@/util/home/timespliter";

export type ChartType = {
  key: string;
  x: string;
  fast: number;
  weight: number | null;
};
export interface DashboardState {
  // Chart
  weightData: ChartType[];
  fastStatistics: FastStatsSummary | null;

  // Achievement
  hasUnclaimedMilestones: boolean;
  currentMilestones: UserAchievementMilestone[] | null;
  userAchievements: UserAchievement[];

  // Lifecycle
  isInitialized: boolean;
  isRefreshing: boolean;
  isHydrated: boolean;

  // Setters
  setWeightData: (data: ChartType[]) => void;
  setFastStatistics: (data: FastStatsSummary | null) => void;
  setHasUnclaimedMilestones: (value: boolean) => void;
  setCurrentMilestones: (value: UserAchievementMilestone[]) => void;
  setUserAchievements: (value: UserAchievement[]) => void;
  setInitialized: (value: boolean) => void;
  setRefreshing: (value: boolean) => void;

  // Reset
  reset: () => void;
}

// src/store/dashboardActions.ts

import { SQLiteDatabase } from "expo-sqlite";

import { createDBService } from "@/database";

import { getUserAchievements } from "@/constants/achievements";
import { useAppStore } from "./appStore";
import { useDashboardStore } from "./dashboardStore";

/**
 * Dữ liệu Dashboard được load từ SQLite.
 *
 * Đây là dữ liệu mà Zustand giữ trong RAM để Dashboard
 * có thể render ngay khi người dùng mở tab.
 */
export interface DashboardHydrationData {
  weightData: ChartType[];
  fastStatistics: FastStatsSummary | null;
  hasUnclaimedMilestones: boolean;
  currentMilestones: UserAchievementMilestone[] | null;
  userAchievements: UserAchievement[];
}

/**
 * Load dữ liệu chart từ SQLite và xử lý thành format
 * mà Dashboard sử dụng trực tiếp.
 */
async function loadChartData(
  db: SQLiteDatabase,
  chartType: ChartRangeConfig,
  currentFastSession: FastSession | null,
): Promise<{
  weightData: ChartType[];
  fastStatistics: FastStatsSummary | null;
}> {
  const dbService = createDBService(db);

  const [weights, dayFasts, fastStatisticsDB] = await Promise.all([
    dbService.getWeightLogs(chartType.day),
    dbService.getDailyLogs(chartType.day),
    dbService.getFastStatsSummary(),
  ]);

  const weightMap: Record<string, number> = {};
  const fastMap: Record<string, number> = {};

  weights.forEach((item) => {
    const key = getBucketKey(new Date(item.log_date), chartType.unit);

    weightMap[key] = item.weight;
  });

  dayFasts.forEach((item) => {
    const key = getBucketKey(new Date(item.log_date), chartType.unit);

    fastMap[key] = (fastMap[key] ?? 0) + item.hours_in_day;
  });

  /**
   * Current fast chưa chắc đã được ghi vào daily_logs,
   * nên cần cộng trực tiếp vào chart.
   */
  if (currentFastSession) {
    const fasts = splitSessionIntoDays(
      currentFastSession.start_time,
      currentFastSession.end_time ?? Date.now(),
      "fast_id",
    );

    fasts.forEach((fast) => {
      const key = getBucketKey(new Date(fast.log_date), chartType.unit);

      fastMap[key] = (fastMap[key] ?? 0) + fast.hours_in_day;
    });
  }

  const weightData: ChartType[] = [];

  initChartData(chartType).forEach((item, index) => {
    let weight = weightMap[item.key] ?? weightData[index - 1]?.weight ?? null;

    if (!weight && weights?.[0]?.log_date <= item.date) {
      weight = weights[0].weight;
    }

    weightData.push({
      key: item.key,
      x: item.x,
      weight,
      fast: Math.round(fastMap[item.key] ?? 0),
    });
  });

  return {
    weightData,
    fastStatistics: fastStatisticsDB,
  };
}

/**
 * Load trạng thái milestone của user.
 */
async function loadAchievementData(
  db: SQLiteDatabase,
  userId: string | null,
): Promise<{
  hasUnclaimedMilestones: boolean;
  userAchievements: UserAchievement[];
  currentMilestones: UserAchievementMilestone[];
}> {
  if (!userId) {
    return {
      hasUnclaimedMilestones: false,
      userAchievements: [],
      currentMilestones: [],
    };
  }

  const dbService = createDBService(db);

  const { currentMilestones, userAchievements } = await getUserAchievements(
    dbService,
    userId,
  );

  const hasUnclaimedMilestones = currentMilestones.some(
    (milestone) => !milestone.is_confirmed,
  );

  return {
    hasUnclaimedMilestones,
    userAchievements,
    currentMilestones,
  };
}

/**
 * Load toàn bộ dữ liệu Dashboard.
 *
 * Hàm này KHÔNG trực tiếp set Zustand.
 *
 * SQLite
 *   ↓
 * DB Service
 *   ↓
 * xử lý chart / milestone
 *   ↓
 * DashboardHydrationData
 */
export async function initializeDashboard(
  db: SQLiteDatabase,
  chartType: ChartRangeConfig,
): Promise<DashboardHydrationData> {
  const start = Date.now();

  const { userProfile, currentFastSession } = useAppStore.getState();

  const [chartData, mileStoneState] = await Promise.all([
    loadChartData(db, chartType, currentFastSession),
    loadAchievementData(db, userProfile?.id ?? null),
  ]);

  const data: DashboardHydrationData = {
    weightData: chartData.weightData,
    fastStatistics: chartData.fastStatistics,
    ...mileStoneState,
  };

  hydrateDashboard({
    weightData: chartData.weightData,
    fastStatistics: chartData.fastStatistics,
    ...mileStoneState,
  });

  console.log(
    "=> [Dashboard] Khởi tạo dữ liệu thành công!",
    Date.now() - start,
    "ms",
  );

  return data;
}

/**
 * Đẩy dữ liệu Dashboard đã load vào Zustand.
 *
 * initializeDashboard() chỉ đọc và xử lý dữ liệu.
 * hydrateDashboard() mới cập nhật RAM state.
 */
export function hydrateDashboard(data: DashboardHydrationData): void {
  useDashboardStore.setState({
    weightData: data.weightData,
    fastStatistics: data.fastStatistics,
    hasUnclaimedMilestones: data.hasUnclaimedMilestones,

    isHydrated: true,
    isRefreshing: false,
  });
}

/**
 * Khởi tạo Dashboard và hydrate Zustand.
 *
 * Đây là wrapper được gọi từ AppWrapper sau khi
 * App state đã hydrate và app đã được phép render.
 */
export async function initializeDashboardState(
  db: SQLiteDatabase,
  chartType: ChartRangeConfig,
): Promise<void> {
  const store = useDashboardStore.getState();

  if (store.isHydrated || store.isRefreshing) {
    return;
  }

  useDashboardStore.setState({
    isRefreshing: true,
  });

  try {
    const data = await initializeDashboard(db, chartType);

    hydrateDashboard(data);
  } catch (error) {
    console.error("=> [Dashboard] Khởi tạo dữ liệu thất bại:", error);

    useDashboardStore.setState({
      isRefreshing: false,
    });
  }
}

/**
 * Refresh dữ liệu Dashboard.
 *
 * Data cũ vẫn được giữ trong Zustand trong lúc
 * query DB để UI không bị nhấp nháy.
 */
export async function refreshDashboard(
  db: SQLiteDatabase,
  chartType: ChartRangeConfig,
): Promise<void> {
  const store = useDashboardStore.getState();

  if (store.isRefreshing) {
    return;
  }

  useDashboardStore.setState({
    isRefreshing: true,
  });

  try {
    const data = await initializeDashboard(db, chartType);

    hydrateDashboard(data);
  } catch (error) {
    console.error("=> [Dashboard] Refresh dữ liệu thất bại:", error);

    useDashboardStore.setState({
      isRefreshing: false,
    });
  }
}
