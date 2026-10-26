import { createDBService } from "@/database";
import { UserAchievement, UserAchievementMilestone } from "@/interfaces/db.type";

export type AchievementItem = {
  id: string;
  target: number | boolean;
  title: string;
  image?: string;
};
export type AchievementType = "progress" | "max" | "boolean";

export type Achievement = {
  id: string;
  input: AchievementInput;
  type: AchievementType;
  name: string;
  description: string;
  items: AchievementItem[];
};

export type AchievementInput =
| "fastInvalidCount"
  | "fastFailedCount"
  | "fastCompletedCount"
  | "duration"
  | "habitMax"
  | "habitGain"
  | "shieldGain"
  | "shieldFromFast"
  | "shieldFromMilestone"
  | "retainGain"
  | "retainCircleGain"
  | "streakGain"
  | "streakMax";

export type AchievementProgressUpdate = {
  userId: string;
  input:string
  achievementId: string;
  currentValue: number;
};

export type AchievementMilestoneUnlock = {
  userId: string;
  achievementId: string;
  achievementItemId: string;
  value: number | null;
};

export type CheckAchievementsResult = {
  progresses: AchievementProgressUpdate[];
  milestones: AchievementMilestoneUnlock[];
};

// Payload chứa giá trị thực tế của user
export type UserStats = Record<AchievementInput, number>;

export const checkAchievements = async (
  dbService: ReturnType<typeof createDBService>,
  userId:string,
  userStats: UserStats,
): Promise<CheckAchievementsResult> => {
  const progresses: AchievementProgressUpdate[] = [];
  const milestones: AchievementMilestoneUnlock[] = [];

  const {userAchievements, currentMilestones} = await getUserAchievements(dbService,userId, Object.keys(userStats) as AchievementInput[]);
  const unlockedIds = new Set(
  currentMilestones.map((milestone) => milestone.achievement_item_id),
);

  // ---------------------------------------------------------
  // 1. Group ACHIEVEMENTS by input
  // ---------------------------------------------------------

  const achievementsByInput = new Map<AchievementInput, Achievement[]>();

  for (const achievement of ACHIEVEMENTS) {
    const list = achievementsByInput.get(achievement.input) ?? [];

    list.push(achievement);
    achievementsByInput.set(achievement.input, list);
  }

  // ---------------------------------------------------------
  // 2. Current user achievement lookup
  // ---------------------------------------------------------

  const currentMap = new Map<string, UserAchievement>();

  for (const achievement of userAchievements) {
    currentMap.set(achievement.achievement_id, achievement);
  }

  // ---------------------------------------------------------
  // 3. Process current event/stat changes
  // ---------------------------------------------------------

  for (const [input, rawValue] of Object.entries(userStats)) {
    if (rawValue === undefined || rawValue === null) {
      continue;
    }

    const matchingAchievements = achievementsByInput.get(input as AchievementInput);

    if (!matchingAchievements?.length) {
      continue;
    }

    // -------------------------------------------------------
    // 4. Process all matchingAchievements using this input
    // -------------------------------------------------------

    for (const achievement of matchingAchievements) {
      const current = currentMap.get(achievement.id);
      const currentValue = current?.current_value ?? 0;

      let newValue: number | null = null;

      // -----------------------------------------------------
      // PROGRESS
      // Accumulate value
      // -----------------------------------------------------

      if (achievement.type === "progress") {
        if (typeof rawValue !== "number") {
          continue;
        }

        newValue = currentValue + rawValue;
      }

      // -----------------------------------------------------
      // MAX
      // Keep the highest value ever reached
      // -----------------------------------------------------
      else if (achievement.type === "max") {
        if (typeof rawValue !== "number") {
          continue;
        }

        newValue = Math.max(currentValue, rawValue);
      }

      // -----------------------------------------------------
      // BOOLEAN
      // One-time achievement/statistic
      // -----------------------------------------------------
      else if (achievement.type === "boolean") {
        if (typeof rawValue !== "boolean") {
          continue;
        }

        // Already achieved
        if (currentValue >= 1) {
          continue;
        }

        // Not achieved yet
        if (!rawValue) {
          continue;
        }

        newValue = 1;
      }

      // Unknown type
      else {
        continue;
      }

      if (newValue === null) {
        continue;
      }

      // -----------------------------------------------------
      // 5–6. Store new statistic/progress (only when changed)
      // -----------------------------------------------------

      if (newValue !== currentValue) {
        progresses.push({
          userId,
          input: achievement.input,
          achievementId: achievement.id,
          currentValue: newValue,
        });
      }

      // Vẫn kiểm tra mốc khi giá trị không đổi: mốc mới thêm vào có target
      // thấp hơn kỷ lục cũ (VD longest_fast_18 khi đã từng nhịn 24h) phải được mở.

      // -----------------------------------------------------
      // 7. Check milestones
      // -----------------------------------------------------

      if (!achievement.items.length) {
        continue;
      }

      for (const item of achievement.items) {
        // Already unlocked
        if (unlockedIds.has(item.id)) {
          continue;
        }

        // Numeric milestone
        if (typeof item.target === "number") {
          if (newValue >= item.target) {
            milestones.push({
              userId,
              achievementId: achievement.id,
              achievementItemId: item.id,
              value: newValue,
            });
          }
        }

        // Boolean milestone
        else if (typeof item.target === "boolean") {
          if (item.target === true && newValue === 1) {
            milestones.push({
              userId,
              achievementId: achievement.id,
              achievementItemId: item.id,
              value: null,
            });
          }
        }
      }
    }
  }

  return {
    progresses,
    milestones,
  };
};

