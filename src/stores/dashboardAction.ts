import { ChartRangeConfig } from "@/constants/data";
import { FastStatsSummary } from "@/database/shema/fast_sessions";
import {
  FastSession,
  UserAchievement,
  UserAchievementMilestone,
  WeightTarget,
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
  // GoalCard
  weightTarget: WeightTarget | null;

  // Chart
  weightData: ChartType[];
  fastStatistics: FastStatsSummary | null;

  // Achievement
  hasUnclaimedMilestones: boolean;
  currentMilestones: UserAchievementMilestone[] | null;
  userAchievements: UserAchievement[];
  achievements: Achievement[];

  // Lifecycle
  isInitialized: boolean;
  isRefreshing: boolean;
  isHydrated: boolean;

  // Setters
  setWeightTarget: (data: WeightTarget | null) => void;
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

import {
  Achievement,
  ACHIEVEMENTS,
  getUserAchievements,
} from "@/constants/achievements";
import { DBService } from "@/hooks/useDBService";
import { useAppStore } from "./appStore";
import { useDashboardStore } from "./dashboardStore";

/**
 * Dữ liệu Dashboard được load từ SQLite.
 *
 * Đây là dữ liệu mà Zustand giữ trong RAM để Dashboard
 * có thể render ngay khi người dùng mở tab.
 */
export interface DashboardHydrationData {
  weightTarget: WeightTarget | null;
  weightData: ChartType[];
  fastStatistics: FastStatsSummary | null;
  hasUnclaimedMilestones: boolean;
  currentMilestones: UserAchievementMilestone[] | null;
  userAchievements: UserAchievement[];
  achievements: Achievement[];
}

/**
 * Load dữ liệu chart từ SQLite và xử lý thành format
 * mà Dashboard sử dụng trực tiếp.
 */
async function loadChartData(
  dbService: DBService,
  chartType: ChartRangeConfig,
  currentFastSession: FastSession | null,
): Promise<{
  weightData: ChartType[];
  fastStatistics: FastStatsSummary | null;
}> {
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
   * Current fast đang chạy, chưa được ghi vào daily_logs,
   * nên cần cộng trực tiếp vào chart.
   */
  if (currentFastSession && !currentFastSession.end_time) {
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
  dbService: DBService,
  userId: string | null,
): Promise<{
  hasUnclaimedMilestones: boolean;
  userAchievements: UserAchievement[];
  currentMilestones: UserAchievementMilestone[];
  achievements: Achievement[];
}> {
  if (!userId) {
    return {
      hasUnclaimedMilestones: false,
      userAchievements: [],
      currentMilestones: [],
      achievements: ACHIEVEMENTS,
    };
  }

  const { currentMilestones, userAchievements } = await getUserAchievements(
    dbService,
    userId,
  );

  const notClampedMilestones = new Set();
  currentMilestones.forEach((milestone) => {
    if (!milestone.is_confirmed) {
      notClampedMilestones.add(milestone.achievement_id);
    }
  });

  const achievements = [...ACHIEVEMENTS].sort((a, b) => {
    const aIndex = notClampedMilestones?.has(a.id) ? 0 : 1;
    const bIndex = notClampedMilestones?.has(b.id) ? 0 : 1;
    return aIndex - bIndex;
  });

  const hasUnclaimedMilestones = currentMilestones.some(
    (milestone) => !milestone.is_confirmed,
  );

  return {
    hasUnclaimedMilestones,
    userAchievements,
    currentMilestones,
    achievements,
  };
}
export const loadActiveTarget = async (dbService: DBService) => {
  const activeTarget = await dbService?.getActiveWeightTarget();
  return activeTarget;
};

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
  dbService: DBService,
  chartType: ChartRangeConfig,
): Promise<DashboardHydrationData> {
  const start = Date.now();

  const { userProfile, currentFastSession } = useAppStore.getState();

  const [chartData, mileStoneState, activeTarget] = await Promise.all([
    loadChartData(dbService, chartType, currentFastSession),
    loadAchievementData(dbService, userProfile?.id ?? null),
    loadActiveTarget(dbService),
  ]);

  const data: DashboardHydrationData = {
    weightTarget: activeTarget,
    weightData: chartData.weightData,
    fastStatistics: chartData.fastStatistics,
    ...mileStoneState,
  };

  hydrateDashboard(data);

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
    weightTarget: data.weightTarget,
    weightData: data.weightData,
    fastStatistics: data.fastStatistics,

    hasUnclaimedMilestones: data.hasUnclaimedMilestones,
    currentMilestones: data.currentMilestones,
    userAchievements: data.userAchievements,
    achievements: data.achievements,

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
  db: DBService,
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
  db: DBService,
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

export const claimAchievementMilestone = async (
  dbService: DBService,
  userId: string,
  milestoneId: string,
  currentMilestones: UserAchievementMilestone[],
) => {
  const { setCurrentMilestones, setHasUnclaimedMilestones } =
    useDashboardStore.getState();

  const milestone = currentMilestones.find((item) => item.id === milestoneId);

  if (!milestone || milestone.is_confirmed) return;

  await dbService.confirmAchievementMilestone(milestone.id);

  const newMilestone = currentMilestones.map((item) => {
    if (item.id === milestoneId) {
      return {
        ...item,
        is_confirmed: 1,
      };
    }
    return item;
  });

  const hasUnclaimedMilestone = newMilestone.some((item) => !item.is_confirmed);

  setHasUnclaimedMilestones(hasUnclaimedMilestone);

  setCurrentMilestones(newMilestone);
};
