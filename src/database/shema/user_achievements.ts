import { Achievement, AchievementInput, AchievementItem, AchievementMilestoneUnlock, AchievementProgressUpdate } from "@/constants/achievements";
import { UserAchievement, UserAchievementMilestone } from "@/interfaces/db.type";
import { uuidv7 } from "@/util/uuidv7";
import { SQLiteDatabase } from "expo-sqlite";

export const generateString = /*sql*/ `
CREATE TABLE IF NOT EXISTS user_achievement (
    id TEXT PRIMARY KEY,

    user_id TEXT NOT NULL,

    achievement_id TEXT NOT NULL,
    input TEXT NOT NULL,

    current_value REAL NOT NULL DEFAULT 0,

    unlocked_at TEXT DEFAULT NULL,
    is_deleted INTEGER DEFAULT 0, 

    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);
`;

export const itemGenerateString = /*sql*/ `
CREATE TABLE IF NOT EXISTS user_achievement_milestone (
    id TEXT PRIMARY KEY,

    user_id TEXT NOT NULL,

    achievement_id TEXT NOT NULL,
    achievement_item_id TEXT NOT NULL,

    value REAL DEFAULT NULL,

    is_deleted INTEGER DEFAULT 0, 
    unlocked_at TEXT NOT NULL DEFAULT (DATETIME('now')),

    is_confirmed INTEGER NOT NULL DEFAULT 0,
    reward TEXT DEFAULT NULL, --JSON

    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);
`;

export const getUserAchievements = async (
  db: SQLiteDatabase,
  userId: string,
  inputs?: AchievementInput[]
): Promise<UserAchievement[]> => {
  if (!inputs) {
   return db.getAllAsync<UserAchievement>(
    `
      SELECT *
      FROM user_achievement
      WHERE user_id = ?
        AND is_deleted = 0
    `,
    [userId]
  );
  }

  const placeholders = inputs.map(() => "?").join(", ");

  return db.getAllAsync<UserAchievement>(
    `
      SELECT *
      FROM user_achievement
      WHERE user_id = ?
        AND input IN (${placeholders})
        AND is_deleted = 0
    `,
    [userId, ...inputs]
  );
};

export const getUserArchievement = async (
  db: SQLiteDatabase,
  userId: string,
  achievementId: string
): Promise<UserAchievement| null> => {
  return db.getFirstAsync<UserAchievement>(
    `
      SELECT *
      FROM user_achievement
      WHERE user_id = ?
        AND achievement_id = ?
        AND is_deleted = 0
        LIMIT 1
    `,
    [userId, achievementId]
  );
};

export const getUserMilestones = async (db: SQLiteDatabase, userId: string): Promise<UserAchievementMilestone[]> => {
  return db.getAllAsync<UserAchievementMilestone>(
    `
      SELECT *
      FROM user_achievement_milestone
      WHERE user_id = ?
        AND is_deleted = 0
    `,
    [userId]
  );
};

export const updateMileStones = async (
  db: SQLiteDatabase,
  milestones: AchievementMilestoneUnlock[],
) => {
  if (!milestones.length) return;

  await db.withTransactionAsync(async () => {
    for (const milestone of milestones) {
      await db.runAsync(
        `INSERT INTO user_achievement_milestone (
          id,
          user_id,
          achievement_id,
          achievement_item_id,
          value,
          unlocked_at
        )
        SELECT ?, ?, ?, ?, ?, DATETIME('now')
        WHERE NOT EXISTS (
          SELECT 1
          FROM user_achievement_milestone
          WHERE user_id = ?
            AND achievement_item_id = ?
            AND is_deleted = 0
        );`,
        [
          uuidv7(),
          milestone.userId,
          milestone.achievementId,
          milestone.achievementItemId,
          milestone.value,
          milestone.userId,
          milestone.achievementItemId,
        ],
      );
    }
  });
};

export const updateUserAchievements = async (
  db: SQLiteDatabase,
  userAchievements: AchievementProgressUpdate[],
) => {
  if (!userAchievements.length) return;

  await db.withTransactionAsync(async () => {
    for (const achievement of userAchievements) {
      await db.runAsync(
        `INSERT INTO user_achievement (
          id,
          user_id,
          achievement_id,
          input,
          current_value,
          updated_at
        )
        VALUES (
          ?, ?, ?, ?, ?, DATETIME('now')
        )
        ON CONFLICT(user_id, achievement_id)
        DO UPDATE SET
          current_value = excluded.current_value,
          updated_at = DATETIME('now');`,
        [
          uuidv7(),
          achievement.userId,
          achievement.achievementId,
          // input cần lấy từ ACHIEVEMENTS
          achievement.input,
          achievement.currentValue,
        ],
      );
    }
  });
};