export const getUserAchievements = async (
 dbService: ReturnType<typeof createDBService>,
  userId: string,
  inputString?: AchievementInput[]
): Promise<{
  userAchievements: UserAchievement[];
  currentMilestones: UserAchievementMilestone[];
}> => {
  const userAchievements = await dbService.getUserAchievements(userId, inputString);

  const currentMilestones = await dbService.getUserMilestones(userId);

  return {
    userAchievements,
    currentMilestones,
  };
};

const SECONDS_IN_HOUR = 60 * 60;

/**
 * Tạo danh sách mốc với id `${prefix}_${n}` (giữ nguyên id cũ để không mất tiến độ).
 * `scale` đổi n sang đơn vị lưu trữ (VD giờ → giây).
 */
const steps = (
  prefix: string,
  targets: number[],
  title: (n: number) => string,
  scale = 1,
): AchievementItem[] =>
  targets.map((n) => ({
    id: `${prefix}_${n}`,
    target: n * scale,
    title: title(n),
  }));

// Nhịp tham chiếu: 16:8 mỗi ngày ≈ 1 phiên, +3 habit, ~16 giờ/ngày.
// Mốc đầu đạt trong tuần đầu, mốc cuối cần ~1–2 năm duy trì.
export const ACHIEVEMENTS: Achievement[] = [
  // ---------------------------------------------------------
  // Statistics
  // ---------------------------------------------------------

  {
    id: "fasting_hours",
    name: "Total Fasting",
    description: "Total number of hours spent fasting.",
    input: "duration",
    type: "progress",
    items: steps(
      "fasting_hours",
      [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
      (n) => `${n.toLocaleString()} fasting hours`,
      SECONDS_IN_HOUR,
    ),
  },

  {
    id: "invalid_fasts",
    name: "Invalid Fasts",
    description: "Total number of invalid fasting sessions.",
    input: "fastInvalidCount",
    type: "progress",
    items: [],
  },
  {
    id: "failed_fasts",
    name: "Failed Fasts",
    description: "Total number of failed fasting sessions.",
    input: "fastFailedCount",
    type: "progress",
    items: [],
  },
  {
    id: "completed_fasts",
    name: "Completed Fasts",
    description: "Total number of completed fasting sessions.",
    input: "fastCompletedCount",
    type: "progress",
    items: steps(
      "completed_fasts",
      [1, 3, 5, 10, 25, 50, 100, 200, 365, 500, 1000],
      (n) => (n === 1 ? "Complete your first fast" : `Complete ${n} fasts`),
    ),
  },

  {
    id: "active_days",
    name: "Active Days",
    description: "Number of days you actively use the app.",
    input: "streakGain",
    type: "progress",
    items: steps(
      "active_days",
      [7, 30, 100, 200, 365, 730],
      (n) => `${n} active days`,
    ),
  },

  {
    id: "habit",
    name: "Habit",
    description: "Current fasting habit score.",
    input: "habitMax",
    type: "max",
    items: steps("habit", [10, 30, 50, 70, 100], (n) => `Reach ${n} habit`),
  },

  // ---------------------------------------------------------
  // Records
  // ---------------------------------------------------------

  {
    id: "longest_fast",
    name: "Longest Fast",
    description: "Longest fasting session ever completed.",
    input: "duration",
    type: "max",
    // Dừng ở 72h: nhịn lâu hơn nên có giám sát y tế
    items: steps(
      "longest_fast",
      [16, 18, 20, 24, 36, 48, 72],
      (n) => `Complete a ${n}-hour fast`,
      SECONDS_IN_HOUR,
    ),
  },

  {
    id: "max_streak",
    name: "Longest Streak",
    description: "Longest fasting streak ever achieved.",
    input: "streakMax",
    type: "max",
    items: steps(
      "max_streak",
      [3, 7, 14, 30, 60, 100, 180, 365],
      (n) => `Reach a ${n}-day streak`,
    ),
  },

  // ---------------------------------------------------------
  // Shields & Retain
  // ---------------------------------------------------------

  {
    id: "total_shields",
    name: "Total Shields",
    description: "Total number of shields earned.",
    input: "shieldGain",
    type: "progress",
    items: steps(
      "total_shields",
      [1, 5, 10, 25, 50, 100],
      (n) => (n === 1 ? "Earn your first shield" : `Earn ${n} shields`),
    ),
  },

  {
    id: "retain_circles",
    name: "Retain Master",
    description: "Retain circles completed while your habit is full.",
    input: "retainCircleGain",
    type: "progress",
    // Mỗi vòng ≈ 8–9 phiên 16h ở habit 100%
    items: steps(
      "retain_circles",
      [1, 3, 5, 10, 25],
      (n) =>
        n === 1 ? "Complete your first retain circle" : `Complete ${n} retain circles`,
    ),
  },
];
