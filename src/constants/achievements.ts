import { UserAchievement } from "@/interfaces/db.type";

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
  achievementId: string;
  currentValue: number;
};

export type AchievementMilestoneUnlock = {
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

export const checkAchievements = (
  userStats: UserStats,
  userAchievements: UserAchievement[],
  unlockedIds: Set<string>,
): CheckAchievementsResult => {
  const progresses: AchievementProgressUpdate[] = [];
  const milestones: AchievementMilestoneUnlock[] = [];

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

    const ACHIEVEMENTS = achievementsByInput.get(input as AchievementInput);

    if (!ACHIEVEMENTS?.length) {
      continue;
    }

    // -------------------------------------------------------
    // 4. Process all ACHIEVEMENTS using this input
    // -------------------------------------------------------

    for (const achievement of ACHIEVEMENTS) {
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

      // -----------------------------------------------------
      // 5. Nothing changed
      // -----------------------------------------------------

      if (newValue === null || newValue === currentValue) {
        continue;
      }

      // -----------------------------------------------------
      // 6. Store new statistic/progress
      // -----------------------------------------------------

      progresses.push({
        achievementId: achievement.id,
        currentValue: newValue,
      });

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

const SECONDS_IN_HOUR = 60 * 60;
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
    items: [
      {
        id: "fasting_hours_10",
        target: 10 * SECONDS_IN_HOUR,
        title: "10 fasting hours",
      },
      {
        id: "fasting_hours_50",
        target: 50 * SECONDS_IN_HOUR,
        title: "50 fasting hours",
      },
      {
        id: "fasting_hours_100",
        target: 100 * SECONDS_IN_HOUR,
        title: "100 fasting hours",
      },
    ],
  },

  {
    id: "invalid_fasts",
    name: "Invalid Fasts",
    description: "Total number of invalid fasting sessions.",
    input: "fastInvalidCount",
    type: "progress",
    items: [
    ],
  },
  {
    id: "failed_fasts",
    name: "Failed Fasts",
    description: "Total number of failed fasting sessions.",
    input: "fastFailedCount",
    type: "progress",
    items: [
    ],
  },
  {
    id: "completed_fasts",
    name: "Completed Fasts",
    description: "Total number of completed fasting sessions.",
    input: "fastCompletedCount",
    type: "progress",
    items: [
      {
        id: "completed_fasts_1",
        target: 1,
        title: "Complete first fasts",
      },
      {
        id: "completed_fasts_5",
        target: 5,
        title: "Complete 5 fasts",
      },
      {
        id: "completed_fasts_10",
        target: 10,
        title: "Complete 10 fasts",
      },
      {
        id: "completed_fasts_50",
        target: 50,
        title: "Complete 50 fasts",
      },
    ],
  },

  {
    id: "active_days",
    name: "Active Days",
    description: "Number of days you actively use the app.",
    input: "streakGain",
    type: "progress",
    items: [],
  },

  {
    id: "habit",
    name: "Habit",
    description: "Current fasting habit score.",
    input: "habitMax",
    type: "max",
    items: [
      {
        id: "habit_30",
        target: 30,
        title: "Reach 30 habit",
      },
      {
        id: "habit_70",
        target: 70,
        title: "Reach 70 habit",
      },
      {
        id: "habit_100",
        target: 100,
        title: "Reach 100 habit",
      },
    ],
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
    items: [
      {
        id: "longest_fast_16",
        target: 16 * SECONDS_IN_HOUR,
        title: "Complete a 16-hour fast",
      },
      {
        id: "longest_fast_24",
        target: 24 * SECONDS_IN_HOUR,
        title: "Complete a 24-hour fast",
      },
      {
        id: "longest_fast_36",
        target: 36 * SECONDS_IN_HOUR,
        title: "Complete a 36-hour fast",
      },
      {
        id: "longest_fast_48",
        target: 48 * SECONDS_IN_HOUR,
        title: "Complete a 48-hour fast",
      },
      {
        id: "longest_fast_72",
        target: 72 * SECONDS_IN_HOUR,
        title: "Complete a 72-hour fast",
      },
    ],
  },

  {
    id: "max_streak",
    name: "Longest Streak",
    description: "Longest fasting streak ever achieved.",
    input: "streakMax",
    type: "max",
    items: [
      {
        id: "max_streak_7",
        target: 7,
        title: "Reach a 7-day streak",
      },
      {
        id: "max_streak_30",
        target: 30,
        title: "Reach a 30-day streak",
      },
      {
        id: "max_streak_100",
        target: 100,
        title: "Reach a 100-day streak",
      },
    ],
  },

  {
    id: "total_shields",
    name: "Total Shields",
    description: "Total number of shields earned.",
    input: "shieldGain",
    type: "progress",
    items: [],
  },
];
